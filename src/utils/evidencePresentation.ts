import type { EvidencePattern, EvidenceResult, EvidenceSignal } from '../api/modules/scan';

export const summaryMetrics = {
  lexical: ['mattr'],
  phrase_template: ['repeat_ngram_coverage', 'sentence_start_repeat'],
  rhythm: ['sentence_length_median', 'sentence_length_cv'],
  discourse: ['transition_per_1k', 'paragraph_adjacent_jaccard'],
} satisfies Record<EvidenceSignal['dimension'], string[]>;

const validRange = (range: unknown): range is [number, number] => Array.isArray(range) && range.length === 2
  && range.every(Number.isFinite) && range[0] <= range[1];

const validHumanRange = (signal: EvidenceSignal) => validRange(signal.referenceRanges?.human);

export function referenceOverlap(signal: EvidenceSignal): number | null {
  const { human, ai } = signal.referenceRanges ?? {};
  if (!validRange(human) || !validRange(ai)) return null;
  const start = Math.max(human[0], ai[0]);
  const end = Math.min(human[1], ai[1]);
  if (start > end) return 0;
  const width = Math.min(human[1] - human[0], ai[1] - ai[0]);
  if (width === 0) return 1;
  if (Number.isFinite(width)) return Math.min(1, (end - start) / width);
  const scale = Math.max(...human.map(Math.abs), ...ai.map(Math.abs));
  return (end / scale - start / scale)
    / Math.min(human[1] / scale - human[0] / scale, ai[1] / scale - ai[0] / scale);
}

export function isHighOverlap(signal: EvidenceSignal): boolean {
  const overlap = referenceOverlap(signal);
  return overlap !== null && overlap >= 0.8 - 1e-12;
}

export function hasDistinctReference(signal: EvidenceSignal): boolean {
  const { human, ai } = signal.relation ?? {};
  return signal.observed !== null && Number.isFinite(signal.observed)
    && referenceOverlap(signal) !== null && !isHighOverlap(signal)
    && ['below', 'within', 'above'].includes(human) && ['below', 'within', 'above'].includes(ai)
    && (human === 'within') !== (ai === 'within');
}

export function summaryState(
  signal: EvidenceSignal | undefined,
  evidenceStatus: EvidenceResult['status'],
): 'below' | 'within' | 'above' | 'missing' | 'uncompared' | 'none' | 'present' {
  if (!signal || signal.observed === null || !Number.isFinite(signal.observed)) return 'missing';
  if (summaryMetrics.phrase_template.includes(signal.metric)) {
    if (signal.observed === 0) return 'none';
    return signal.observed > 0 ? 'present' : 'uncompared';
  }
  if (!['ready', 'partial'].includes(evidenceStatus) || !validHumanRange(signal)) return 'uncompared';
  const relation = signal.relation?.human;
  return ['below', 'within', 'above'].includes(relation) ? relation : 'uncompared';
}

export function observationRequirement(signal: EvidenceSignal | undefined): 'twoParagraphs' | 'threeParagraphs' | 'sentences' | null {
  if (!signal || signal.observed !== null || !signal.reasons.includes('insufficient_observations')) return null;
  if (['paragraph_adjacent_jaccard', 'intro_conclusion_jaccard'].includes(signal.metric)) return 'twoParagraphs';
  if (signal.metric === 'paragraph_nonadjacent_jaccard_q90') return 'threeParagraphs';
  if (signal.metric.startsWith('sentence_')) return 'sentences';
  return null;
}

export function comparisonReasons(evidence: EvidenceResult): string[] {
  if (!['partial', 'insufficient'].includes(evidence.status)) return [];
  const blockers = evidence.quality.reasons.filter((reason) => [
    'below_minimum_length', 'fewer_than_10_sentences', 'excluded_content_over_40pct', 'length_out_of_range', 'reference_validation_failed',
  ].includes(reason));
  if (blockers.length) return [...new Set(blockers)].filter((reason) =>
    reason !== 'length_out_of_range' || !blockers.includes('below_minimum_length')
  );
  const reasons: string[] = [];
  if (evidence.quality.reasons.some((reason) => ['reference_cell_unavailable', 'reference_metrics_unavailable', 'no_comparable_metrics'].includes(reason))) {
    reasons.push('reference_unavailable');
  }
  if (evidence.quality.reasons.includes('missing_observations')) reasons.push('missing_observations');
  return reasons;
}

export function patternExamples(
  patterns: EvidencePattern[] | undefined,
  submittedText: string,
): Array<{ text: string; count: number }> {
  const characters = Array.from(submittedText);
  const examples: Array<{ text: string; count: number }> = [];
  for (const pattern of patterns ?? []) {
    if (!Number.isSafeInteger(pattern.count) || pattern.count <= 0) continue;
    const offset = pattern.offsets.find(({ start, end }) =>
      Number.isSafeInteger(start) && Number.isSafeInteger(end)
      && start >= 0 && start < end && end <= characters.length
      && characters.slice(start, end).join('').trim().length > 0
    );
    if (!offset) continue;
    const text = characters.slice(offset.start, offset.end).join('');
    examples.push({ text, count: pattern.count });
    if (examples.length === 3) break;
  }
  return examples;
}

export function referenceBand(signal: EvidenceSignal): {
  min: number;
  max: number;
  ticks: number[];
  human: { start: number; end: number };
  ai: { start: number; end: number };
  overlap: { start: number; end: number } | null;
  observed: number;
  outside: 'below' | 'above' | null;
  degenerate: boolean;
} | null {
  const { human, ai } = signal.referenceRanges ?? {};
  if (signal.observed === null || !Number.isFinite(signal.observed) || !validRange(human) || !validRange(ai)) return null;
  if (!validRange(signal.referenceExtent)) return null;
  const [min, max] = signal.referenceExtent;
  if (min > human[0] || min > ai[0] || max < human[1] || max < ai[1]) return null;
  const degenerate = min === max;
  const outside = signal.observed < min ? 'below' : signal.observed > max ? 'above' : null;
  const width = max - min;
  const scale = Math.max(Math.abs(min), Math.abs(max));
  const position = (value: number) => {
    if (value < min) return 0;
    if (value > max) return 100;
    if (degenerate) return 50;
    return 100 * (Number.isFinite(width) ? (value - min) / width
      : (value / scale - min / scale) / (max / scale - min / scale));
  };
  const overlapStart = Math.max(human[0], ai[0]);
  const overlapEnd = Math.min(human[1], ai[1]);
  return {
    min,
    max,
    ticks: degenerate ? [] : [0, 25, 50, 75, 100],
    human: { start: position(human[0]), end: position(human[1]) },
    ai: { start: position(ai[0]), end: position(ai[1]) },
    overlap: overlapStart <= overlapEnd ? { start: position(overlapStart), end: position(overlapEnd) } : null,
    observed: position(signal.observed),
    outside,
    degenerate,
  };
}
