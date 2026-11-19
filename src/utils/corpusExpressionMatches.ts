import type { AnalysisSentence, EvidenceCorpusExpressions, EvidenceOffset } from '../api/modules/scan';
import { countVisibleCharacters } from './detectionLength';

export interface CorpusExpressionOccurrence {
  sentenceIndex: number;
  start: number;
  end: number;
  sourceStart: number;
  sourceEnd: number;
}

export interface CorpusExpressionMatch {
  expression: string;
  occurrences: CorpusExpressionOccurrence[];
}

type SavedSentence = AnalysisSentence & { isFallback?: boolean };

// The backend numbers nonblank lines. Preserve their original UTF-16 positions.
const paragraphLines = (text: string) => Array.from(text.matchAll(/[^\r\n]+/g), (match) => ({
  text: match[0],
  start: match.index!,
  end: match.index! + match[0].length,
})).filter((line) => countVisibleCharacters(line.text) !== 0);

export function getCorpusExpressionMatches(
  submittedText: string,
  sentences: readonly SavedSentence[],
  corpus?: EvidenceCorpusExpressions | null,
): CorpusExpressionMatch[] {
  if (corpus?.status !== 'matched' || !submittedText || !sentences.length) return [];
  const { expressions, matches, lexiconVersion, lexiconSha256 } = corpus;
  if (typeof lexiconVersion !== 'string' || !lexiconVersion.trim() ||
      typeof lexiconSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(lexiconSha256) ||
      !Array.isArray(expressions) || !Array.isArray(matches) || !matches.length ||
      matches.length !== expressions.length || new Set(expressions).size !== expressions.length) return [];

  const sourceParagraphs = paragraphLines(submittedText);
  const placements: Array<{ sentenceIndex: number; sourceStart: number; sourceEnd: number; targetStart: number } | undefined> =
    new Array(submittedText.length);
  let nextParagraph = 1;
  for (const [sentenceIndex, sentence] of sentences.entries()) {
    const start = sentence?.startParagraph ?? sentence?.start_paragraph;
    const end = sentence?.endParagraph ?? sentence?.end_paragraph;
    if (start !== nextParagraph || !Number.isInteger(end) || end < start || end > sourceParagraphs.length ||
        typeof sentence.text !== 'string') return [];

    const sourceLines = sourceParagraphs.slice(start - 1, end);
    const targetLines = paragraphLines(sentence.text);
    if (sourceLines.length !== targetLines.length ||
        sourceLines.some((line, index) => line.text !== targetLines[index].text)) return [];
    if (sentence.raw !== undefined && sentence.raw !== '') {
      if (typeof sentence.raw !== 'string') return [];
      const rawLines = paragraphLines(sentence.raw);
      if (rawLines.length !== sourceLines.length ||
          sourceLines.some((line, index) => line.text !== rawLines[index].text)) return [];
    }

    if (sentence.type === 'ai' && !sentence.isFallback) {
      sourceLines.forEach((line, index) => {
        placements.fill({
          sentenceIndex, sourceStart: line.start, sourceEnd: line.end, targetStart: targetLines[index].start,
        }, line.start, line.end);
      });
    }
    nextParagraph = end + 1;
  }
  if (nextParagraph !== sourceParagraphs.length + 1) return [];

  const utf16Offsets = [0];
  for (const character of submittedText) {
    utf16Offsets.push(utf16Offsets[utf16Offsets.length - 1] + character.length);
  }

  const groups: CorpusExpressionMatch[] = [];
  for (const [index, match] of matches.entries()) {
    if (!match || typeof match.expression !== 'string' || !match.expression.trim() ||
        match.expression !== expressions[index] || !Array.isArray(match.offsets) || !match.offsets.length) return [];

    const occurrences: CorpusExpressionOccurrence[] = [];
    let previous: EvidenceOffset | undefined;
    for (const offset of match.offsets) {
      if (!offset || !Number.isInteger(offset.start) || !Number.isInteger(offset.end) ||
          offset.start < 0 || offset.end <= offset.start || offset.end >= utf16Offsets.length ||
          (previous && (offset.start < previous.start || (offset.start === previous.start && offset.end <= previous.end)))) return [];
      previous = offset;

      const start = utf16Offsets[offset.start];
      const end = utf16Offsets[offset.end];
      if (submittedText.slice(start, end).normalize('NFKC') !== match.expression) return [];
      const placement = placements[start];
      if (!placement || end > placement.sourceEnd) continue;
      occurrences.push({
        sentenceIndex: placement.sentenceIndex,
        start: placement.targetStart + start - placement.sourceStart,
        end: placement.targetStart + end - placement.sourceStart,
        sourceStart: start,
        sourceEnd: end,
      });
    }
    if (occurrences.length) groups.push({ expression: match.expression, occurrences });
  }
  return groups;
}
