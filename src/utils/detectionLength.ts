export const countCharacters = (text = '') => Array.from(text).length;

// Match Python str.isspace(), used by the backend's non-whitespace counter.
const isWhitespace = (character: string) => /\p{White_Space}/u.test(character) ||
  (character.codePointAt(0)! >= 0x1c && character.codePointAt(0)! <= 0x1f);

export const countVisibleCharacters = (text = '') => Array.from(text).filter((character) => !isWhitespace(character)).length;

export const getEstimatedAdditionalCharacters = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.ceil(value) : null;

export const getShortTextEstimate = (error: any) =>
  getEstimatedAdditionalCharacters(error?.details?.detail?.estimatedAdditionalCharacters);

export const formatShortTextMessage = (estimate: number | null, t: (key: string, values?: object) => string) =>
  estimate === null
    ? t('scan.editor.minDetectMore')
    : t('scan.editor.minDetectRemaining', { remaining: estimate });
