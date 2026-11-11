import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref } from 'vue';
import { useDetectionPreflight } from './useDetectionPreflight';
import { countCharacters, countVisibleCharacters, formatShortTextMessage, getShortTextEstimate } from './detectionLength';

const result = (ready = true, estimate: number | null = null) => ({
  characterCount: 200, tokenCount: ready ? 256 : 100, minimumTokens: 256,
  ready, estimatedAdditionalCharacters: estimate,
});
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise; });
  return { promise, resolve };
};

describe('实时长度预检', () => {
  const scopes: ReturnType<typeof effectScope>[] = [];
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    scopes.splice(0).forEach((scope) => scope.stop());
    vi.useRealTimers();
  });
  const setup = (initialText = '') => {
    const text = ref(initialText);
    const actorKey = ref('guest:a');
    const enabled = ref(true);
    const request = vi.fn(async (_text: string, _signal: AbortSignal) => result());
    const scope = effectScope();
    scopes.push(scope);
    const preflight = scope.run(() => useDetectionPreflight({ text, actorKey, enabled, limit: 20000, request }))!;
    return { text, actorKey, enabled, request, scope, preflight };
  };

  it('暂停时取消请求和ready，恢复后重新防抖检查当前文本，旧响应不能恢复ready', async () => {
    const { text, enabled, request, preflight } = setup('first');
    await preflight.retry();
    expect(preflight.ready.value).toBe(true);
    enabled.value = false;
    expect(preflight.ready.value).toBe(false);
    expect(preflight.status.value).toBe('paused');
    text.value = 'preview text';
    await preflight.retry();
    await vi.advanceTimersByTimeAsync(1000);
    expect(request).toHaveBeenCalledTimes(1);

    const oldResponse = deferred<ReturnType<typeof result>>();
    request.mockReturnValueOnce(oldResponse.promise);
    enabled.value = true;
    await vi.advanceTimersByTimeAsync(499);
    expect(request).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    const signal = request.mock.calls[1][1];
    enabled.value = false;
    expect(signal.aborted).toBe(true);
    oldResponse.resolve(result());
    await Promise.resolve();
    expect(preflight.status.value).toBe('paused');

    text.value = 'latest text';
    enabled.value = true;
    await vi.advanceTimersByTimeAsync(500);
    expect(request.mock.lastCall?.[0]).toBe('latest text');
    expect(preflight.ready.value).toBe(true);
  });

  it('输入停500ms才请求，使用最后一次完整文本', async () => {
    const { text, request, preflight } = setup();
    text.value = 'first';
    await vi.advanceTimersByTimeAsync(499);
    expect(request).not.toHaveBeenCalled();
    text.value = 'last';
    await vi.advanceTimersByTimeAsync(499);
    expect(request).not.toHaveBeenCalled();
    expect(preflight.ready.value).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0][0]).toBe('last');
    expect(preflight.ready.value).toBe(true);
  });

  it('改字立即废弃ready并取消旧请求，乱序响应不能恢复旧状态', async () => {
    const { text, request, preflight } = setup('ready');
    await vi.advanceTimersByTimeAsync(500);
    expect(preflight.ready.value).toBe(true);
    const oldResponse = deferred<ReturnType<typeof result>>();
    request.mockReturnValueOnce(oldResponse.promise);
    text.value = 'slow old';
    expect(preflight.ready.value).toBe(false);
    await vi.advanceTimersByTimeAsync(500);
    const oldSignal = request.mock.calls[1][1];
    text.value = 'new short';
    expect(oldSignal.aborted).toBe(true);
    request.mockResolvedValueOnce(result(false, 430));
    await vi.advanceTimersByTimeAsync(500);
    oldResponse.resolve(result());
    await Promise.resolve();
    expect(preflight.status.value).toBe('short');
    expect(preflight.estimate.value).toBe(430);
  });

  it.each(['empty', 'over limit', 'actor', 'unmount'])('%s清理进行中的预检及结果', async (change) => {
    const { text, actorKey, request, scope, preflight } = setup('original');
    const pending = deferred<ReturnType<typeof result>>();
    request.mockReturnValueOnce(pending.promise);
    await vi.advanceTimersByTimeAsync(500);
    const signal = request.mock.calls[0][1];
    if (change === 'empty') text.value = ' \n\u0085';
    if (change === 'over limit') text.value = '😀'.repeat(20001);
    if (change === 'actor') actorKey.value = 'user:b';
    if (change === 'unmount') scope.stop();
    expect(signal.aborted).toBe(true);
    pending.resolve(result());
    await Promise.resolve();
    expect(preflight.ready.value).toBe(false);
    if (change === 'empty') expect(preflight.status.value).toBe('empty');
    if (change === 'over limit') expect(preflight.status.value).toBe('too_long');
    if (change !== 'actor') {
      await vi.advanceTimersByTimeAsync(1000);
      expect(request).toHaveBeenCalledTimes(1);
    }
  });

  it('失败后可直接重试，下一次输入也可恢复', async () => {
    const { text, request, preflight } = setup('text');
    request.mockRejectedValueOnce(new Error('offline'));
    await vi.advanceTimersByTimeAsync(500);
    expect(preflight.status.value).toBe('error');
    await preflight.retry();
    expect(preflight.ready.value).toBe(true);
    text.value = 'more text';
    expect(preflight.ready.value).toBe(false);
    await vi.advanceTimersByTimeAsync(500);
    expect(preflight.ready.value).toBe(true);
  });

  it('正式提交长度不足撤销ready，但旧快照失败不覆盖新文本预检', async () => {
    const { text, preflight } = setup('first');
    await preflight.retry();
    preflight.rejectSubmission('first', 18);
    expect(preflight.ready.value).toBe(false);
    expect(preflight.estimate.value).toBe(18);
    text.value = 'second';
    await preflight.retry();
    preflight.rejectSubmission('first', 80);
    expect(preflight.ready.value).toBe(true);
    expect(preflight.estimate.value).toBeNull();
  });

  it('emoji按码点计，Python空白与BOM口径对齐，格式化不足提示不泄漏token', () => {
    expect(countCharacters('中😀 A')).toBe(4);
    expect(countVisibleCharacters('中😀 A\u0085\u001c\ufeff')).toBe(4);
    const error = { details: { detail: { tokenCount: 100, minimumTokens: 256, estimatedAdditionalCharacters: 31 } } };
    expect(getShortTextEstimate(error)).toBe(31);
    expect(formatShortTextMessage(31, (key, values) => `${key}:${JSON.stringify(values)}`))
      .toBe('scan.editor.minDetectRemaining:{"remaining":31}');
    expect(getShortTextEstimate({})).toBeNull();
  });
});
