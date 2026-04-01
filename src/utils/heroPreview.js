const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const normalizeDistribution = ({ ai = 0, mixed = 0, human = 0 }) => {
  const normalizedAi = clamp(Math.round(ai), 0, 100);
  const normalizedMixed = clamp(Math.round(mixed), 0, 100);
  const normalizedHuman = clamp(Math.round(human), 0, 100);
  const total = normalizedAi + normalizedMixed + normalizedHuman;

  if (total === 100) {
    return { ai: normalizedAi, mixed: normalizedMixed, human: normalizedHuman };
  }

  if (total === 0) {
    return { ai: 0, mixed: 0, human: 0 };
  }

  const scale = 100 / total;
  const aiValue = clamp(Math.round(normalizedAi * scale), 0, 100);
  const mixedValue = clamp(Math.round(normalizedMixed * scale), 0, 100);
  const humanValue = Math.max(0, 100 - aiValue - mixedValue);

  return {
    ai: aiValue,
    mixed: mixedValue,
    human: humanValue,
  };
};

const getSnippetBadge = (copy, riskLevel) => {
  if (riskLevel === 'high') {
    return {
      text: copy.signals.badges.high,
      className: 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/20',
    };
  }
  if (riskLevel === 'medium') {
    return {
      text: copy.signals.badges.medium,
      className: 'bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/20',
    };
  }
  if (riskLevel === 'low') {
    return {
      text: copy.signals.badges.low,
      className: 'bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-400/20',
    };
  }
  return {
    text: copy.pending,
    className: 'bg-slate-500/15 text-slate-100 ring-1 ring-white/10',
  };
};

const getOverallBadge = (copy, ai) => {
  if (ai >= 72) return copy.highRisk;
  if (ai >= 52) return copy.review;
  return copy.stable;
};

const splitPreviewLines = (value = '') => {
  const normalized = String(value || '').replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];

  const paragraphs = normalized
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (paragraphs.length > 1) {
    return paragraphs.slice(0, 3);
  }

  const sentences = normalized.match(/[^。！？.!?]+[。！？.!?]?/gu) || [normalized];
  return sentences
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);
};

const resolveExamplePreset = ({ selectedExampleKey, examples }) => {
  if (!selectedExampleKey) return null;

  const matched = Array.isArray(examples) ? examples.find((item) => item?.key === selectedExampleKey) : null;
  if (!matched) return null;

  const ai = matched?.ai;
  const mixed = matched?.mixed;
  const human = matched?.human;

  if (![ai, mixed, human].every((value) => typeof value === 'number' && Number.isFinite(value))) {
    return null;
  }

  return {
    ...normalizeDistribution({ ai, mixed, human }),
    snapshot: matched?.snapshot || '',
    snippet: matched?.snippet || matched?.content || '',
    structure: matched?.structure || '',
    rhythm: matched?.rhythm || '',
    action: matched?.action || '',
  };
};

const buildEmptyState = (copy) => ({
  mode: 'empty',
  ai: null,
  mixed: null,
  human: null,
  badge: copy.empty,
  readiness: copy.typing,
  scoreLabel: copy.scorePendingLabel,
  scoreDisplay: '--',
  scoreSuffix: '',
  previewSubtitle: copy.previewSubtitleEmpty,
  queueSubtitle: copy.queueSubtitleEmpty,
  snapshotHint: copy.snapshotHint,
  hasQuantitativeSnapshot: false,
  signalItems: [
    {
      label: copy.signals.structure,
      value: copy.empty,
      description: copy.signals.awaitingDescription,
    },
    {
      label: copy.signals.rhythm,
      value: copy.empty,
      description: copy.signals.awaitingDescription,
    },
    {
      label: copy.signals.action,
      value: copy.signals.actionPending,
      description: copy.signals.actionPendingDescription,
    },
  ],
  riskBars: [],
  snippets: [
    {
      label: copy.queueEmptyLabel,
      badge: copy.pending,
      badgeClass: getSnippetBadge(copy, 'pending').className,
      text: copy.signals.emptyLine,
    },
  ],
});

const buildExampleState = ({ copy, preset }) => {
  const badge = getOverallBadge(copy, preset.ai);
  const riskLevel = preset.ai >= 72 ? 'high' : preset.ai >= 52 ? 'medium' : 'low';
  const snippetBadge = getSnippetBadge(copy, riskLevel);

  return {
    mode: 'example',
    ai: preset.ai,
    mixed: preset.mixed,
    human: preset.human,
    badge,
    readiness: copy.ready,
    scoreLabel: copy.scoreLabel,
    scoreDisplay: String(preset.ai),
    scoreSuffix: '%',
    previewSubtitle: copy.previewSubtitleExample,
    queueSubtitle: copy.queueSubtitleExample,
    snapshotHint: '',
    hasQuantitativeSnapshot: true,
    signalItems: [
      {
        label: copy.signals.structure,
        value: preset.structure || copy.signals.exampleSnapshot,
        description: copy.signals.exampleDescription,
      },
      {
        label: copy.signals.rhythm,
        value: preset.rhythm || copy.signals.exampleSnapshot,
        description: copy.signals.exampleDescription,
      },
      {
        label: copy.signals.action,
        value: preset.action || copy.signals.exampleSnapshot,
        description: copy.signals.exampleDescription,
      },
    ],
    riskBars: [
      { label: copy.signals.ai, value: preset.ai, className: 'bg-rose-500' },
      { label: copy.signals.mixed, value: preset.mixed, className: 'bg-amber-400' },
      { label: copy.signals.human, value: preset.human, className: 'bg-emerald-500' },
    ],
    snippets: [
      {
        label: copy.queueExampleLabel,
        badge: snippetBadge.text,
        badgeClass: snippetBadge.className,
        text: preset.snippet,
      },
    ],
  };
};

const buildDraftState = ({ copy, text }) => {
  const lines = splitPreviewLines(text);
  const snippetBadge = getSnippetBadge(copy, 'pending');

  return {
    mode: 'draft',
    ai: null,
    mixed: null,
    human: null,
    badge: copy.previewOnly,
    readiness: copy.scanRequired,
    scoreLabel: copy.scorePendingLabel,
    scoreDisplay: '--',
    scoreSuffix: '',
    previewSubtitle: copy.previewSubtitleDraft,
    queueSubtitle: copy.queueSubtitleDraft,
    snapshotHint: copy.snapshotHint,
    hasQuantitativeSnapshot: false,
    signalItems: [
      {
        label: copy.signals.structure,
        value: copy.signals.previewOnly,
        description: copy.signals.previewDescription,
      },
      {
        label: copy.signals.rhythm,
        value: copy.signals.notScored,
        description: copy.signals.previewDescription,
      },
      {
        label: copy.signals.action,
        value: copy.signals.actionPending,
        description: copy.signals.actionPendingDescription,
      },
    ],
    riskBars: [],
    snippets: lines.map((line, index) => ({
      label: `${copy.queuePreviewLabel} ${index + 1}`,
      badge: snippetBadge.text,
      badgeClass: snippetBadge.className,
      text: line,
    })),
  };
};

export const buildHeroLandingPreview = ({ text = '', selectedExampleKey = '', examples = [], copy }) => {
  const normalizedText = String(text || '').trim();

  if (!normalizedText) {
    return buildEmptyState(copy);
  }

  const preset = resolveExamplePreset({
    selectedExampleKey,
    examples,
  });

  if (preset) {
    return buildExampleState({ copy, preset });
  }

  return buildDraftState({ copy, text: normalizedText });
};
