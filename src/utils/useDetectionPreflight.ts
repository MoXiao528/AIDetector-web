import { computed, onScopeDispose, ref, watch, type Ref } from 'vue';
import type { DetectionPreflight } from '../api/modules/scan';
import { countCharacters, countVisibleCharacters, getEstimatedAdditionalCharacters } from './detectionLength';

type PreflightStatus = 'empty' | 'paused' | 'waiting' | 'checking' | 'ready' | 'short' | 'error' | 'too_long';

export const useDetectionPreflight = ({ text, actorKey, enabled = ref(true), limit, request }: {
  text: Readonly<Ref<string>>;
  actorKey: Readonly<Ref<string>>;
  enabled?: Readonly<Ref<boolean>>;
  limit: number;
  request: (text: string, signal: AbortSignal) => Promise<DetectionPreflight>;
}) => {
  const status = ref<PreflightStatus>('empty');
  const estimate = ref<number | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  let sequence = 0;
  let disposed = false;

  const cancel = () => {
    sequence += 1;
    clearTimeout(timer);
    timer = undefined;
    controller?.abort();
    controller = undefined;
    estimate.value = null;
  };

  const prepare = () => {
    cancel();
    if (!enabled.value) {
      status.value = 'paused';
      return false;
    }
    status.value = countCharacters(text.value) > limit
      ? 'too_long'
      : countVisibleCharacters(text.value) ? 'waiting' : 'empty';
    return status.value === 'waiting' && !disposed;
  };

  const run = async () => {
    if (!prepare()) return;
    const currentSequence = sequence;
    const currentText = text.value;
    const currentActor = actorKey.value;
    const activeController = new AbortController();
    controller = activeController;
    status.value = 'checking';
    const isCurrent = () => !disposed && currentSequence === sequence &&
      currentText === text.value && currentActor === actorKey.value && !activeController.signal.aborted;
    try {
      const response = await request(currentText, activeController.signal);
      if (!isCurrent()) return;
      status.value = response.ready ? 'ready' : 'short';
      estimate.value = getEstimatedAdditionalCharacters(response.estimatedAdditionalCharacters);
    } catch {
      if (isCurrent()) status.value = 'error';
    } finally {
      if (controller === activeController) controller = undefined;
    }
  };

  watch([text, actorKey, enabled], () => {
    // Synchronous invalidation prevents a ready result for the previous text being reused.
    if (prepare()) timer = setTimeout(run, 500);
  }, { immediate: true, flush: 'sync' });

  const rejectSubmission = (submittedText: string, additionalCharacters: number | null) => {
    if (disposed || !enabled.value || text.value !== submittedText) return;
    cancel();
    status.value = 'short';
    estimate.value = getEstimatedAdditionalCharacters(additionalCharacters);
  };

  onScopeDispose(() => {
    disposed = true;
    cancel();
    status.value = 'empty';
  });

  return { status, estimate, ready: computed(() => status.value === 'ready'), retry: run, rejectSubmission };
};
