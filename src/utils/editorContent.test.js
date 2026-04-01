import { describe, expect, it } from 'vitest';

import { buildHighlightedPreviewHtml, extractTextFromHtml } from './editorContent';

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
    expect(output).toContain('data-sentence-id="sent-2"');
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
});
