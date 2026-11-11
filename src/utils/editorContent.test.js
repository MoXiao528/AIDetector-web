import { describe, expect, it } from 'vitest';

import { buildHighlightedPreviewHtml, buildSentenceDisplayLabels, buildSentenceParagraphLinkId, extractTextFromHtml, sanitizeHtmlForEditor } from './editorContent';
import zhCN from '../i18n/zh-CN';
import enUS from '../i18n/en-US';

describe('editorContent utils', () => {
  it.each([
    { copy: zhCN, author: ' 作者：张三 ', expected: ['标题', '作者', '段落 1-2 · 合并检测', '标题', '段落 3', '段落 4'] },
    { copy: enUS, author: 'AUTHOR: Jane Doe', expected: ['Title', 'Author', 'Paragraphs 1-2 · Merged', 'Title', 'Paragraph 3', 'Paragraph 4'] },
  ])('正文编号跳过开头和中间标题，保留合并范围与原定位：$author', ({ copy, author, expected }) => {
    const t = (key, values = {}) => copy.scan.results[key.split('.').at(-1)].replace(/\{([^}]+)\}/g, (_, name) => values[name]);
    const sentences = [
      { id: 'title', type: 'metadata', text: '背影', startParagraph: 1, endParagraph: 1 },
      { id: 'author', type: 'metadata', raw: author, startParagraph: 2, endParagraph: 2 },
      { id: 'merged', type: 'ai', raw: '第一段\n第二段', startParagraph: 3, endParagraph: 4 },
      { id: 'section', type: 'metadata', text: '章节标题', start_paragraph: 5, end_paragraph: 5 },
      { id: 'dialogue', type: 'too_short', text: '好。', startParagraph: 6, endParagraph: 6 },
      { id: 'body', type: 'human', text: '作者：这句仍是正文。', startParagraph: 7, endParagraph: 7 },
    ];
    const original = structuredClone(sentences);
    expect(buildSentenceDisplayLabels(sentences, t)).toEqual(expected);
    expect(sentences).toEqual(original);
    expect(buildSentenceParagraphLinkId(sentences[2], 3)).toBe('merged:p-3');
    expect(buildSentenceParagraphLinkId(sentences[2], 4)).toBe('merged:p-4');
    expect(buildSentenceDisplayLabels([
      { type: 'metadata', text: '旧标题' },
      { type: 'ai', text: '旧正文无段落范围' },
    ], t)).toEqual([expected[0], copy.scan.results.block.replace('{value}', '1')]);
    expect(buildSentenceDisplayLabels([
      { type: 'metadata', raw: '', text: author },
      { type: 'metadata', text: 'Author: notes\nA second heading line' },
    ], t)).toEqual([expected[1], expected[0]]);
  });

  it('仅服务端metadata跳过高亮，保留标题格式和普通短段/对话的原分类', () => {
    const html = '<h2 style="text-align: center"><strong>标题</strong></h2><p><em>作者：张三</em></p><p>好。</p><p>“去吧。”</p>';
    const sentences = [
      { id: 'title', type: 'metadata', probability: 0, startParagraph: 1, endParagraph: 1 },
      { id: 'byline', type: 'metadata', probability: 0, startParagraph: 2, endParagraph: 2 },
      { id: 'short-body', type: 'ai', probability: 0.9, startParagraph: 3, endParagraph: 3 },
      { id: 'dialogue', type: 'human', probability: 0.1, startParagraph: 4, endParagraph: 4 },
    ];
    const output = buildHighlightedPreviewHtml({ editorHtml: html, fallbackText: '标题\n作者：张三\n好。\n“去吧。”', sentences });
    const doc = new DOMParser().parseFromString(output, 'text/html');
    expect(doc.querySelector('h2')?.getAttribute('style')).toContain('text-align: center');
    expect(doc.querySelector('h2 strong')?.textContent).toBe('标题');
    expect(doc.querySelector('p em')?.textContent).toBe('作者：张三');
    expect(doc.querySelector('[data-sentence-id="title"], [data-sentence-id="byline"]')).toBeNull();
    expect(doc.querySelector('[data-sentence-id="short-body"]')?.classList.contains('bg-rose-100')).toBe(true);
    expect(doc.querySelector('[data-sentence-id="dialogue"]')?.classList.contains('bg-emerald-100')).toBe(true);
    expect(doc.querySelectorAll('.highlight-chip')).toHaveLength(2);

    // Heading-like text without the server flag is still judged normally.
    const ordinaryHeading = buildHighlightedPreviewHtml({
      editorHtml: '<h2>标题</h2>', fallbackText: '标题',
      sentences: [{ ...sentences[0], type: 'ai', probability: 0.9 }],
    });
    expect(ordinaryHeading).toContain('data-sentence-id="title"');
  });

  it.each([false, true])('新metadata投影覆盖旧高亮缓存（有编辑HTML=%s），不会把零占位画成人工绿色', (withEditorHtml) => {
    const oldHtml = '<h1><span class="highlight-chip bg-emerald-100 text-emerald-900" data-sentence-id="old-title"><strong>旧标题</strong></span></h1><p><span class="highlight-chip bg-orange-100" data-sentence-id="old-body">正文</span></p>';
    const output = buildHighlightedPreviewHtml({
      ...(withEditorHtml ? { editorHtml: oldHtml } : {}),
      fallbackText: '旧标题\n正文', fallbackHighlightedHtml: oldHtml,
      sentences: [
        { id: 'title', type: 'metadata', probability: 0, startParagraph: 1, endParagraph: 1 },
        { id: 'body', type: 'ai', probability: 0.9, startParagraph: 2, endParagraph: 2 },
      ],
    });
    const doc = new DOMParser().parseFromString(output, 'text/html');
    expect(doc.querySelector('h1 strong')?.textContent).toBe('旧标题');
    expect(doc.querySelector('h1 .highlight-chip, h1 [data-sentence-id], h1 [class]')).toBeNull();
    expect(doc.querySelectorAll('.highlight-chip')).toHaveLength(1);
    expect(doc.querySelector('[data-sentence-id="body"]')?.classList.contains('bg-rose-100')).toBe(true);
  });

  it('纯文本metadata原样显示，不产生任何高亮交互标记', () => {
    const output = buildHighlightedPreviewHtml({
      fallbackText: '标题\n作者：张三',
      sentences: [
        { id: 'title', type: 'metadata', score: 0, probability: 0, startParagraph: 1, endParagraph: 1 },
        { id: 'byline', type: 'metadata', score: 0, probability: 0, startParagraph: 2, endParagraph: 2 },
      ],
    });
    expect(output).toBe('<p>标题</p><p>作者：张三</p>');
  });

  it('extractTextFromHtml 保留块级结构顺序', () => {
    const html = `
      <h2>Title</h2>
      <ul>
        <li>First item</li>
        <li>Second <strong>item</strong></li>
      </ul>
      <p>Last line<br>continues</p>
    `;

    expect(extractTextFromHtml(html)).toBe('Title\n\nFirst item\n\nSecond item\n\nLast line\ncontinues');
  });

  it('根层 Shift+Enter 换行保留为段内单换行', () => {
    expect(extractTextFromHtml('first<br>second')).toBe('first\nsecond');
    expect(extractTextFromHtml('<strong>first</strong><br><em>second</em><p>third</p>'))
      .toBe('first\nsecond\n\nthird');
    expect(extractTextFromHtml('<div>first<br><span>second</span><p>third</p></div>'))
      .toBe('first\nsecond\n\nthird');
    expect(extractTextFromHtml('first<br><br>second')).toBe('first\n\nsecond');
    expect(extractTextFromHtml('<p>first<br>second</p>')).toBe('first\nsecond');
  });

  it('buildHighlightedPreviewHtml 在原始结构上做高亮，不打平 DOM', () => {
    const html = `
      <h2>Section Title</h2>
      <ol>
        <li><strong>First</strong> item</li>
        <li>Second item</li>
      </ol>
      <p>Closing paragraph</p>
    `;

    const output = buildHighlightedPreviewHtml({
      editorHtml: html,
      fallbackText: 'Section Title\nFirst item\nSecond item\nClosing paragraph',
      sentences: [
        { id: 'sent-1', startParagraph: 1, endParagraph: 1, probability: 0.9 },
        { id: 'sent-2', startParagraph: 2, endParagraph: 3, probability: 0.55 },
        { id: 'sent-3', startParagraph: 4, endParagraph: 4, probability: 0.2 },
      ],
    });

    expect(output).toContain('<h2');
    expect(output).toContain('<ol>');
    expect(output).toContain('<li');
    expect(output).toContain('<strong>First</strong>');
    expect(output).toContain('data-sentence-id="sent-1"');
    expect(output).toContain('data-sentence-id="sent-2:p-2"');
    expect(output).toContain('data-sentence-id="sent-2:p-3"');
    expect(output).toContain('data-sentence-block-id="sent-2"');
    expect(output).toContain('data-sentence-id="sent-3"');
    expect(output).toContain('highlight-chip');
    expect(output).not.toContain('highlight-block');
    expect(output).toContain('<h2><span');
  });

  it('buildHighlightedPreviewHtml 遇到嵌套列表时保留子列表结构', () => {
    const html = `
      <ul>
        <li>Parent item
          <ul>
            <li>Child item</li>
          </ul>
        </li>
      </ul>
    `;

    expect(extractTextFromHtml(html)).toBe('Parent item\n\nChild item');

    const output = buildHighlightedPreviewHtml({
      editorHtml: html,
      fallbackText: 'Parent item\nChild item',
      sentences: [
        { id: 'sent-parent', startParagraph: 1, endParagraph: 1, probability: 0.65 },
        { id: 'sent-child', startParagraph: 2, endParagraph: 2, probability: 0.35 },
      ],
    });

    expect(output).toContain('data-sentence-id="sent-parent"');
    expect(output).toContain('data-sentence-id="sent-child"');
    expect(output).toContain('<ul>');
    expect(output).toContain('Parent item');
    expect(output).toContain('Child item');
  });

  it('splits collapsed editor blocks by fallback paragraphs for linked hover', () => {
    const output = buildHighlightedPreviewHtml({
      editorHtml: '<div>Line one<br>Line two<br>Line three</div>',
      fallbackText: 'Line one\nLine two\nLine three',
      sentences: [{ id: 'merged-1', startParagraph: 1, endParagraph: 3, probability: 0.8 }],
    });

    expect(output).toContain('data-sentence-id="merged-1:p-1"');
    expect(output).toContain('data-sentence-id="merged-1:p-2"');
    expect(output).toContain('data-sentence-id="merged-1:p-3"');
    expect(output).toContain('data-sentence-block-id="merged-1"');
    expect(output.match(/<p>/g)?.length).toBe(3);
  });

  it('splits collapsed editor blocks even when fallback text lost paragraph breaks', () => {
    const output = buildHighlightedPreviewHtml({
      editorHtml: '<div>Line one<br>Line two<br>Line three</div>',
      fallbackText: 'Line one Line two Line three',
      sentences: [
        {
          id: 'merged-soft-breaks',
          text: 'Line one\nLine two\nLine three',
          raw: 'Line one\nLine two\nLine three',
          startParagraph: 1,
          endParagraph: 3,
          probability: 0.8,
        },
      ],
    });

    expect(output).toContain('data-sentence-id="merged-soft-breaks:p-1"');
    expect(output).toContain('data-sentence-id="merged-soft-breaks:p-2"');
    expect(output).toContain('data-sentence-id="merged-soft-breaks:p-3"');
    expect(output.match(/data-sentence-id=/g)?.length).toBe(3);
  });

  it('uses paragraph link ids for multiline text even when range is collapsed', () => {
    const sentence = {
      id: 'merged-collapsed',
      text: 'Line one\nLine two\nLine three',
      startParagraph: 1,
      endParagraph: 1,
    };

    expect(buildSentenceParagraphLinkId(sentence, 1)).toBe('merged-collapsed:p-1');
    expect(buildSentenceParagraphLinkId(sentence, 2)).toBe('merged-collapsed:p-2');
    expect(buildSentenceParagraphLinkId(sentence, 3)).toBe('merged-collapsed:p-3');
  });

  it('sanitizeHtmlForEditor 移除事件处理器和危险链接，但保留高亮属性', () => {
    const output = sanitizeHtmlForEditor(
      '<p onclick="alert(1)"><img src=x onerror="alert(1)">Text <a href="javascript:alert(1)">bad</a><span class="highlight-chip bg-rose-100 text-rose-900" data-sentence-id="sent-1">hot</span></p>'
    );

    expect(output).not.toContain('onclick');
    expect(output).not.toContain('onerror');
    expect(output).not.toContain('javascript:');
    expect(output).not.toContain('<img');
    expect(output).toContain('class="highlight-chip bg-rose-100 text-rose-900"');
    expect(output).toContain('data-sentence-id="sent-1"');
  });

  it('highlights top-level code/text pasted after a colon', () => {
    const html = `
      <p>Model downloaded to:</p>
      <code>D:\\huggingface\\WUJUNCHAO\\DetectRL-X-XLM-RoBERTa-Detector-All</code>
      <p>RepreGuard now returns:</p>
      <code>{ "score": 0.09459231793880463, "threshold": 0.0028 }</code>
    `;

    const expectedText = [
      'Model downloaded to:',
      'D:\\huggingface\\WUJUNCHAO\\DetectRL-X-XLM-RoBERTa-Detector-All',
      'RepreGuard now returns:',
      '{ "score": 0.09459231793880463, "threshold": 0.0028 }',
    ].join('\n\n');

    expect(extractTextFromHtml(html)).toBe(expectedText);

    const output = buildHighlightedPreviewHtml({
      editorHtml: html,
      fallbackText: expectedText,
      sentences: [
        { id: 'sent-download', startParagraph: 1, endParagraph: 2, probability: 0.9 },
        { id: 'sent-response', startParagraph: 3, endParagraph: 4, probability: 0.7 },
      ],
    });

    expect(output).toContain('data-sentence-id="sent-download:p-1"');
    expect(output).toContain('data-sentence-id="sent-download:p-2"');
    expect(output).toContain('data-sentence-id="sent-response:p-3"');
    expect(output).toContain('data-sentence-id="sent-response:p-4"');
    expect(output).toContain('data-sentence-block-id="sent-download"');
    expect(output).toContain('data-sentence-block-id="sent-response"');
    expect(output).toContain('<span class="highlight-chip highlight-chip--structured');
    expect(output).toContain('<code>D:\\huggingface\\WUJUNCHAO\\DetectRL-X-XLM-RoBERTa-Detector-All</code>');
    expect(output).toContain('<code>{ "score": 0.09459231793880463, "threshold": 0.0028 }</code>');
  });

  it('preserves pasted div blocks as separate paragraphs for detection text', () => {
    const html = '<div>First</div><div>Second</div>';

    expect(sanitizeHtmlForEditor(html)).toBe('<div>First</div><div>Second</div>');
    expect(extractTextFromHtml(html)).toBe('First\n\nSecond');
  });

  it('提取混合容器中头、中、尾的正文，并让新结果覆盖全部段落', () => {
    const html = '<div>HEAD<div>07:08</div><div>BODY-A</div><span>MIDDLE</span><div>07:23</div><div>BODY-B</div>TAIL</div>';
    const paragraphs = ['HEAD', '07:08', 'BODY-A', 'MIDDLE', '07:23', 'BODY-B', 'TAIL'];
    const text = paragraphs.join('\n\n');
    expect(extractTextFromHtml(html)).toBe(text);
    const sentences = paragraphs.map((raw, index) => ({
      id: `new-${index}`, raw, startParagraph: index + 1, endParagraph: index + 1,
      type: index === 1 ? 'too_short' : 'human', probability: 0.1,
    }));
    const output = buildHighlightedPreviewHtml({ editorHtml: html, fallbackText: text, sentences });
    const doc = new DOMParser().parseFromString(output, 'text/html');
    expect(Array.from(doc.querySelectorAll('[data-sentence-id]'), (node) => node.textContent)).toEqual(paragraphs);
    expect(doc.querySelector('[data-sentence-id="new-1"]').classList.contains('bg-slate-100')).toBe(true);
  });

  it('旧结果漏送正文时保留完整格式原文，移除旧高亮并禁止按旧段号重新着色', () => {
    const output = buildHighlightedPreviewHtml({
      editorHtml: '<div style="font-size: 14px">HEAD<div><span class="highlight-chip bg-rose-100" data-sentence-id="old-1">BODY-A</span></div><strong>MIDDLE</strong><div>BODY-B</div></div>',
      fallbackText: 'BODY-A\nBODY-B',
      sentences: [{ id: 'old-1', startParagraph: 1, endParagraph: 1, probability: 1 }],
    });
    expect(extractTextFromHtml(output)).toBe('HEAD\n\nBODY-A\n\nMIDDLE\n\nBODY-B');
    expect(output).toContain('<strong>MIDDLE</strong>');
    expect(output).toContain('font-size: 14px');
    expect(output).not.toContain('data-sentence');
    expect(output).not.toContain('highlight-chip');
    expect(output).not.toContain('bg-rose-100');
  });

  it('strips layout classes but keeps generated highlight classes', () => {
    const output = sanitizeHtmlForEditor(
      '<div class="fixed grid highlight-chip bg-rose-100 text-rose-900" data-sentence-id="sent-1">Hot</div>'
    );

    expect(output).toContain('class="highlight-chip bg-rose-100 text-rose-900"');
    expect(output).toContain('data-sentence-id="sent-1"');
    expect(output).not.toContain('fixed');
    expect(output).not.toContain('grid');
  });

  it('preserves editor toolbar formatting while stripping unsafe styles', () => {
    const output = sanitizeHtmlForEditor(
      '<div style="text-align: center; position: fixed" onclick="bad()"><font size="4" color="red">Large</font></div>'
    );

    expect(output).toContain('style="text-align: center"');
    expect(output).toContain('<font size="4">Large</font>');
    expect(output).not.toContain('position');
    expect(output).not.toContain('onclick');
    expect(output).not.toContain('color=');
  });
});
