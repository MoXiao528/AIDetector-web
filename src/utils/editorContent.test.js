import { describe, expect, it } from 'vitest';

import { buildHighlightedPreviewHtml, buildSentenceParagraphLinkId, extractTextFromHtml, sanitizeHtmlForEditor } from './editorContent';

describe('editorContent utils', () => {
  it('extractTextFromHtml 保留块级结构顺序', () => {
    const html = `
      <h2>Title</h2>
      <ul>
        <li>First item</li>
        <li>Second <strong>item</strong></li>
      </ul>
      <p>Last line<br>continues</p>
    `;

    expect(extractTextFromHtml(html)).toBe('Title\nFirst item\nSecond item\nLast line\ncontinues');
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
    ].join('\n');

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
    expect(extractTextFromHtml(html)).toBe('First\nSecond');
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
