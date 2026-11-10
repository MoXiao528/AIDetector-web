<template>
  <section
    v-if="evidenceEnabled && evidence"
    :aria-label="t('scan.evidence.presentation.title')"
    :class="['min-w-0 break-words', detailed ? 'space-y-4' : 'space-y-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm']"
    data-testid="evidence-panel"
  >
    <header>
      <h3 :class="[detailed ? 'text-lg' : 'text-sm', 'font-bold text-neutral-900']">{{ t('scan.evidence.presentation.title') }}</h3>
      <p v-if="statusMessage" class="mt-1 text-xs leading-5 text-neutral-600" data-testid="evidence-status">
        {{ statusMessage }}
      </p>
    </header>

    <template v-if="hasSignals">
      <p v-if="!detailed && !visibleDimensions.length" class="rounded-xl bg-neutral-50 p-3 text-sm leading-6 text-neutral-600" data-testid="evidence-empty-selection">{{ t(`scan.evidence.presentation.${visibleSignals.length ? 'noRecommendedDimension' : 'noRecommended'}`) }}</p>
      <template v-if="!detailed">
        <div v-if="visibleDimensions.length" class="divide-y divide-neutral-100">
          <button
            v-for="dimension in visibleDimensions"
            :key="dimension"
            type="button"
            :data-dimension="dimension"
            data-testid="evidence-summary"
            class="group flex w-full items-center gap-3 rounded-lg py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
            @click="emit('view-details', dimension, showAll)"
          >
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
              <component :is="dimensionIcons[dimension]" class="h-4 w-4" aria-hidden="true" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="block text-xs font-semibold text-neutral-900">{{ dimensionTitle(dimension) }}</span>
              <span class="mt-1 block text-xs leading-5 text-neutral-600">{{ summaries(dimension).join(t('scan.evidence.presentation.separator')) }}</span>
              <span v-if="showAll && visibleSummaryMetrics(dimension).some((metric) => isHighOverlap(signalFor(metric)!))" class="mt-1 block text-xs text-amber-800">{{ t('scan.evidence.presentation.highOverlap') }}</span>
            </span>
            <ChevronRightIcon class="h-4 w-4 shrink-0 text-neutral-400 group-hover:text-primary-700" aria-hidden="true" />
          </button>
        </div>
        <p v-if="hasComparisons" class="text-xs leading-5 text-neutral-500">{{ t('scan.evidence.presentation.baseline') }}</p>
        <div class="flex items-stretch gap-2">
          <button v-if="hiddenCount" type="button" data-testid="evidence-show-all" :aria-pressed="showAll" class="min-h-10 min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-xs font-semibold text-primary-800 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500" @click="setShowAll(!showAll)">
            {{ t(`scan.evidence.presentation.${showAll ? 'showRecommended' : 'showAll'}`) }}
          </button>
          <button type="button" :class="['min-h-10 shrink-0 rounded-xl border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-800 transition hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500', hiddenCount ? '' : 'flex-1']" @click="emit('view-details', visibleDimensions[0] || 'lexical', showAll)">
            {{ t('scan.evidence.presentation.viewDetails') }}
          </button>
        </div>
      </template>

      <template v-else>
        <p class="text-xs leading-5 text-neutral-600" data-testid="evidence-baseline">{{ t('scan.evidence.presentation.baseline') }}</p>
        <div class="liquid-glass relative inline-grid max-w-full grid-cols-2 items-center rounded-full p-1 text-xs font-semibold" role="group" :aria-label="t('scan.evidence.presentation.scopeLabel')" data-testid="evidence-scope-control">
          <span class="evidence-scope-selection liquid-glass liquid-glass-selected" :class="{ 'is-all': showAll }" aria-hidden="true" data-testid="evidence-scope-selection" />
          <button
            v-for="all in [false, true]"
            :key="String(all)"
            type="button"
            :data-testid="all ? 'evidence-show-all' : 'evidence-show-recommended'"
            :aria-pressed="showAll === all"
            :class="['relative min-h-10 min-w-0 rounded-full px-4 py-2 text-center transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500', showAll === all ? 'text-primary-700' : 'text-slate-600 hover:text-slate-900']"
            @click="setShowAll(all)"
          >{{ t(`scan.evidence.presentation.${all ? 'scopeAll' : 'scopeRecommended'}`) }}</button>
        </div>
        <p v-if="!visibleDimensions.length" class="rounded-xl bg-neutral-50 p-3 text-sm leading-6 text-neutral-600" data-testid="evidence-empty-selection">{{ t(`scan.evidence.presentation.${visibleSignals.length ? 'noRecommendedDimension' : 'noRecommended'}`) }}</p>
        <div v-if="visibleDimensions.length > 1" class="flex flex-wrap gap-2" role="group" :aria-label="t('scan.evidence.presentation.chooseDimension')">
          <button
            v-for="dimension in visibleDimensions"
            :key="dimension"
            type="button"
            :data-dimension="dimension"
            data-testid="evidence-dimension"
            :aria-pressed="selectedDimension === dimension"
            :class="['min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500', selectedDimension === dimension ? 'border-primary-600 bg-primary-600 text-white' : 'border-neutral-200 bg-white text-neutral-600 hover:bg-primary-50']"
            @click="selectedDimension = dimension"
          >{{ dimensionTitle(dimension) }}</button>
        </div>
        <div v-if="visibleDimensions.length" :aria-label="dimensionTitle(selectedDimension)" class="space-y-3">
          <article v-for="metric in visibleSummaryMetrics(selectedDimension)" :key="metric" :data-summary-metric="metric" data-testid="evidence-explanation" class="rounded-xl border border-neutral-200 bg-white p-4">
            <h4 class="text-sm font-semibold text-neutral-900">{{ t(`scan.evidence.presentation.metricNames.${metric}`) }}</h4>
            <p v-if="canCompare(metric)" class="mt-2 text-sm leading-6 text-neutral-700" data-testid="range-comparison-summary" :data-comparison-state="rangeComparison(metric)">{{ rangeComparisonText(metric) }}</p>
            <p v-else class="mt-2 text-sm leading-6 text-neutral-600" data-testid="metric-comparison-reason">{{ comparisonText(signalFor(metric)!) }}</p>
            <p v-if="isHighOverlap(signalFor(metric)!)" class="mt-1 text-xs leading-5 text-amber-800" data-testid="high-overlap">{{ t('scan.evidence.presentation.highOverlap') }}</p>
            <div v-if="canCompare(metric)" class="mt-4">
              <div class="flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-600">
                <p v-for="side in referenceSides" :key="side" class="flex items-center gap-2">
                  <span :class="['h-3 w-3 rounded-sm', side === 'human' ? 'bg-blue-300' : 'bg-violet-300']" aria-hidden="true"></span>
                  {{ t(`scan.evidence.presentation.${side}Band`) }}
                </p>
                <p v-if="bands[metric]?.overlap" class="flex items-center gap-2"><span class="reference-overlap h-3 w-3 rounded-sm" aria-hidden="true"></span>{{ t('scan.evidence.presentation.overlapBand') }}</p>
                <p v-if="bands[metric]" class="flex items-center gap-2"><span class="h-3 w-1 rounded-full bg-neutral-900" aria-hidden="true"></span>{{ t('scan.evidence.presentation.currentMarker') }}</p>
              </div>
              <div v-if="bands[metric]" data-testid="reference-values">
                <div class="relative mx-1 mt-5 h-7" data-testid="single-range-track" aria-hidden="true">
                  <div class="absolute inset-x-0 top-2 h-3 rounded-sm bg-neutral-100"></div>
                  <div v-for="side in referenceSides" :key="side" :data-testid="`${side}-range-band`" :class="['absolute top-2 h-3 min-w-[2px] rounded-sm', side === 'human' ? 'bg-blue-300' : 'bg-violet-300']" :style="{ left: bands[metric]![side].start + '%', width: (bands[metric]![side].end - bands[metric]![side].start) + '%' }"></div>
                  <div v-if="bands[metric]!.overlap" data-testid="overlap-range-band" class="reference-overlap absolute top-2 h-3 min-w-[2px] rounded-sm" :style="{ left: bands[metric]!.overlap!.start + '%', width: (bands[metric]!.overlap!.end - bands[metric]!.overlap!.start) + '%' }"></div>
                  <div data-testid="observed-marker" class="absolute top-0 h-7 w-1 -translate-x-1/2 rounded-full bg-neutral-900" :style="{ left: bands[metric]!.observed + '%' }">
                    <span v-if="bands[metric]!.outside" data-testid="edge-arrow" class="absolute -top-4 left-1/2 -translate-x-1/2 text-base leading-4">{{ bands[metric]!.outside === 'below' ? '←' : '→' }}</span>
                  </div>
                </div>
                <div v-if="!bands[metric]!.degenerate" class="mx-1 flex justify-between text-xs text-neutral-500" data-testid="reference-scale"><span>{{ t('scan.evidence.presentation.scaleLow') }}</span><span>{{ t('scan.evidence.presentation.scaleHigh') }}</span></div>
                <p v-else class="mt-1 text-xs leading-5 text-neutral-600" data-testid="degenerate-range">{{ t('scan.evidence.presentation.degenerateRange') }}</p>
                <p v-if="bands[metric]!.outside" class="mt-2 text-xs leading-5 text-neutral-700" data-testid="outside-reference">{{ t(`scan.evidence.presentation.outsideReference.${bands[metric]!.outside}`) }}</p>
              </div>
              <p v-else class="mt-2 text-xs leading-5 text-neutral-500" data-testid="reference-extent-unavailable">{{ t('scan.evidence.presentation.extentUnavailable') }}</p>
            </div>
          </article>
          <section v-for="group in exampleGroups.filter((group) => group.items.length)" :key="group.key" class="border-t border-neutral-100 pt-3" data-testid="evidence-examples">
            <h4 class="text-xs font-semibold text-neutral-800">{{ t(`scan.evidence.presentation.examples.${group.key}`) }}</h4>
            <ul class="mt-2 space-y-2">
              <li v-for="(example, index) in group.items" :key="index" class="flex items-start justify-between gap-3 text-sm">
                <span class="min-w-0 break-words">{{ example.text }}</span>
                <span class="shrink-0 text-xs leading-5 text-neutral-500">{{ t('scan.evidence.presentation.occurrences', { count: example.count }) }}</span>
              </li>
            </ul>
            <p class="mt-2 text-xs leading-5 text-neutral-500">{{ t('scan.evidence.presentation.exampleHint') }}</p>
          </section>
        </div>

        <details :open="notesOpen" class="border-t border-neutral-200" data-testid="evidence-professional" @toggle="notesOpen = ($event.target as HTMLDetailsElement).open">
          <summary class="cursor-pointer rounded py-3 text-sm font-semibold text-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500">{{ t('scan.evidence.presentation.detailsAndReference') }}</summary>
          <div class="space-y-4 pb-2 text-xs leading-5 text-neutral-600">
            <p data-testid="evidence-data-scope-note">{{ t('scan.evidence.presentation.dataScopeNote') }}</p>
            <div class="overflow-x-auto" role="region" :aria-label="t('scan.evidence.presentation.professional')" tabindex="0">
              <table class="w-full min-w-[32rem] border-collapse text-left">
                <caption class="sr-only">{{ t('scan.evidence.presentation.tableCaption') }}</caption>
                <thead class="text-neutral-600">
                  <tr>
                    <th scope="col" class="px-2 py-3">{{ t('scan.evidence.presentation.metric') }}</th>
                    <th scope="col" class="px-2 py-3">{{ t('scan.evidence.observed') }}</th>
                    <th scope="col" class="px-2 py-3">{{ t('scan.evidence.presentation.referenceComparison') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="signal in evidence.signals" :key="signal.metric" :data-metric="signal.metric" class="border-t border-neutral-100 align-top">
                    <th scope="row" class="w-1/3 px-2 py-3 font-normal">
                      <h4 class="font-semibold text-neutral-800">{{ t(`scan.evidence.metrics.${signal.metric}`) }}</h4>
                      <p v-if="hasDefinition(signal.metric)" class="mt-1" data-testid="metric-definition">{{ t(`scan.evidence.presentation.explanations.${signal.metric}`) }}</p>
                    </th>
                    <td class="px-2 py-3 tabular-nums"><span data-value="observed">{{ signal.observed === null ? t('scan.evidence.noObservation') : formatNumber(signal.observed) }}</span><span v-if="signal.observed !== null && metricUnit(signal.metric)" class="ml-1">{{ metricUnit(signal.metric) }}</span></td>
                    <td class="px-2 py-3">
                      <p data-testid="metric-comparison" :data-comparison-state="canCompare(signal.metric) ? rangeComparison(signal.metric) : undefined">{{ comparisonText(signal) }}</p>
                      <p v-if="isHighOverlap(signal)" class="mt-1 text-amber-800" data-testid="high-overlap">{{ t('scan.evidence.presentation.highOverlap') }}</p>
                      <ul v-if="signal.reasons.length" class="mt-1 space-y-1" data-testid="signal-reasons">
                        <li v-for="reason in signal.reasons" :key="reason">{{ reason === 'insufficient_observations' && observationRequirement(signal) ? t(`scan.evidence.presentation.requirements.${observationRequirement(signal)}`) : t(`scan.evidence.reasons.${reason}`) }}</li>
                      </ul>
                      <p v-if="signal.notice" class="mt-1" data-testid="evidence-notice">{{ t(`scan.evidence.notices.${signal.notice}`) }}</p>
                      <div v-for="side in referenceSides" :key="side" class="mt-2 tabular-nums">
                        <span>{{ t(`scan.evidence.presentation.${side}Band`) }}: </span><span :data-value="side">{{ signal.referenceRanges === null ? t('scan.evidence.noReference') : `${formatNumber(signal.referenceRanges[side][0])} – ${formatNumber(signal.referenceRanges[side][1])}` }}</span>
                        <span v-if="signal.referenceRanges !== null && signal.relation !== null" :data-value="`${side}-relation`" class="ml-2">{{ t(`scan.evidence.relation.${signal.relation[side]}`) }}</span>
                        <p v-if="signal.referenceRanges !== null && signal[`${side}Percentile`] !== null" class="text-neutral-500">{{ t('scan.evidence.presentation.percentile') }}: <span :data-value="`${side}-percentile`">{{ formatNumber(signal[`${side}Percentile`]!) }}</span></p>
                      </div>
                      <p v-if="canCompare(signal.metric) && signal.sampleCount !== null" class="mt-2 text-neutral-500">{{ t('scan.evidence.presentation.rangeSampleCount', { count: formatNumber(signal.sampleCount) }) }}</p>
                      <p v-if="signal.referenceExtent" class="mt-1 text-neutral-500" data-testid="reference-extent-values">{{ t('scan.evidence.presentation.scaleExtent') }}: <span :data-axis-min="signal.referenceExtent[0]">{{ formatNumber(signal.referenceExtent[0]) }}</span> – <span :data-axis-max="signal.referenceExtent[1]">{{ formatNumber(signal.referenceExtent[1]) }}</span></p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="space-y-2 border-t border-neutral-100 pt-3" data-testid="reference-source">
              <p>{{ t('scan.evidence.presentation.rangeMethodSummary') }} {{ t('scan.evidence.presentation.rangeCalculation') }}</p>
              <p data-testid="reference-group">{{ t('scan.evidence.presentation.referenceGroup') }}: {{ referenceGroup }}</p>
              <p>{{ t('scan.evidence.presentation.normalizationMethod') }}</p>
              <template v-if="sourceVersionKey">
                <p>{{ t('scan.evidence.presentation.datasetSource') }}: <a class="underline underline-offset-2" href="https://huggingface.co/datasets/WUJUNCHAO/DetectRL-X/blob/main/README.md" target="_blank" rel="noopener noreferrer">DetectRL-X · Binary General Open</a></p>
                <p v-if="usesShortReference">{{ t('scan.evidence.presentation.shortValidation') }}</p>
              </template>
              <p v-else>{{ t('scan.evidence.presentation.sourceUnavailable') }}</p>
              <p>{{ t('scan.evidence.presentation.sourceScope') }}</p>
              <ul v-if="evidence.quality.reasons.length" class="list-disc space-y-1 pl-4" data-testid="quality-reasons">
                <li v-for="reason in evidence.quality.reasons" :key="reason">{{ t(`scan.evidence.reasons.${reason}`) }}</li>
              </ul>
            </div>
          </div>
        </details>
      </template>
    </template>
    <details v-else-if="evidence.quality.reasons.length" class="text-xs leading-5 text-neutral-600" data-testid="evidence-failure-reasons">
      <summary class="cursor-pointer rounded py-2 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500">{{ t('scan.evidence.presentation.failureDetails') }}</summary>
      <ul class="mt-1 list-disc space-y-1 pl-4" data-testid="quality-reasons">
        <li v-for="reason in evidence.quality.reasons" :key="reason">{{ t(`scan.evidence.reasons.${reason}`) }}</li>
      </ul>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ArrowPathIcon, Bars3BottomLeftIcon, BookOpenIcon, ChevronRightIcon, LinkIcon } from '@heroicons/vue/24/outline';
import type { EvidenceResult, EvidenceSignal } from '../api/modules/scan';
import { useI18n } from '../i18n';
import { comparisonReasons, hasDistinctReference, isHighOverlap, observationRequirement, patternExamples, referenceBand, referenceOverlap, summaryMetrics, summaryState } from '../utils/evidencePresentation';

type Dimension = EvidenceSignal['dimension'];
const evidenceEnabled = import.meta.env.VITE_EVIDENCE_ENABLED !== 'false';
const props = withDefaults(defineProps<{
  evidence?: EvidenceResult | null;
  submittedText?: string;
  detailed?: boolean;
  initialDimension?: Dimension;
  initialShowAll?: boolean;
}>(), { submittedText: '', detailed: false, initialDimension: 'lexical', initialShowAll: false });
const emit = defineEmits<{
  'view-details': [dimension: Dimension, showAll: boolean];
  'update:showAll': [showAll: boolean];
}>();
const { t, locale } = useI18n();
const dimensions = Object.keys(summaryMetrics) as Dimension[];
const dimensionIcons = { lexical: BookOpenIcon, phrase_template: ArrowPathIcon, rhythm: Bars3BottomLeftIcon, discourse: LinkIcon };
const selectedDimension = ref<Dimension>(props.initialDimension);
watch(() => props.initialDimension, (value) => { selectedDimension.value = value; });
const showAll = ref(props.initialShowAll);
const notesOpen = ref(false);
const setShowAll = (value: boolean) => {
  if (showAll.value === value) return;
  showAll.value = value;
  emit('update:showAll', showAll.value);
};
watch(() => props.initialShowAll, (value) => { showAll.value = value; });
watch(() => props.evidence, () => {
  showAll.value = false;
  notesOpen.value = false;
  selectedDimension.value = props.initialDimension;
});
const referenceSides = ['human', 'ai'] as const;
const hasSignals = computed(() => props.evidence && ['ready', 'partial', 'insufficient'].includes(props.evidence.status));
const statusMessage = computed(() => {
  if (!props.evidence) return '';
  if (['ready', 'partial'].includes(props.evidence.status)) return '';
  const reasons = comparisonReasons(props.evidence);
  return reasons.length
    ? reasons.map((reason) => t(`scan.evidence.presentation.comparisonReasons.${reason}`)).join(' ')
    : t(`scan.evidence.presentation.status.${props.evidence.status}`);
});
const numberFormat = computed(() => new Intl.NumberFormat(locale.value, { maximumFractionDigits: 4 }));
const formatNumber = (value: number) => numberFormat.value.format(value === 0 ? 0 : value);
const signalFor = (metric: string) => props.evidence?.signals.find((signal) => signal.metric === metric);
const dimensionTitle = (dimension: Dimension) => t(`scan.evidence.presentation.dimensions.${dimension}`);
const summary = (metric: string) => {
  const signal = signalFor(metric);
  const state = summaryState(signal, props.evidence!.status);
  if (state === 'missing') {
    const requirement = observationRequirement(signal);
    return requirement ? t(`scan.evidence.presentation.requirements.${requirement}`)
      : t('scan.evidence.presentation.missing', { metric: t(`scan.evidence.presentation.metricNames.${metric}`) });
  }
  if (state === 'uncompared') {
    return t(`scan.evidence.presentation.facts.${metric}`, { value: formatNumber(signal!.observed!), unit: metricUnit(metric) });
  }
  return t(`scan.evidence.presentation.summaries.${metric}.${state}`);
};
const canCompare = (metric: string) => {
  const signal = signalFor(metric);
  return Boolean(props.evidence && ['ready', 'partial'].includes(props.evidence.status)
    && signal && signal.observed !== null && Number.isFinite(signal.observed)
    && signal.relation !== null && referenceOverlap(signal) !== null);
};
const rangeComparison = (metric: string) => {
  const relation = signalFor(metric)!.relation!;
  const human = relation.human === 'within';
  const ai = relation.ai === 'within';
  return human && ai ? 'both' : human ? 'human' : ai ? 'ai' : 'neither';
};
const rangeComparisonText = (metric: string) => {
  const state = rangeComparison(metric);
  const otherSide = state === 'human' ? 'ai' : 'human';
  const position = state === 'human' || state === 'ai'
    ? t(`scan.evidence.presentation.rangeDirection.${signalFor(metric)!.relation![otherSide]}`) : '';
  return t(`scan.evidence.presentation.rangeComparison.${state}`, { position });
};
const recommendedSignals = computed(() => props.evidence?.signals.filter((signal) => canCompare(signal.metric) && hasDistinctReference(signal)) ?? []);
const hiddenCount = computed(() => (props.evidence?.signals.length ?? 0) - recommendedSignals.value.length);
const visibleSignals = computed(() => showAll.value ? props.evidence?.signals ?? [] : recommendedSignals.value);
const visibleSummaryMetrics = (dimension: Dimension) => summaryMetrics[dimension].filter((metric) => visibleSignals.value.some((signal) => signal.metric === metric));
const visibleDimensions = computed(() => dimensions.filter((dimension) => visibleSummaryMetrics(dimension).length));
watch([visibleDimensions, () => props.initialDimension], () => {
  if (!visibleDimensions.value.includes(selectedDimension.value)) {
    selectedDimension.value = visibleDimensions.value[0] || props.initialDimension;
  }
}, { immediate: true });
const summaries = (dimension: Dimension) => visibleSummaryMetrics(dimension).map(summary);
const metricComparisonReason = (metric: string) => t(`scan.evidence.presentation.${signalFor(metric)?.reasons.includes('reference_validation_failed') ? 'unvalidatedReference' : 'observationOnly'}`);
const hasDefinition = (metric: string) => [...Object.values(summaryMetrics).flat(), 'paragraph_length_cv'].includes(metric);
const comparisonText = (signal: EvidenceSignal) => {
  if (canCompare(signal.metric)) return rangeComparisonText(signal.metric);
  if (signal.observed === null || !Number.isFinite(signal.observed)) {
    const requirement = observationRequirement(signal);
    return requirement ? t(`scan.evidence.presentation.requirements.${requirement}`) : t('scan.evidence.noObservation');
  }
  return metricComparisonReason(signal.metric);
};
const hasComparisons = computed(() => props.evidence?.signals.some((signal) => canCompare(signal.metric)));
const bands = computed(() => Object.fromEntries(visibleSummaryMetrics(selectedDimension.value).map((metric) => {
  const signal = signalFor(metric);
  return [metric, signal && canCompare(metric) ? referenceBand(signal) : null];
})));
const exampleGroups = computed(() => {
  if (selectedDimension.value !== 'phrase_template') return [];
  const groups = [
    ['repeated_phrases', 'repeat_ngram_coverage'],
    ['sentence_start_templates', 'sentence_start_repeat'],
  ] as const;
  return groups.filter(([, metric]) => visibleSignals.value.some((signal) => signal.metric === metric)).map(([key]) => ({
    key,
    items: patternExamples(props.evidence?.patterns?.[key], props.submittedText),
  }));
});
const metricUnits: Record<string, string> = {
  mattr: 'ratio', token_entropy: 'bit', entropy_per_log_vocab: 'ratio', hapax_type_ratio: 'ratio', top_token_concentration: 'ratio',
  repeat_ngram_coverage: 'ratio', sentence_start_repeat: 'ratio', sentence_length_median: 'length', sentence_length_iqr: 'length',
  sentence_length_cv: 'coefficient', sentence_adjacent_change_median: 'length', paragraph_length_median: 'length', paragraph_length_iqr: 'length',
  paragraph_length_cv: 'coefficient', punctuation_per_1k: 'per1kLength', punctuation_entropy: 'bit', transition_per_1k: 'per1kTokens',
  transition_diversity: 'ratio', paragraph_adjacent_jaccard: 'ratio', paragraph_nonadjacent_jaccard_q90: 'ratio', intro_conclusion_jaccard: 'ratio', section_heading_count: 'count',
};
const metricUnit = (metric: string) => {
  const unit = metricUnits[metric];
  const lengthUnit = props.evidence?.route?.language === 'zh' ? 'han' : 'tokens';
  if (unit === 'length') return t(`scan.evidence.units.${lengthUnit}`);
  if (unit === 'per1kLength') return t(`scan.evidence.units.per1k.${lengthUnit}`);
  return t(`scan.evidence.units.${unit}`);
};
const sourceVersionKey = computed(() => {
  switch (props.evidence?.artifactVersion) {
    case '8abe24fc7e7747f4e2e9b90a80bf26b7999726373fa80e8519a97dffbe7014b2': return 'sourceV1';
    case 'f04fee602a09850adae31e5e78ea9926a27cd96663aeeeaeaafb11d8a959fb0e': return 'sourceShortZh';
    default: return null;
  }
});
const usesShortReference = computed(() => hasComparisons.value && sourceVersionKey.value === 'sourceShortZh'
  && props.evidence?.route?.language === 'zh' && props.evidence.route.lengthBucket.startsWith('brief_'));
const referenceGroup = computed(() => {
  const route = props.evidence?.route;
  if (!route || route.fallbackLevel === 'unavailable') return t('scan.evidence.route.values.fallbackLevel.unavailable');
  const fields: (keyof typeof route)[] = ['language'];
  if (route.fallbackLevel === 'exact') fields.push('domain');
  if (route.fallbackLevel !== 'language') fields.push('lengthBucket');
  return [...fields.map((field) => t(`scan.evidence.route.values.${field}.${route[field]}`)),
    t(`scan.evidence.route.values.fallbackLevel.${route.fallbackLevel}`)].join(' · ');
});
</script>

<style scoped>
.evidence-scope-selection {
  position: absolute;
  inset: 4px auto 4px 4px;
  width: calc((100% - 8px) / 2);
  border-radius: 999px;
  pointer-events: none;
  transition: transform 200ms cubic-bezier(0.2, 0.7, 0.2, 1);
}
.evidence-scope-selection.is-all { transform: translateX(100%); }
@media (prefers-reduced-motion: reduce) {
  .evidence-scope-selection { transition: none; }
}
.reference-overlap {
  background: repeating-linear-gradient(135deg, #e2e8f0 0px, #e2e8f0 4px, #94a3b8 4px, #94a3b8 5px);
}
</style>
