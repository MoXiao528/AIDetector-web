import { apiClient } from '../client';

export type EvidenceReason =
  | 'invalid_evidence_config'
  | 'invalid_evidence_bundle'
  | 'bundle_unavailable'
  | 'invalid_router_response'
  | 'invalid_text'
  | 'invalid_main_label'
  | 'feature_extraction_failed'
  | 'comparison_failed'
  | 'model_unavailable'
  | 'model_failure'
  | 'busy'
  | 'timeout'
  | 'language_undetermined'
  | 'unsupported_language'
  | 'below_minimum_length'
  | 'fewer_than_10_sentences'
  | 'excluded_content_over_40pct'
  | 'length_out_of_range'
  | 'reference_cell_unavailable'
  | 'reference_fallback_language_length'
  | 'reference_fallback_language'
  | 'missing_observations'
  | 'reference_metrics_unavailable'
  | 'no_comparable_metrics'
  | 'no_valid_source_groups'
  | 'fewer_than_10_source_groups'
  | 'not_applicable_for_language'
  | 'insufficient_observations';

// Offsets are [start, end) Unicode code-point indices in the submitted original text.
export interface EvidenceOffset {
  start: number;
  end: number;
}

export interface EvidencePattern {
  count: number;
  offsets: EvidenceOffset[];
}

export interface EvidencePatterns {
  descriptive_top_tokens: EvidencePattern[];
  repeated_phrases: EvidencePattern[];
  sentence_start_templates: EvidencePattern[];
}

export interface EvidenceConfidence {
  // Router confidence, not AI likelihood or classification accuracy.
  language: number;
  domain: number;
}

export interface EvidenceRoute {
  language: 'ar' | 'de' | 'en' | 'es' | 'fr' | 'pt' | 'ru' | 'zh';
  domain: 'academic' | 'news' | 'novel' | 'seo' | 'webtext' | 'wiki';
  confidence: EvidenceConfidence;
  lengthBucket: 'below_minimum' | 'short' | 'medium' | 'long' | 'above_long';
  fallbackLevel: 'exact' | 'language_length' | 'language' | 'unavailable';
}

export interface EvidenceRanges {
  human: [number, number];
  ai: [number, number];
}

export interface EvidenceRelation {
  human: 'below' | 'within' | 'above';
  ai: 'below' | 'within' | 'above';
}

export interface EvidenceSignal {
  dimension: 'lexical' | 'phrase_template' | 'rhythm' | 'discourse';
  metric: string;
  observed: number | null;
  // Reference percentiles use 0–100; they are not source probabilities.
  humanPercentile: number | null;
  aiPercentile: number | null;
  referenceRanges: EvidenceRanges | null;
  relation: EvidenceRelation | null;
  notice: 'reference_mismatch' | 'outside_both' | null;
  // Paired, jointly valid source groups for this metric; do not sum across metrics.
  sampleCount: number | null;
  offsets: EvidenceOffset[];
  reasons: EvidenceReason[];
}

export interface EvidenceQuality {
  level: 'ready' | 'partial' | 'insufficient' | 'unavailable';
  // Comparable metrics / 22, as returned by the backend.
  coverage: number;
  reasons: EvidenceReason[];
}

export interface EvidenceResult {
  status: 'ready' | 'partial' | 'insufficient' | 'unsupported' | 'failed';
  artifactVersion: string | null;
  featureSchemaVersion: 1;
  route: EvidenceRoute | null;
  quality: EvidenceQuality;
  signals: EvidenceSignal[];
  patterns: EvidencePatterns | null;
}

export interface AnalysisSentence {
  id?: string;
  text: string;
  raw?: string;
  startParagraph?: number;
  endParagraph?: number;
  start_paragraph?: number;
  end_paragraph?: number;
  score?: number;
  probability?: number;
  type?: 'ai' | 'human' | 'too_short';
  label?: 'Human' | 'AI';
  reason?: string;
  suggestion?: string;
}

export interface AnalysisResult {
  score?: number;
  label?: 'Human' | 'AI';
  summary?: {
    ai: string | number;
    human: string | number;
  };
  sentences?: AnalysisSentence[];
  polish?: string;
  translation?: string;
  citations?: Array<{ id?: string; text?: string; source?: string; excerpt?: string; note?: string; status?: string }>;
  aiLikelyCount?: number;
  ai_likely_count?: number;
  highlightedHtml?: string;
  highlighted_html?: string;
}

export interface DetectionResponse {
  id?: number;
  detection_id?: number;
  detectionId?: number;
  history_id?: number;
  historyId?: number;
  label?: 'human' | 'ai' | 'HUMAN' | 'AI';
  score?: number;
  model_name?: string;
  modelName?: string;
  raw_score?: number;
  rawScore?: number;
  threshold?: number;
  input_text?: string;
  inputText?: string;
  result?: AnalysisResult;
  evidence?: EvidenceResult;
  verdict?: string;
  cost?: number;
  currentCredits?: number;
}

export const detectText = async (
  payload: { text: string; functions: string[]; editorHtml?: string },
  guestToken: string,
  idempotencyKey: string
) =>
  apiClient.post<DetectionResponse>(
    '/api/v1/detect',
    payload,
    {
      // Default backend budgets: 120s detection + 12s Evidence, plus settlement/transport headroom.
      timeout: 180000,
      ...(guestToken ? { auth: false } : {}),
      headers: {
        ...(guestToken ? { Authorization: `Bearer ${guestToken}` } : {}),
        'Idempotency-Key': idempotencyKey,
      },
    }
  );
