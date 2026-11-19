import { describe, expect, it } from 'vitest';
import type { AnalysisSentence, EvidenceCorpusExpressions } from '../api/modules/scan';
import { getCorpusExpressionMatches } from './corpusExpressionMatches';

// Mirrors the backend's shared corpus-expression-visibility contract fixture.
const submittedText = '  值得关注的是  \r\n作者：仅作示例\r\n \t\r\n这不仅仅是一个试验。\r\n  😀青山依旧，神情平静。  \r\n这不仅仅是一个试验。\r这不仅仅是一个试验。\n很高兴。\r\n  值得商榷的是时间。  ';
const block = (text: string, startParagraph: number, endParagraph: number, type: AnalysisSentence['type']): AnalysisSentence =>
  ({ text, raw: text, startParagraph, endParagraph, type });
const sentences = [
  block('  值得关注的是  ', 1, 1, 'metadata'),
  block('作者：仅作示例', 2, 2, 'metadata'),
  block('这不仅仅是一个试验。\n  😀青山依旧，神情平静。  \n这不仅仅是一个试验。', 3, 5, 'ai'),
  block('这不仅仅是一个试验。', 6, 6, 'human'),
  block('很高兴。', 7, 7, 'too_short'),
  block('  值得商榷的是时间。  ', 8, 8, 'human'),
];
const matches = [
  { expression: '仅作示例', offsets: [{ start: 15, end: 19 }] },
  { expression: '不仅仅是', offsets: [{ start: 26, end: 30 }, { start: 55, end: 59 }, { start: 66, end: 70 }] },
  { expression: '青山依旧', offsets: [{ start: 40, end: 44 }] },
  { expression: '神情', offsets: [{ start: 45, end: 47 }] },
  { expression: '很高兴', offsets: [{ start: 76, end: 79 }] },
  { expression: '值得关注的是', offsets: [{ start: 2, end: 8 }] },
  { expression: '值得商榷的是', offsets: [{ start: 84, end: 90 }] },
];
const corpus: EvidenceCorpusExpressions = {
  status: 'matched',
  lexiconVersion: '1.0.0',
  lexiconSha256: 'ea2793dd9b6bbc045194ccd8db8ab018006519dd961629cc879cd0a9cfe80ced',
  expressions: matches.map(({ expression }) => expression),
  matches,
};

describe('getCorpusExpressionMatches', () => {
  it('保留服务端组顺序，只定位 AI 合并段并按渲染文本换算 UTF-16 坐标', () => {
    const merged = { ...sentences[2], text: sentences[2].text.replace('\n', '\r\n').replace('  \n', '  \r') };
    const rendered = sentences.map((sentence, index) => index === 2 ? merged : sentence);

    const result = getCorpusExpressionMatches(submittedText, rendered, corpus);

    expect(result).toEqual([
      { expression: '不仅仅是', occurrences: [{ sentenceIndex: 2, start: 1, end: 5 }, { sentenceIndex: 2, start: 30, end: 34 }] },
      { expression: '青山依旧', occurrences: [{ sentenceIndex: 2, start: 16, end: 20 }] },
      { expression: '神情', occurrences: [{ sentenceIndex: 2, start: 21, end: 23 }] },
    ]);
    expect(merged.text.slice(21, 23)).toBe('神情');
  });

  it('相同文字出现在不同段时只使用已记录的段位和坐标', () => {
    const recorded = [{ expression: '不仅仅是', offsets: [{ start: 66, end: 70 }] }];
    expect(getCorpusExpressionMatches(submittedText, sentences, { ...corpus, expressions: ['不仅仅是'], matches: recorded })).toEqual([]);
  });

  it('使用服务端的 Python Unicode 空白规则编号', () => {
    const text = '\u0085\r\n\u001c\r  套话';
    expect(getCorpusExpressionMatches(text, [block('  套话', 1, 1, 'ai')], {
      ...corpus, expressions: ['套话'], matches: [{ expression: '套话', offsets: [{ start: 7, end: 9 }] }],
    })).toEqual([{ expression: '套话', occurrences: [{ sentenceIndex: 0, start: 2, end: 4 }] }]);
  });

  it.each([
    ['缺坐标', { matches: undefined }],
    ['无命中', { status: 'no_match' }],
    ['身份错误', { lexiconSha256: 'bad' }],
    ['组顺序错误', { matches: [...matches].reverse() }],
    ['人类段坐标错字', { matches: [...matches.slice(0, -1), { ...matches[6], offsets: [{ start: 85, end: 91 }] }] }],
    ['重复坐标', { matches: [{ ...matches[0], offsets: [matches[0].offsets[0], matches[0].offsets[0]] }, ...matches.slice(1)] }],
    ['超出原文的坐标', { matches: [{ ...matches[0], offsets: [{ start: 15, end: 1000 }] }, ...matches.slice(1)] }],
  ] as const)('%s 时隐藏词表', (_, patch) => {
    expect(getCorpusExpressionMatches(submittedText, sentences, { ...corpus, ...patch } as EvidenceCorpusExpressions)).toEqual([]);
  });

  it.each([
    ['合成 AI 行', { isFallback: true }],
    ['缺范围', { startParagraph: undefined }],
    ['范围重叠', { startParagraph: 2 }],
    ['正文不一致', { text: sentences[2].text.trim().replace('  😀', '😀') }],
    ['原文不一致', { raw: sentences[2].text.replace('  😀', '😀') }],
  ] as const)('%s 时不猜位置', (_, patch) => {
    const changed = sentences.map((sentence, index) => index === 2 ? { ...sentence, ...patch } : sentence);
    expect(getCorpusExpressionMatches(submittedText, changed, corpus)).toEqual([]);
  });

  it('段位未覆盖原文时不定位', () => {
    expect(getCorpusExpressionMatches(submittedText, sentences.slice(0, -1), corpus)).toEqual([]);
  });
});
