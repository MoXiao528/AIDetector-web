<template>
  <TransitionRoot as="template" :show="open" @after-leave="restoreTriggerFocus">
    <Dialog class="relative z-50" :initial-focus="closeButton" @close="emit('close')">
      <TransitionChild as="template" enter="transition-opacity duration-150 motion-reduce:transition-none" enter-from="opacity-0" enter-to="opacity-100" leave="transition-opacity duration-150 motion-reduce:transition-none" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-slate-900/35 backdrop-blur-sm" aria-hidden="true"></div>
      </TransitionChild>
      <div class="fixed inset-0 flex items-center justify-center p-2 sm:p-5">
        <DialogPanel class="public-theme flex max-h-[calc(100dvh-1rem)] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-200 font-sans shadow-xl sm:max-h-[calc(100dvh-2.5rem)]" style="background: #fff" data-testid="usage-examples-dialog">
          <header class="shrink-0 border-b border-slate-200 px-4 py-4 sm:px-6">
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-xs font-semibold text-primary-700">{{ t('usageExamples.badge') }}</p>
                <DialogTitle as="h2" class="mt-1 text-xl font-bold text-slate-900">{{ t('usageExamples.title') }}</DialogTitle>
                <DialogDescription class="mt-1 text-xs leading-5 text-slate-500">{{ t('usageExamples.subtitle') }}</DialogDescription>
              </div>
              <button ref="closeButton" type="button" class="liquid-glass flex h-10 w-10 shrink-0 items-center justify-center rounded-full" :aria-label="t('loginPrompt.close')" @click="emit('close')">
                <XMarkIcon class="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div v-if="examples.length" class="mt-4 flex flex-wrap gap-2" role="group" :aria-label="t('usageExamples.title')">
              <button v-for="item in examples" :key="item.key" type="button" :data-testid="'example-tab-' + item.key" :aria-pressed="report?.key === item.key" :class="['liquid-glass min-h-10 rounded-full px-4 py-2 text-sm font-semibold', report?.key === item.key ? 'liquid-glass-selected' : '']" @click="selectExample(item.key)">
                {{ t('usageExamples.tabs.' + item.key) }}
              </button>
            </div>
          </header>

          <div ref="scrollArea" class="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#F4F7FB] p-3 sm:p-6">
            <template v-if="report">
              <div class="mb-4">
                <h3 class="text-lg font-bold text-slate-900">{{ t('usageExamples.titles.' + report.key) }}</h3>
              </div>
              <div class="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_21rem]">
                <section ref="readingArea" tabindex="-1" class="order-2 min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white lg:order-1" :aria-label="viewTitle">
                  <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
                    <h3 class="text-sm font-bold text-slate-900">{{ viewTitle }}</h3>
                    <button v-if="view !== 'original'" type="button" class="liquid-glass min-h-9 rounded-full px-3 py-1.5 text-xs font-semibold" @click="view = 'original'">{{ t('usageExamples.back') }}</button>
                    <button v-else type="button" class="liquid-glass min-h-9 rounded-full px-3 py-1.5 text-xs font-semibold" @click="view = 'paragraphs'">{{ t('usageExamples.details') }}</button>
                  </div>
                  <div v-if="view === 'original'" class="px-4 py-5 sm:px-6">
                    <div class="example-document text-base leading-7 text-slate-800" data-testid="example-original" v-html="highlightedHtml"></div>
                    <p class="mt-6 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">{{ t('usageExamples.highlightHint') }}</p>
                  </div>
                  <div v-else-if="view === 'paragraphs'" class="divide-y divide-slate-100 px-4 sm:px-6" data-testid="example-paragraphs">
                    <article v-for="(paragraph, index) in report.analysis.sentences" :key="paragraph.id || index" class="py-4">
                      <div class="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold">
                        <span class="text-slate-500">{{ paragraphDisplayLabels[index] }}</span>
                        <span v-if="paragraph.type !== 'metadata'" class="text-primary-800">{{ formatParagraphLabel(paragraph) }}</span>
                      </div>
                      <p class="whitespace-pre-line break-words text-sm leading-7 text-slate-700">{{ paragraph.raw || paragraph.text }}</p>
                    </article>
                  </div>
                  <div v-else class="p-4 sm:p-5" data-testid="example-evidence-details">
                    <EvidencePanel :key="report.key + '-details'" :evidence="report.evidence" :submitted-text="report.text" detailed :initial-dimension="evidenceDimension" :initial-show-all="evidenceShowAll" @update:show-all="evidenceShowAll = $event" />
                  </div>
                </section>

                <aside class="contents lg:order-2 lg:block lg:space-y-4">
                  <section class="order-1 min-w-0 rounded-xl border border-slate-200 bg-white p-5" :aria-label="t('scan.results.summary.title')">
                    <h3 class="text-sm font-bold text-slate-900">{{ t('scan.results.summary.title') }}</h3>
                    <div class="mb-5 mt-4 flex items-end gap-3">
                      <span class="text-5xl font-bold tracking-tight text-slate-900" data-testid="example-ai-score">{{ report.analysis.summary.ai }}%</span>
                      <span class="mb-1 text-sm text-slate-500">{{ t('scan.results.summary.label') }}</span>
                    </div>
                    <div class="space-y-4">
                      <div v-for="side in ['ai', 'human']" :key="side">
                        <div class="mb-1.5 flex justify-between gap-3 text-xs font-semibold text-slate-600">
                          <span>{{ t('scan.results.summary.' + side) }}</span><span class="tabular-nums text-slate-900">{{ report.analysis.summary[side] }}%</span>
                        </div>
                        <div class="h-1.5 overflow-hidden rounded-full bg-[#eef1f5]">
                          <div class="h-full rounded-full" :style="{ width: report.analysis.summary[side] + '%', background: side === 'ai' ? '#3478f6' : '#0787a5' }"></div>
                        </div>
                      </div>
                    </div>
                    <p v-if="report.key === 'human' && report.label === 'ai'" class="mt-4 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-600" data-testid="example-source-note">{{ t('usageExamples.sourceMismatch') }}</p>
                  </section>
                  <EvidencePanel v-if="evidenceEnabled && report.evidence" :key="report.key" class="order-3" :evidence="report.evidence" :submitted-text="report.text" :initial-show-all="evidenceShowAll" @update:show-all="evidenceShowAll = $event" @view-details="openEvidenceDetails" />
                  <p v-else-if="evidenceEnabled" class="order-3 px-1 text-xs leading-5 text-slate-500">{{ t('usageExamples.missingEvidence') }}</p>
                  <p class="order-4 px-1 text-xs leading-5 text-slate-500">{{ t('usageExamples.frozenNote') }}</p>
                </aside>
              </div>
            </template>
            <p v-else class="py-12 text-center text-sm text-slate-600">{{ t('usageExamples.empty') }}</p>
          </div>

          <footer class="flex shrink-0 flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p class="text-xs leading-5 text-slate-500">{{ t('usageExamples.footerNote') }}</p>
            <button type="button" class="primary-action liquid-glass min-h-11 shrink-0 rounded-full px-5 py-2 text-sm font-semibold" @click="tryOwnText">{{ t('usageExamples.cta') }}</button>
          </footer>
        </DialogPanel>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import { Dialog, DialogDescription, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
import { XMarkIcon } from '@heroicons/vue/24/outline';
import { useI18n } from '../../i18n';
import EvidencePanel from '../EvidencePanel.vue';
import { buildHighlightedPreviewHtml, buildSentenceDisplayLabels } from '../../utils/editorContent';

const props = defineProps({
  open: { type: Boolean, default: false },
  examples: { type: Array, default: () => [] },
});
const emit = defineEmits(['close', 'try-own']);
const { t } = useI18n();
const formatParagraphLabel = (paragraph) => {
  if (paragraph.type === 'too_short') return t('scan.results.tooShort');
  return t('usageExamples.paragraphProbability', { value: Math.round(paragraph.probability * 100) });
};
const evidenceEnabled = import.meta.env.VITE_EVIDENCE_ENABLED !== 'false';
const selectedKey = ref('');
const view = ref('original');
const evidenceDimension = ref('lexical');
const evidenceShowAll = ref(false);
watch(selectedKey, () => {
  evidenceShowAll.value = false;
  evidenceDimension.value = 'lexical';
});
const closeButton = ref(null);
const scrollArea = ref(null);
const readingArea = ref(null);
let returnFocusTarget = null;
let focusOwnInput = false;
const report = computed(() => props.examples.find((item) => item.key === selectedKey.value) || props.examples[0]);
const paragraphDisplayLabels = computed(() => buildSentenceDisplayLabels(report.value?.analysis.sentences || [], t));
const viewTitle = computed(() => t('usageExamples.' + (view.value === 'evidence' ? 'evidenceDetails' : view.value === 'paragraphs' ? 'details' : 'original')));
const highlightedHtml = computed(() => report.value ? buildHighlightedPreviewHtml({
  // Saved plain-text examples use blank lines as paragraph separators, not empty editor blocks.
  fallbackText: report.value.text.replace(/\r\n/g, '\n').replace(/\n(?:[ \t]*\n)+/g, '\n'),
  sentences: report.value.analysis.sentences,
}) : '');

watch(() => props.open, (isOpen) => {
  if (!isOpen) return;
  returnFocusTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  focusOwnInput = false;
  selectedKey.value = props.examples[0]?.key || '';
  view.value = 'original';
}, { immediate: true });

const restoreTriggerFocus = async () => {
  await nextTick();
  if (props.open) return;
  if (focusOwnInput) emit('try-own');
  else if (returnFocusTarget?.isConnected && !returnFocusTarget.matches(':disabled, [aria-disabled="true"]')) returnFocusTarget.focus({ preventScroll: true });
};
const tryOwnText = () => {
  focusOwnInput = true;
  emit('close');
};
const selectExample = (key) => {
  selectedKey.value = key;
  view.value = 'original';
  scrollArea.value?.scrollTo({ top: 0 });
};
const openEvidenceDetails = async (dimension, showAll) => {
  evidenceDimension.value = dimension;
  evidenceShowAll.value = showAll;
  view.value = 'evidence';
  await nextTick();
  readingArea.value?.scrollIntoView({ block: 'start' });
  readingArea.value?.focus({ preventScroll: true });
};
</script>

<style scoped>
.example-document :deep(p) { margin: 0 0 0.75rem; overflow-wrap: anywhere; }
.example-document :deep(p:last-child) { margin-bottom: 0; }
.example-document :deep(.highlight-chip) { padding: 1px 2px; border-radius: 3px; box-decoration-break: clone; }
</style>
