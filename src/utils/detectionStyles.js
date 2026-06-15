export const clampProbability = (value) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(parsed, 1));
};

export const getProbabilityTone = (value) => {
  const probability = clampProbability(value);
  if (probability >= 0.8) return 'critical';
  if (probability >= 0.6) return 'high';
  if (probability >= 0.4) return 'elevated';
  if (probability >= 0.2) return 'watch';
  return 'safe';
};

const toneMap = {
  critical: {
    chip: 'bg-rose-100 text-rose-900',
    card: 'border-rose-200 bg-rose-50',
    text: 'text-rose-700',
  },
  high: {
    chip: 'bg-orange-100 text-orange-900',
    card: 'border-orange-200 bg-orange-50',
    text: 'text-orange-700',
  },
  elevated: {
    chip: 'bg-amber-100 text-amber-900',
    card: 'border-amber-200 bg-amber-50',
    text: 'text-amber-700',
  },
  watch: {
    chip: 'bg-lime-100 text-lime-900',
    card: 'border-lime-200 bg-lime-50',
    text: 'text-lime-700',
  },
  safe: {
    chip: 'bg-emerald-100 text-emerald-900',
    card: 'border-emerald-200 bg-emerald-50',
    text: 'text-emerald-700',
  },
  tooShort: {
    chip: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    card: 'border-slate-200 bg-slate-50',
    text: 'text-slate-500',
  },
};

const resolveTone = (value, type = '') => (type === 'too_short' ? 'tooShort' : getProbabilityTone(value));

export const getProbabilityChipClasses = (value, type = '') => toneMap[resolveTone(value, type)].chip;

export const getProbabilityCardClasses = (value, type = '') => toneMap[resolveTone(value, type)].card;

export const getProbabilityTextClasses = (value, type = '') => toneMap[resolveTone(value, type)].text;
