import { describe, expect, it } from 'vitest';
import type { EvidenceResult, EvidenceSignal } from '../api/modules/scan';
import { comparisonReasons, hasDistinctReference, isHighOverlap, observationRequirement, patternExamples, referenceBand, referenceOverlap, summaryState } from './evidencePresentation';

const signal = (overrides: Partial<EvidenceSignal> = {}): EvidenceSignal => ({
  dimension: 'lexical', metric: 'mattr', observed: 0.5,
  humanPercentile: 40, aiPercentile: 90,
  referenceRanges: { human: [0.2, 0.8], ai: [0.1, 0.3] },
  referenceExtent: [0, 1],
  relation: { human: 'within', ai: 'above' }, notice: null,
  sampleCount: 10, offsets: [], reasons: [], ...overrides,
});

describe('Evidence summaries', () => {
  it('uses returned human relations without converting AI relations or percentiles into a verdict', () => {
    expect(summaryState(signal(), 'ready')).toBe('within');
    expect(summaryState(signal({ relation: { human: 'below', ai: 'within' } }), 'partial')).toBe('below');
    expect(summaryState(signal({ relation: { human: 'above', ai: 'below' } }), 'partial')).toBe('above');
  });

  it('keeps missing observations, missing comparisons, and insufficient evidence distinct', () => {
    expect(summaryState(undefined, 'failed')).toBe('missing');
    for (const observed of [null, NaN, Infinity]) {
      expect(summaryState(signal({ observed }), 'partial')).toBe('missing');
    }
    expect(summaryState(signal(), 'insufficient')).toBe('uncompared');
    expect(summaryState(signal({ relation: null }), 'ready')).toBe('uncompared');
    expect(summaryState(signal({ referenceRanges: null }), 'ready')).toBe('uncompared');
    expect(summaryState(signal({ referenceRanges: { human: [1, 0], ai: [0, 1] } }), 'ready')).toBe('uncompared');
    expect(summaryState(signal({ referenceRanges: { human: [0, Infinity], ai: [0, 1] } }), 'ready')).toBe('uncompared');
  });

  it('reports repetition as an observation, preserving a real zero even without a comparison', () => {
    for (const metric of ['repeat_ngram_coverage', 'sentence_start_repeat']) {
      expect(summaryState(signal({ metric, observed: 0, referenceRanges: null }), 'insufficient')).toBe('none');
      expect(summaryState(signal({ metric, observed: 0.1, referenceRanges: null }), 'insufficient')).toBe('present');
      expect(summaryState(signal({ metric, observed: null }), 'ready')).toBe('missing');
    }
    expect(summaryState(signal({ observed: 0, relation: { human: 'below', ai: 'below' } }), 'ready')).toBe('below');
  });

  it('only explains observation requirements when the extraction explicitly reports missing observations', () => {
    const missing = { observed: null, reasons: ['insufficient_observations'] } satisfies Partial<EvidenceSignal>;
    expect(observationRequirement(signal({ ...missing, metric: 'paragraph_adjacent_jaccard' }))).toBe('twoParagraphs');
    expect(observationRequirement(signal({ ...missing, metric: 'intro_conclusion_jaccard' }))).toBe('twoParagraphs');
    expect(observationRequirement(signal({ ...missing, metric: 'paragraph_nonadjacent_jaccard_q90' }))).toBe('threeParagraphs');
    expect(observationRequirement(signal({ ...missing, metric: 'sentence_length_median' }))).toBe('sentences');
    expect(observationRequirement(signal({ ...missing, metric: 'mattr' }))).toBeNull();
    expect(observationRequirement(signal({ ...missing, metric: 'paragraph_adjacent_jaccard', observed: 0 }))).toBeNull();
    expect(observationRequirement(signal({ ...missing, metric: 'paragraph_adjacent_jaccard', reasons: ['feature_extraction_failed'] }))).toBeNull();
  });

  it('explains specific comparison blockers once and groups missing references without inventing causes', () => {
    const evidence: EvidenceResult = {
      status: 'insufficient', artifactVersion: null, featureSchemaVersion: 1, route: null,
      signals: [], patterns: null,
      quality: { level: 'insufficient', coverage: 0, reasons: ['below_minimum_length', 'below_minimum_length', 'length_out_of_range', 'fewer_than_10_sentences', 'no_comparable_metrics'] },
    };
    expect(comparisonReasons(evidence)).toEqual(['below_minimum_length', 'fewer_than_10_sentences']);
    expect(evidence.quality.reasons).toContain('length_out_of_range');
    evidence.quality.reasons = ['length_out_of_range'];
    expect(comparisonReasons(evidence)).toEqual(['length_out_of_range']);
    evidence.quality.reasons = ['reference_metrics_unavailable', 'reference_cell_unavailable', 'no_comparable_metrics', 'missing_observations'];
    expect(comparisonReasons(evidence)).toEqual(['reference_unavailable', 'missing_observations']);
    evidence.status = 'failed';
    expect(comparisonReasons(evidence)).toEqual([]);
  });
});

describe('Evidence excerpt and reference presentation', () => {
  it('slices Unicode code points, rejects invalid offsets/counts, and preserves response order for three examples', () => {
    const text = '甲😀乙重复词';
    expect(patternExamples([
      { count: 2, offsets: [{ start: -1, end: 1 }, { start: 1, end: 2 }] },
      { count: 0, offsets: [{ start: 0, end: 1 }] },
      { count: 1.5, offsets: [{ start: 0, end: 1 }] },
      { count: Infinity, offsets: [{ start: 0, end: 1 }] },
      { count: 3, offsets: [{ start: 2, end: 2 }, { start: 3, end: 100 }] },
      { count: 4, offsets: [{ start: 0.5, end: 2 }, { start: 2, end: 3 }] },
      { count: 5, offsets: [{ start: 3, end: 6 }] },
      { count: 99, offsets: [{ start: 0, end: 1 }] },
    ], text)).toEqual([
      { text: '😀', count: 2 }, { text: '乙', count: 4 }, { text: '重复词', count: 5 },
    ]);
    expect(patternExamples(undefined, text)).toEqual([]);
    expect(patternExamples([{ count: 2, offsets: [{ start: 0, end: 1 }] }], ' ')).toEqual([]);
  });

  it('normalizes every metric only on the supplied overall extent independently of returned percentiles', () => {
    const expected = {
      min: 0, max: 20, ticks: [0, 25, 50, 75, 100],
      human: { start: 10, end: 50 }, ai: { start: 0, end: 20 },
      overlap: { start: 10, end: 20 }, observed: 25, outside: null, degenerate: false,
    };
    const value = signal({ observed: 5, referenceExtent: [0, 20], referenceRanges: { human: [2, 10], ai: [0, 4] } });
    for (const humanPercentile of [null, NaN, Infinity, -1, 2.5, 40, 97.5, 101]) {
      expect(referenceBand({ ...value, humanPercentile, aiPercentile: humanPercentile })).toEqual(expected);
    }
    for (const metric of [
      'mattr', 'repeat_ngram_coverage', 'sentence_length_median', 'sentence_length_cv', 'transition_per_1k',
    ]) expect(referenceBand({ ...value, metric })).toEqual(expected);
    const band = referenceBand(signal({ metric: 'sentence_length_cv', observed: 0.4543, referenceExtent: [0, 2], referenceRanges: { human: [0.4167, 0.8574], ai: [0.3166, 0.5603] } }))!;
    expect(band.min).toBe(0);
    expect(band.max).toBe(2);
    expect(band.observed).toBeCloseTo(22.715, 4);
    expect(band.overlap).toEqual({ start: band.human.start, end: band.ai.end });
    expect(band.observed).toBeGreaterThan(band.overlap!.start);
    expect(band.observed).toBeLessThan(band.overlap!.end);
  });

  it('keeps the shared overall extent fixed across reference groups and observed values', () => {
    const value = signal({ metric: 'sentence_length_median', observed: 25, referenceExtent: [0, 100], referenceRanges: { human: [10, 30], ai: [20, 40] } });
    const expected = referenceBand(value)!;
    expect(expected.min).toBe(0);
    expect(expected.max).toBe(100);
    expect(expected.observed).toBe(25);
    for (const [observed, position, outside] of [
      [-Number.MAX_VALUE, 0, 'below'], [0, 0, null], [100, 100, null], [Number.MAX_VALUE, 100, 'above'],
    ] as const) {
      expect(referenceBand({ ...value, observed })).toEqual({ ...expected, observed: position, outside });
    }
    const differentGroup = referenceBand({ ...value, observed: 75, referenceRanges: { human: [50, 80], ai: [60, 90] } })!;
    expect([differentGroup.min, differentGroup.max, differentGroup.ticks]).toEqual([expected.min, expected.max, expected.ticks]);
    expect(differentGroup.human).toEqual({ start: 50, end: 80 });
    expect(differentGroup.observed).toBe(75);
    const negative = referenceBand(signal({ observed: -0.5, referenceExtent: [-2, 1], referenceRanges: { human: [-2, -1], ai: [0, 1] } }))!;
    expect(negative.min).toBe(-2);
    expect(negative.max).toBe(1);
    expect(negative.observed).toBe(50);
    expect(negative.outside).toBeNull();
    expect(negative.overlap).toBeNull();
  });

  it('represents partial, contained, touching and zero-width intersections explicitly', () => {
    for (const [human, ai, overlap] of [
      [[0, 3], [1, 4], { start: 25, end: 75 }],
      [[0, 4], [1, 3], { start: 25, end: 75 }],
      [[1, 3], [0, 4], { start: 25, end: 75 }],
      [[0, 2], [2, 4], { start: 50, end: 50 }],
      [[0, 4], [1, 1], { start: 25, end: 25 }],
      [[0, 1], [3, 4], null],
      [[0, 0], [4, 4], null],
    ] as Array<[[number, number], [number, number], { start: number; end: number } | null]>) {
      expect(referenceBand(signal({ referenceExtent: [0, 4], referenceRanges: { human, ai } }))!.overlap).toEqual(overlap);
    }
  });

  it('shows a coincident reference point without inventing percentage ticks or changing the signal', () => {
    for (const point of [0, 3]) {
      for (const [observed, position, outside] of [
        [point - 1, 0, 'below'], [point, 50, null], [point + 1, 100, 'above'],
      ] as const) {
        const value = signal({ observed, humanPercentile: 2.5, referenceExtent: [point, point], referenceRanges: { human: [point, point], ai: [point, point] } });
        const before = JSON.stringify(value);
        expect(referenceBand(value)).toEqual({
          min: point, max: point, ticks: [],
          human: { start: 50, end: 50 }, ai: { start: 50, end: 50 }, overlap: { start: 50, end: 50 },
          observed: position, outside, degenerate: true,
        });
        expect(JSON.stringify(value)).toBe(before);
      }
    }
  });

  it('handles extreme finite and subnormal values without overflow or division by zero', () => {
    const extreme = referenceBand(signal({ observed: 0, referenceExtent: [-Number.MAX_VALUE, Number.MAX_VALUE], referenceRanges: { human: [-Number.MAX_VALUE, Number.MAX_VALUE], ai: [0, Number.MAX_VALUE] } }))!;
    expect(extreme.human).toEqual({ start: 0, end: 100 });
    expect(extreme.ai).toEqual({ start: 50, end: 100 });
    expect(extreme.overlap).toEqual({ start: 50, end: 100 });
    expect(extreme.observed).toBe(50);
    const tiny = referenceBand(signal({ observed: 2 * Number.MIN_VALUE, referenceExtent: [Number.MIN_VALUE, 3 * Number.MIN_VALUE], referenceRanges: { human: [Number.MIN_VALUE, 2 * Number.MIN_VALUE], ai: [2 * Number.MIN_VALUE, 3 * Number.MIN_VALUE] } }))!;
    expect(tiny.human).toEqual({ start: 0, end: 50 });
    expect(tiny.ai).toEqual({ start: 50, end: 100 });
    expect(tiny.observed).toBe(50);
    const narrow = referenceBand(signal({ observed: 1e308, referenceExtent: [1e308, 1.0000000000000002e308], referenceRanges: { human: [1e308, 1.0000000000000002e308], ai: [1e308, 1e308] } }))!;
    expect(narrow.human).toEqual({ start: 0, end: 100 });
    expect(narrow.ai).toEqual({ start: 0, end: 0 });
    expect(narrow.observed).toBe(0);
  });

  it('omits bands for missing or invalid observations and either invalid range', () => {
    for (const observed of [null, NaN, Infinity]) expect(referenceBand(signal({ observed }))).toBeNull();
    expect(referenceBand(signal({ referenceRanges: null }))).toBeNull();
    for (const range of [[1, 0], [0, Infinity], [NaN, 1]] as [number, number][]) {
      expect(referenceBand(signal({ referenceRanges: { human: range, ai: [0, 1] } }))).toBeNull();
      expect(referenceBand(signal({ referenceRanges: { human: [0, 1], ai: range } }))).toBeNull();
    }
  });

  it('does not invent a scale for historical results or invalid extents that would crop a reference range', () => {
    const historical = signal();
    delete historical.referenceExtent;
    expect(referenceBand(historical)).toBeNull();
    for (const referenceExtent of [
      [1, 0], [0, Infinity], [NaN, 1], [0.15, 1], [0, 0.7], [0, 0],
    ] as [number, number][]) {
      expect(referenceBand(signal({ referenceExtent }))).toBeNull();
    }
    for (const referenceExtent of [null, [], [0], [0, 1, 2]]) {
      expect(referenceBand({ ...signal(), referenceExtent } as EvidenceSignal)).toBeNull();
    }
  });
});

describe('Evidence distinct reference selection', () => {
  it('keeps only single-sided within relations with less than 80% range overlap', () => {
    for (const [observed, relation, expected] of [
      [0.5, { human: 'within', ai: 'above' }, true],
      [0.15, { human: 'below', ai: 'within' }, true],
      [0.25, { human: 'within', ai: 'within' }, false],
      [0.9, { human: 'above', ai: 'above' }, false],
    ] as Array<[number, EvidenceSignal['relation'], boolean]>) {
      const value = signal({ observed, relation, referenceExtent: undefined });
      const before = JSON.stringify(value);
      expect(hasDistinctReference(value)).toBe(expected);
      expect(JSON.stringify(value)).toBe(before);
    }
    expect(hasDistinctReference(signal({ observed: 1, referenceRanges: { human: [0, 10], ai: [2, 12] }, relation: { human: 'within', ai: 'below' } }))).toBe(false);
    expect(hasDistinctReference(signal({ observed: 1, referenceRanges: { human: [1, 1], ai: [0, 2] }, relation: { human: 'within', ai: 'within' } }))).toBe(false);
    expect(hasDistinctReference(signal({ observed: 1, referenceRanges: { human: [1, 1], ai: [2, 2] }, relation: { human: 'within', ai: 'below' } }))).toBe(true);
  });

  it('requires a finite observation, valid ranges and two valid supplied relations', () => {
    for (const observed of [null, NaN, Infinity]) expect(hasDistinctReference(signal({ observed }))).toBe(false);
    expect(hasDistinctReference(signal({ referenceRanges: null }))).toBe(false);
    for (const range of [[1, 0], [0, Infinity], [NaN, 1]] as [number, number][]) {
      expect(hasDistinctReference(signal({ referenceRanges: { human: range, ai: [0, 1] } }))).toBe(false);
      expect(hasDistinctReference(signal({ referenceRanges: { human: [0, 1], ai: range } }))).toBe(false);
    }
    for (const relation of [null, { human: 'within' }, { human: 'within', ai: 'invalid' }, { human: 'invalid', ai: 'within' }]) {
      expect(hasDistinctReference(signal({ relation: relation as EvidenceSignal['relation'] }))).toBe(false);
    }
  });
});

describe('Evidence reference interval overlap', () => {
  it('uses the smaller interval width, with an inclusive 80% boundary and roundoff tolerance', () => {
    for (const [human, ai, overlap] of [
      [[0, 10], [2, 12], 0.8], [[0.2, 0.4], [0.24, 0.44], 0.8],
      [[0, 10], [2, 4], 1], [[2, 4], [0, 10], 1],
      [[0, 1], [2, 3], 0], [[0, 1], [1, 2], 0],
      [[-Number.MAX_VALUE, Number.MAX_VALUE], [-Number.MAX_VALUE, Number.MAX_VALUE], 1],
    ] as Array<[[number, number], [number, number], number]>) {
      const value = signal({ referenceRanges: { human, ai } });
      expect(referenceOverlap(value)).toBeCloseTo(overlap);
      expect(isHighOverlap(value)).toBe(overlap >= 0.8);
    }
    expect(isHighOverlap(signal({ referenceRanges: { human: [0, 1], ai: [0.2 + 5e-13, 1.3] } }))).toBe(true);
    expect(isHighOverlap(signal({ referenceRanges: { human: [0, 1], ai: [0.2 + 2e-12, 1.3] } }))).toBe(false);
  });

  it('treats intersecting zero-width closed intervals as fully overlapping', () => {
    for (const [human, ai, overlap] of [
      [[1, 1], [0, 2], 1], [[0, 2], [1, 1], 1], [[1, 1], [1, 1], 1],
      [[0, 0], [0, 2], 1], [[2, 2], [0, 2], 1],
      [[3, 3], [0, 2], 0], [[1, 1], [2, 2], 0],
    ] as Array<[[number, number], [number, number], number]>) {
      expect(referenceOverlap(signal({ referenceRanges: { human, ai } }))).toBe(overlap);
    }
  });

  it('does not derive overlap from observations, percentiles or relations and rejects invalid ranges', () => {
    const value = signal({ observed: null, humanPercentile: null, aiPercentile: null, relation: null, referenceRanges: { human: [0, 1], ai: [0.2, 1.2] } });
    const before = JSON.stringify(value);
    expect(isHighOverlap(value)).toBe(true);
    expect(isHighOverlap({ ...value, observed: 800, humanPercentile: 100, aiPercentile: 0, relation: { human: 'above', ai: 'below' } })).toBe(true);
    expect(JSON.stringify(value)).toBe(before);
    expect(referenceOverlap(signal({ referenceRanges: null }))).toBeNull();
    expect(isHighOverlap(signal({ referenceRanges: null }))).toBe(false);
    for (const range of [[1, 0], [0, Infinity], [NaN, 1]] as [number, number][]) {
      expect(referenceOverlap(signal({ referenceRanges: { human: range, ai: [0, 1] } }))).toBeNull();
      expect(referenceOverlap(signal({ referenceRanges: { human: [0, 1], ai: range } }))).toBeNull();
    }
  });
});
