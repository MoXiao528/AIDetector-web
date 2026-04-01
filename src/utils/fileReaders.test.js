import { describe, expect, it } from 'vitest';

import { buildPdfHtmlFromPageItems, combineImportedFileContents, sanitizeImportedHtml } from './fileReaders';

describe('fileReaders utils', () => {
  it('sanitizeImportedHtml 保留安全结构并移除危险标签', () => {
    const output = sanitizeImportedHtml(`
      <h2>Title</h2>
      <p>Hello <strong>world</strong><script>alert(1)</script></p>
      <ul><li>First</li><li><a href="javascript:alert(1)">bad</a><a href="https://example.com">good</a></li></ul>
    `);

    expect(output).toContain('<h2>Title</h2>');
    expect(output).toContain('<strong>world</strong>');
    expect(output).not.toContain('<script');
    expect(output).not.toContain('javascript:alert');
    expect(output).toContain('href="https://example.com"');
  });

  it('buildPdfHtmlFromPageItems 重建页级结构', () => {
    const output = buildPdfHtmlFromPageItems([
      [
        { str: 'Section Title', transform: [1, 0, 0, 18, 40, 720], width: 100, height: 18 },
        { str: '• First bullet', transform: [1, 0, 0, 12, 40, 680], width: 90, height: 12 },
        { str: '• Second bullet', transform: [1, 0, 0, 12, 40, 660], width: 100, height: 12 },
        { str: 'Paragraph line one', transform: [1, 0, 0, 12, 40, 620], width: 120, height: 12 },
        { str: 'continues here', transform: [1, 0, 0, 12, 40, 606], width: 90, height: 12 },
      ],
    ]);

    expect(output).toContain('data-pdf-page="1"');
    expect(output).toContain('<h2>Section Title</h2>');
    expect(output).toContain('<ul><li>First bullet</li><li>Second bullet</li></ul>');
    expect(output).toContain('<p>Paragraph line one<br>continues here</p>');
  });

  it('combineImportedFileContents 合并结构化导入结果', () => {
    const output = combineImportedFileContents([
      { text: 'Alpha', html: '<p>Alpha</p>', sourceType: 'docx', fileName: 'a.docx' },
      { text: 'Beta', html: '<section data-pdf-page="1"><p>Beta</p></section>', sourceType: 'pdf', fileName: 'b.pdf' },
    ]);

    expect(output.text).toBe('Alpha\n\nBeta');
    expect(output.html).toContain('<section data-imported-file="true"><p>Alpha</p></section>');
    expect(output.html).toContain('<section data-pdf-page="1"><p>Beta</p></section>');
  });
});
