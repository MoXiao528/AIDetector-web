<template>
  <section
    v-if="evidence"
    :aria-label="t('scan.evidence.presentation.title')"
    :class="['min-w-0 space-y-4 break-words', detailed ? '' : 'rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm']"
    data-testid="evidence-panel"
  >
    <header>
      <h3 :class="[detailed ? 'text-lg' : 'text-sm', 'font-bold text-neutral-900']">{{ t('scan.evidence.presentation.title') }}</h3>
      <p v-if="statusMessage" class="mt-1 text-xs leading-5 text-neutral-600" data-testid="evidence-status">
        {{ statusMessage }}
      </p>
    </header>

    <template v-if="hasSignals">
      <div v-if="hiddenCount" class="space-y-2" data-testid="evidence-filter">
        <p class="text-xs leading-5 text-neutral-500">{{ t('scan.evidence.presentation.filterHint') }}</p>
        <button type="button" data-testid="evidence-show-all" :aria-pressed="showAll" class="min-h-10 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-primary-800 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500" @click="showAll = !showAll">
          {{ t(`scan.evidence.presentation.${showAll ? 'showRecommended' : 'showAll'}`, { count: hiddenCount }) }}
        </button>
      </div>
      <p v-if="!visibleDimensions.length" class="rounded-xl bg-neutral-50 p-3 text-sm leading-6 text-neutral-600" data-testid="evidence-empty-selection">{{ t(`scan.evidence.presentation.${visibleSignals.length ? 'noRecommendedDimension' : 'noRecommended'}`) }}</p>
      <template v-if="!detailed">
        <div class="divide-y divide-neutral-100">
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
        <button type="button" class="min-h-10 w-full rounded-xl border border-primary-200 px-3 py-2 text-xs font-semibold text-primary-800 transition hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500" @click="emit('view-details', visibleDimensions[0] || 'lexical', showAll)">
          {{ t('scan.evidence.presentation.viewDetails') }}
        </button>
      </template>

      <template v-else>
        <p v-if="hasComparisons" class="text-xs leading-5 text-neutral-600">{{ t('scan.evidence.presentation.baseline') }}</p>
        <div v-if="visibleDimensions.length" class="flex flex-wrap gap-2" role="group" :aria-label="t('scan.evidence.presentation.chooseDimension')">
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
          <article v-for="metric in visibleSummaryMetrics(selectedDimension)" :key="metric" :data-summary-metric="metric" data-testid="evidence-explanation" class="rounded-2xl border border-neutral-200 bg-white p-4">
            <h4 class="text-sm font-semibold text-neutral-900">{{ t(`scan.evidence.presentation.metricNames.${metric}`) }}</h4>
            <p v-if="isHighOverlap(signalFor(metric)!)" class="mt-2 text-xs leading-5 text-amber-800" data-testid="high-overlap" :title="t('scan.evidence.presentation.overlapHint')">{{ t('scan.evidence.presentation.highOverlap') }}</p>
            <p v-if="summaryState(signalFor(metric), evidence.status) !== 'uncompared'" class="mt-2 text-sm font-medium leading-6 text-primary-800">{{ summary(metric) }}</p>
            <template v-if="signalFor(metric)?.observed != null">
              <div class="mt-4 flex flex-wrap justify-between gap-2 text-xs text-neutral-600">
                <span>{{ t(`scan.evidence.presentation.${metric === 'mattr' ? 'lexicalIndex' : 'thisText'}`) }}: <strong class="font-semibold tabular-nums text-neutral-900">{{ formatNumber(signalFor(metric)!.observed!) }}</strong>{{ metric === 'mattr' ? '' : ' ' + metricUnit(metric) }}</span>
              </div>
              <p v-if="metric === 'mattr'" class="mt-2 text-xs leading-5 text-neutral-600" data-testid="lexical-definition">{{ t('scan.evidence.presentation.explanations.mattr') }}</p>
              <p v-if="!canCompare(metric)" class="mt-2 text-xs leading-5 text-neutral-500" data-testid="metric-comparison-reason">{{ metricComparisonReason(metric) }}</p>
              <p v-else class="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-xs leading-5 text-neutral-700" data-testid="range-comparison-summary" :data-comparison-state="rangeComparison(metric)">{{ rangeComparisonText(metric) }}</p>
              <div v-if="canCompare(metric)" class="mt-3">
                <div class="flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-600">
                  <p v-for="side in referenceSides" :key="side" class="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span :class="['h-3 w-3 rounded-sm', side === 'human' ? 'bg-blue-300' : 'bg-violet-300']" aria-hidden="true"></span>
                    <span>{{ t(`scan.evidence.presentation.${side}Band`) }}</span>
                    <span class="tabular-nums" :data-range-label="side">{{ signalFor(metric)!.referenceRanges![side].map(formatNumber).join(' – ') }}</span>
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
                  <template v-if="!bands[metric]!.degenerate">
                    <div class="relative mx-1 h-5 text-[11px] tabular-nums text-neutral-500" data-testid="reference-ticks" :aria-label="t('scan.evidence.presentation.normalizedAxis')"><span v-for="tick in bands[metric]!.ticks" :key="tick" :class="['absolute', tick === 0 ? '' : tick === 100 ? '-translate-x-full' : '-translate-x-1/2']" :style="{ left: tick + '%' }">{{ formatNumber(tick) }}%</span></div>
                    <div class="mt-1 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs tabular-nums text-neutral-600">
                      <span :data-axis-min="bands[metric]!.min">{{ t('scan.evidence.presentation.axisEndpoint', { percent: 0, value: formatNumber(bands[metric]!.min) }) }}</span>
                      <span :data-axis-max="bands[metric]!.max">{{ t('scan.evidence.presentation.axisEndpoint', { percent: 100, value: formatNumber(bands[metric]!.max) }) }}</span>
                    </div>
                  </template>
                  <p v-else class="mt-1 text-xs leading-5 text-neutral-600" data-testid="degenerate-range">{{ t('scan.evidence.presentation.degenerateRange', { value: formatNumber(bands[metric]!.min) }) }}</p>
                  <p class="mt-2 text-xs leading-5 text-neutral-500">{{ t('scan.evidence.presentation.axisScope') }}</p>
                  <p v-if="bands[metric]!.outside" class="mt-2 text-xs leading-5 text-neutral-700" data-testid="outside-reference">{{ t(`scan.evidence.presentation.outsideReference.${bands[metric]!.outside}`, { value: formatNumber(signalFor(metric)!.observed!) }) }}</p>
                </div>
                <p v-else class="mt-2 text-xs leading-5 text-neutral-500" data-testid="reference-extent-unavailable">{{ t('scan.evidence.presentation.extentUnavailable') }}</p>
              </div>
              <details v-if="canCompare(metric)" class="mt-3 text-xs leading-5 text-neutral-600" data-testid="range-method">
                <summary class="w-fit cursor-pointer rounded font-medium text-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500">{{ t('scan.evidence.presentation.rangeMethod') }}</summary>
                <p class="mt-2">{{ t('scan.evidence.presentation.rangeMethodSummary') }}</p>
                <p v-if="signalFor(metric)!.sampleCount !== null" class="mt-1">{{ t('scan.evidence.presentation.rangeSampleCount', { count: formatNumber(signalFor(metric)!.sampleCount!) }) }}</p>
                <p class="mt-1">{{ t('scan.evidence.presentation.referenceGroup') }}: {{ referenceGroup }}</p>
                <p class="mt-1">{{ t('scan.evidence.presentation.rangeCalculation') }}</p>
                <p class="mt-1">{{ t('scan.evidence.presentation.normalizationMethod') }}</p>
              </details>
            </template>
            <p v-if="metric === 'mattr'" class="mt-3 text-xs leading-5 text-neutral-500" data-testid="lexical-context">{{ t('scan.evidence.presentation.lexicalContext') }}</p>
            <details v-else class="mt-3 text-xs leading-5 text-neutral-500" data-testid="metric-definition">
              <summary class="w-fit cursor-pointer rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500">{{ t('scan.evidence.presentation.metricDefinition') }}</summary>
              <p class="mt-1">{{ t(`scan.evidence.presentation.explanations.${metric}`) }}</p>
            </details>
          </article>
          <section v-for="group in exampleGroups" :key="group.key" class="rounded-2xl bg-primary-50/60 p-4" data-testid="evidence-examples">
            <h4 class="text-xs font-semibold text-neutral-800">{{ t(`scan.evidence.presentation.examples.${group.key}`) }}</h4>
            <ul v-if="group.items.length" class="mt-3 space-y-2">
              <li v-for="(example, index) in group.items" :key="index" class="flex items-start justify-between gap-3 rounded-lg border border-primary-100 bg-white px-3 py-2 text-sm">
                <span class="min-w-0 break-words">{{ example.text }}</span>
                <span class="shrink-0 text-xs leading-5 text-neutral-500">{{ t('scan.evidence.presentation.occurrences', { count: example.count }) }}</span>
              </li>
            </ul>
            <p v-else class="mt-2 text-xs leading-5 text-neutral-600">{{ t('scan.evidence.presentation.noExamples') }}</p>
            <p v-if="group.items.length" class="mt-2 text-xs leading-5 text-neutral-500">{{ t('scan.evidence.presentation.exampleHint') }}</p>
          </section>
        </div>
        <p v-if="Object.values(bands).some((band) => band && !band.degenerate)" class="text-xs leading-5 text-neutral-500">{{ t('scan.evidence.presentation.normalizedLegend') }}</p>

        <details class="rounded-xl border border-neutral-200 bg-white p-3 text-xs leading-5 text-neutral-600" data-testid="reference-source">
          <summary class="cursor-pointer rounded font-semibold text-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500">{{ t('scan.evidence.presentation.sourceDetails') }}</summary>
          <template v-if="sourceVersionKey">
            <p class="mt-2">{{ t('scan.evidence.presentation.datasetSource') }}: <a class="underline underline-offset-2" href="https://huggingface.co/datasets/WUJUNCHAO/DetectRL-X/blob/main/README.md" target="_blank" rel="noopener noreferrer">DetectRL-X · Binary General Open</a></p>
            <p class="mt-1">{{ t('scan.evidence.presentation.sourceVersion') }}: {{ t(`scan.evidence.presentation.${sourceVersionKey}`) }}</p>
            <p v-if="usesShortReference" class="mt-1">{{ t('scan.evidence.presentation.shortValidation') }}</p>
          </template>
          <p v-else class="mt-2">{{ t('scan.evidence.presentation.sourceUnavailable') }}</p>
          <p class="mt-1" data-testid="reference-group">{{ t('scan.evidence.presentation.referenceGroup') }}: {{ referenceGroup }}</p>
          <p class="mt-1">{{ t('scan.evidence.presentation.rangeCalculation') }}</p>
          <p class="mt-1">{{ t('scan.evidence.presentation.sourceScope') }}</p>
        </details>

        <details class="rounded-2xl border border-neutral-200 bg-white" data-testid="evidence-professional">
          <summary class="cursor-pointer rounded-2xl px-4 py-3 text-sm font-semibold text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500">{{ t('scan.evidence.presentation.professional') }}</summary>
          <div class="space-y-4 px-4 pb-4 text-xs leading-5">
            <div class="rounded-xl bg-neutral-50 p-3" data-testid="evidence-quality">
              <p>{{ t('scan.evidence.quality.title') }}: <span data-value="quality-level">{{ t(`scan.evidence.quality.levels.${evidence.quality.level}`) }}</span></p>
              <p>{{ t('scan.evidence.quality.coverage') }}: <span data-value="coverage">{{ coverageFormat.format(evidence.quality.coverage) }}</span></p>
              <p class="mt-1 text-neutral-500">{{ t('scan.evidence.quality.hint') }}</p>
              <ul v-if="evidence.quality.reasons.length" class="mt-2 list-disc space-y-1 pl-4 text-neutral-600" data-testid="quality-reasons">
                <li v-for="reason in evidence.quality.reasons" :key="reason">{{ t(`scan.evidence.reasons.${reason}`) }}</li>
              </ul>
            </div>
            <div v-if="evidence.route" class="rounded-xl border border-neutral-200 p-3" data-testid="evidence-route">
              <h4 class="font-semibold">{{ t('scan.evidence.route.title') }}</h4>
              <dl class="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
                <div v-for="field in routeFields" :key="field">
                  <dt class="inline text-neutral-500">{{ t(`scan.evidence.route.fields.${field}`) }}: </dt>
                  <dd class="inline" :data-route="field">{{ t(`scan.evidence.route.values.${field}.${evidence.route[field]}`) }}</dd>
                </div>
                <div v-for="field in confidenceFields" :key="field">
                  <dt class="inline text-neutral-500">{{ t(`scan.evidence.route.confidence.${field}`) }}: </dt>
                  <dd class="inline" :data-confidence="field">{{ formatNumber(evidence.route.confidence[field]) }}</dd>
                </div>
              </dl>
              <p class="mt-2 text-neutral-500">{{ t('scan.evidence.route.hint') }}</p>
            </div>
            <details class="rounded-lg border border-neutral-200 px-3 py-2">
              <summary class="cursor-pointer font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500">{{ t('scan.evidence.presentation.methodology') }}</summary>
              <p class="mt-2 text-neutral-600">{{ t('scan.evidence.referenceHint') }}</p>
              <p class="mt-2 text-neutral-600">{{ t('scan.evidence.comparisonHint') }}</p>
            </details>
            <div class="overflow-x-auto rounded-xl border border-neutral-200" role="region" :aria-label="t('scan.evidence.presentation.professional')" tabindex="0">
              <table class="w-full min-w-[32rem] border-collapse text-left">
                <caption class="sr-only">{{ t('scan.evidence.presentation.tableCaption') }}</caption>
                <thead class="bg-neutral-50 text-neutral-600">
                  <tr>
                    <th scope="col" class="p-3">{{ t('scan.evidence.presentation.metric') }}</th>
                    <th scope="col" class="p-3">{{ t('scan.evidence.observed') }}</th>
                    <th v-for="side in referenceSides" :key="side" scope="col" class="p-3">{{ t(`scan.evidence.reference.${side}`) }}</th>
                  </tr>
                </thead>
                <tbody>
                  <template v-for="signal in visibleSignals" :key="signal.metric">
                    <tr :data-metric="signal.metric" class="border-t border-neutral-100 align-top">
                      <th scope="row" class="max-w-44 p-3 font-normal">
                        <h4 class="font-semibold text-neutral-800">{{ t(`scan.evidence.metrics.${signal.metric}`) }} <span v-if="metricUnit(signal.metric)" class="font-normal text-neutral-500">({{ metricUnit(signal.metric) }})</span></h4>
                        <p v-if="isHighOverlap(signal)" class="mt-1 text-amber-800" data-testid="high-overlap" :title="t('scan.evidence.presentation.overlapHint')">{{ t('scan.evidence.presentation.highOverlap') }}</p>
                        <p v-if="canCompare(signal.metric) && signal.sampleCount !== null" class="mt-1 text-neutral-500">{{ t('scan.evidence.presentation.rangeSampleCount', { count: formatNumber(signal.sampleCount) }) }}</p>
                        <ul v-if="signal.reasons.length" class="mt-1 space-y-1 text-neutral-500" data-testid="signal-reasons">
                          <li v-for="reason in signal.reasons" :key="reason">{{ reason === 'insufficient_observations' && observationRequirement(signal) ? t(`scan.evidence.presentation.requirements.${observationRequirement(signal)}`) : t(`scan.evidence.reasons.${reason}`) }}</li>
                        </ul>
                        <p v-if="signal.notice" class="mt-2 text-neutral-600" data-testid="evidence-notice">{{ t(`scan.evidence.notices.${signal.notice}`) }}</p>
                      </th>
                      <td class="p-3 tabular-nums" data-value="observed">{{ signal.observed === null ? t('scan.evidence.noObservation') : formatNumber(signal.observed) }}</td>
                      <td v-for="side in referenceSides" :key="side" class="p-3 tabular-nums">
                        <p :data-value="side" :title="signal.referenceRanges === null ? t('scan.evidence.noReference') : undefined">{{ signal.referenceRanges === null ? '—' : `${formatNumber(signal.referenceRanges[side][0])} – ${formatNumber(signal.referenceRanges[side][1])}` }}</p>
                        <p v-if="signal.referenceRanges !== null && signal[`${side}Percentile`] !== null" class="mt-1 text-neutral-500">{{ t('scan.evidence.presentation.percentile') }}: <span :data-value="`${side}-percentile`">{{ formatNumber(signal[`${side}Percentile`]!) }}</span></p>
                        <p v-if="signal.referenceRanges !== null && signal.relation !== null" :data-value="`${side}-relation`" class="text-neutral-500">{{ t(`scan.evidence.relation.${signal.relation[side]}`) }}</p>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
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
import type { EvidenceResult, EvidenceSignal, EvidencePatterns } from '../api/modules/scan';
import { useI18n } from '../i18n';
import { comparisonReasons, hasDistinctReference, isHighOverlap, observationRequirement, patternExamples, referenceBand, referenceOverlap, summaryMetrics, summaryState } from '../utils/evidencePresentation';

type Dimension = EvidenceSignal['dimension'];
const props = withDefaults(defineProps<{
  evidence?: EvidenceResult | null;
  submittedText?: string;
  detailed?: boolean;
  initialDimension?: Dimension;
  initialShowAll?: boolean;
}>(), { submittedText: '', detailed: false, initialDimension: 'lexical', initialShowAll: false });
const emit = defineEmits<{ 'view-details': [dimension: Dimension, showAll: boolean] }>();
const { t, locale } = useI18n();
const dimensions = Object.keys(summaryMetrics) as Dimension[];
const dimensionIcons = { lexical: BookOpenIcon, phrase_template: ArrowPathIcon, rhythm: Bars3BottomLeftIcon, discourse: LinkIcon };
const selectedDimension = ref<Dimension>(props.initialDimension);
watch(() => props.initialDimension, (value) => { selectedDimension.value = value; });
const showAll = ref(props.initialShowAll);
watch(() => props.initialShowAll, (value) => { showAll.value = value; });
watch(() => props.evidence, () => {
  showAll.value = false;
  selectedDimension.value = props.initialDimension;
});
const referenceSides = ['human', 'ai'] as const;
const routeFields = ['language', 'domain', 'lengthBucket', 'fallbackLevel'] as const;
const confidenceFields = ['language', 'domain'] as const;
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
const coverageFormat = computed(() => new Intl.NumberFormat(locale.value, { style: 'percent', maximumFractionDigits: 4 }));
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
const hasComparisons = computed(() => props.evidence?.signals.some((signal) => canCompare(signal.metric)));
const bands = computed(() => Object.fromEntries(visibleSummaryMetrics(selectedDimension.value).map((metric) => {
  const signal = signalFor(metric);
  return [metric, signal && canCompare(metric) ? referenceBand(signal) : null];
})));
const exampleGroups = computed(() => {
  const keys: (keyof EvidencePatterns)[] = selectedDimension.value === 'phrase_template'
    ? ['repeated_phrases', 'sentence_start_templates'] : [];
  return keys.map((key) => ({
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
.reference-overlap {
  background: repeating-linear-gradient(135deg, #e2e8f0 0px, #e2e8f0 4px, #94a3b8 4px, #94a3b8 5px);
}
</style>
