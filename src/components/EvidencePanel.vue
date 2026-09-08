<template>
  <section
    v-if="evidence"
    :aria-label="t('scan.evidence.title')"
    class="min-w-0 space-y-3 break-words"
    data-testid="evidence-panel"
  >
    <h3 class="text-sm font-bold text-neutral-900">{{ t('scan.evidence.title') }}</h3>
    <p class="text-xs leading-5 text-neutral-600" data-testid="evidence-status">
      {{ t(`scan.evidence.status.${evidence.status}`) }}
    </p>
    <div class="space-y-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs leading-5" data-testid="evidence-quality">
      <p class="font-semibold text-neutral-800">
        {{ t('scan.evidence.quality.title') }}:
        <span data-value="quality-level">{{ t(`scan.evidence.quality.levels.${evidence.quality.level}`) }}</span>
      </p>
      <p class="text-neutral-700">
        {{ t('scan.evidence.quality.coverage') }}:
        <span class="tabular-nums" data-value="coverage">{{ coverageFormat.format(evidence.quality.coverage) }}</span>
      </p>
      <p class="text-neutral-500">{{ t('scan.evidence.quality.hint') }}</p>
      <ul v-if="evidence.quality.reasons.length" class="list-disc space-y-1 pl-4 text-neutral-600" data-testid="quality-reasons">
        <li v-for="reason in evidence.quality.reasons" :key="reason">{{ t(`scan.evidence.reasons.${reason}`) }}</li>
      </ul>
    </div>
    <div v-if="evidence.route" class="space-y-2 rounded-xl border border-neutral-200 bg-white p-3 text-xs leading-5" data-testid="evidence-route">
      <h4 class="font-semibold text-neutral-800">{{ t('scan.evidence.route.title') }}</h4>
      <dl class="space-y-1 text-neutral-700">
        <div v-for="field in routeFields" :key="field">
          <dt class="inline text-neutral-500">{{ t(`scan.evidence.route.fields.${field}`) }}: </dt>
          <dd class="inline" :data-route="field">{{ t(`scan.evidence.route.values.${field}.${evidence.route[field]}`) }}</dd>
        </div>
        <div v-for="field in confidenceFields" :key="`${field}-confidence`">
          <dt class="inline text-neutral-500">{{ t(`scan.evidence.route.confidence.${field}`) }}: </dt>
          <dd class="inline tabular-nums" :data-confidence="field">{{ formatNumber(evidence.route.confidence[field]) }}</dd>
        </div>
      </dl>
      <p class="text-neutral-500">{{ t('scan.evidence.route.hint') }}</p>
    </div>
    <template v-if="hasSignals">
      <p class="text-xs leading-5 text-neutral-500">{{ t('scan.evidence.referenceHint') }}</p>
      <p class="text-xs leading-5 text-neutral-500">{{ t('scan.evidence.comparisonHint') }}</p>
      <details
        v-for="dimension in dimensions"
        :key="dimension"
        :data-dimension="dimension"
        class="min-w-0 rounded-2xl border border-neutral-200 bg-white"
      >
        <summary class="cursor-pointer rounded-2xl px-4 py-3 text-sm font-semibold text-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500">
          {{ t(`scan.evidence.dimensions.${dimension}`) }}
          <span
            v-if="evidence.signals.some((item) => item.dimension === dimension && item.notice !== null)"
            class="ml-2 inline-block rounded bg-neutral-100 px-2 py-0.5 text-xs font-normal text-neutral-600"
            data-testid="dimension-notice"
          >{{ t('scan.evidence.hasNotice') }}</span>
        </summary>
        <div class="divide-y divide-neutral-100 px-4 pb-2">
          <div
            v-for="signal in evidence.signals.filter((item) => item.dimension === dimension)"
            :key="signal.metric"
            :data-metric="signal.metric"
            class="space-y-2 py-3"
          >
            <h4 class="text-xs font-semibold leading-5 text-neutral-800">
              {{ t(`scan.evidence.metrics.${signal.metric}`) }}
              <span class="font-normal text-neutral-500">({{ metricUnit(signal.metric) }})</span>
            </h4>
            <dl class="space-y-1 text-xs leading-5">
              <div>
                <dt class="inline text-neutral-500">{{ t('scan.evidence.observed') }}: </dt>
                <dd class="inline font-medium tabular-nums text-neutral-900" data-value="observed">
                  {{ signal.observed === null ? t('scan.evidence.noObservation') : formatNumber(signal.observed) }}
                </dd>
              </div>
              <div>
                <dt class="inline text-neutral-500">{{ t('scan.evidence.sampleCount') }}: </dt>
                <dd class="inline tabular-nums text-neutral-700" data-value="sample-count">
                  {{ signal.sampleCount === null ? t('scan.evidence.noSampleCount') : signal.sampleCount.toLocaleString(locale) }}
                </dd>
              </div>
              <template v-for="side in referenceSides" :key="side">
                <div>
                  <dt class="inline text-neutral-500">{{ t(`scan.evidence.reference.${side}`) }}: </dt>
                  <dd class="inline tabular-nums text-neutral-700" :data-value="side">
                    {{ signal.referenceRanges === null
                      ? t('scan.evidence.noReference')
                      : `${formatNumber(signal.referenceRanges[side][0])} – ${formatNumber(signal.referenceRanges[side][1])}` }}
                  </dd>
                </div>
                <div>
                  <dt class="inline text-neutral-500">{{ t(`scan.evidence.percentile.${side}`) }}: </dt>
                  <dd class="inline tabular-nums text-neutral-700" :data-value="`${side}-percentile`">
                    {{ signal[`${side}Percentile`] === null ? t('scan.evidence.noReference') : formatNumber(signal[`${side}Percentile`]) }}
                  </dd>
                </div>
                <div>
                  <dt class="inline text-neutral-500">{{ t(`scan.evidence.position.${side}`) }}: </dt>
                  <dd class="inline text-neutral-700" :data-value="`${side}-relation`">
                    {{ signal.relation === null ? t('scan.evidence.noReference') : t(`scan.evidence.relation.${signal.relation[side]}`) }}
                  </dd>
                </div>
              </template>
            </dl>
            <ul v-if="signal.reasons.length" class="list-disc space-y-1 pl-4 text-xs leading-5 text-neutral-500" data-testid="signal-reasons">
              <li v-for="reason in signal.reasons" :key="reason">{{ t(`scan.evidence.reasons.${reason}`) }}</li>
            </ul>
            <p v-if="signal.notice !== null" class="rounded-lg border border-neutral-200 bg-neutral-50 p-2 text-xs leading-5 text-neutral-700" data-testid="evidence-notice">
              {{ t(`scan.evidence.notices.${signal.notice}`) }}
            </p>
          </div>
        </div>
      </details>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { EvidenceResult, EvidenceSignal } from '../api/modules/scan';
import { useI18n } from '../i18n';

const props = defineProps<{ evidence?: EvidenceResult | null }>();
const { t, locale } = useI18n();
const dimensions: EvidenceSignal['dimension'][] = ['lexical', 'phrase_template', 'rhythm', 'discourse'];
const referenceSides = ['human', 'ai'] as const;
const routeFields = ['language', 'domain', 'lengthBucket', 'fallbackLevel'] as const;
const confidenceFields = ['language', 'domain'] as const;
const hasSignals = computed(() =>
  props.evidence && ['ready', 'partial', 'insufficient'].includes(props.evidence.status)
);
const numberFormat = computed(() => new Intl.NumberFormat(locale.value, { maximumSignificantDigits: 6 }));
const coverageFormat = computed(() => new Intl.NumberFormat(locale.value, { style: 'percent', maximumFractionDigits: 1 }));
const formatNumber = (value: number) => numberFormat.value.format(value);

const metricUnits: Record<string, string> = {
  mattr: 'ratio',
  token_entropy: 'bit',
  entropy_per_log_vocab: 'ratio',
  hapax_type_ratio: 'ratio',
  top_token_concentration: 'ratio',
  repeat_ngram_coverage: 'ratio',
  sentence_start_repeat: 'ratio',
  sentence_length_median: 'length',
  sentence_length_iqr: 'length',
  sentence_length_cv: 'coefficient',
  sentence_adjacent_change_median: 'length',
  paragraph_length_median: 'length',
  paragraph_length_iqr: 'length',
  paragraph_length_cv: 'coefficient',
  punctuation_per_1k: 'per1kLength',
  punctuation_entropy: 'bit',
  transition_per_1k: 'per1kTokens',
  transition_diversity: 'ratio',
  paragraph_adjacent_jaccard: 'ratio',
  paragraph_nonadjacent_jaccard_q90: 'ratio',
  intro_conclusion_jaccard: 'ratio',
  section_heading_count: 'count',
};
const metricUnit = (metric: string) => {
  const unit = metricUnits[metric];
  const lengthUnit = props.evidence?.route?.language === 'zh' ? 'han' : 'tokens';
  if (unit === 'length') return t(`scan.evidence.units.${lengthUnit}`);
  if (unit === 'per1kLength') return t(`scan.evidence.units.per1k.${lengthUnit}`);
  return t(`scan.evidence.units.${unit}`);
};
</script>
