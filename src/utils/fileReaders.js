import { globalT } from '../i18n';
import { escapeHtml, extractTextFromHtml, plainTextToHtml } from './editorContent';

const TEXT_LIKE_EXTENSIONS = ['txt', 'md', 'markdown', 'json', 'csv', 'yml', 'yaml', 'xml', 'log', 'tex', 'tax'];
const HTML_LIKE_EXTENSIONS = ['html', 'htm'];
const DOCX_EXTENSIONS = ['docx'];
const PDF_EXTENSIONS = ['pdf'];

const decoder = new TextDecoder();

const HTML_BLOCK_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'span',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'blockquote',
  'pre',
  'code',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'a',
  'sub',
  'sup',
]);

const HTML_DROP_TAGS = new Set(['script', 'style', 'noscript', 'iframe', 'object', 'embed', 'meta', 'link']);
const EMPTY_KEEP_TAGS = new Set(['p', 'li', 'blockquote', 'pre', 'th', 'td']);
const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

const readAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(globalT('errors.readFailed')));
    reader.readAsText(file);
  });

const readAsArrayBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(globalT('errors.readFailed')));
    reader.readAsArrayBuffer(file);
  });

const normalizeImportedText = (value = '') =>
  String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .trim();

const normalizeInlineWhitespace = (value = '') => String(value || '').replace(/\s+/g, ' ').trim();

const buildImportedFileContent = ({ text = '', html = '', sourceType = 'text', fileName = '' } = {}) => {
  const normalizedText = normalizeImportedText(text);
  const normalizedHtml = String(html || '').trim() || plainTextToHtml(normalizedText);
  return {
    text: normalizedText,
    html: normalizedHtml,
    sourceType,
    fileName,
  };
};

const sanitizeHref = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('#') || raw.startsWith('/')) {
    return raw;
  }

  try {
    const parsed = new URL(raw, 'https://aidetector.local');
    if (!SAFE_URL_PROTOCOLS.has(parsed.protocol)) {
      return '';
    }
    return raw;
  } catch {
    return '';
  }
};

const sanitizeImportedNode = (node, doc) => {
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) {
    return doc.createTextNode(node.textContent || '');
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const tagName = node.tagName?.toLowerCase?.() || '';
  if (!tagName || HTML_DROP_TAGS.has(tagName)) {
    return null;
  }

  if (!HTML_BLOCK_TAGS.has(tagName)) {
    const fragment = doc.createDocumentFragment();
    Array.from(node.childNodes || []).forEach((child) => {
      const safeChild = sanitizeImportedNode(child, doc);
      if (safeChild) {
        fragment.appendChild(safeChild);
      }
    });
    return fragment;
  }

  const safeElement = doc.createElement(tagName);

  if (tagName === 'a') {
    const href = sanitizeHref(node.getAttribute('href'));
    if (href) {
      safeElement.setAttribute('href', href);
      safeElement.setAttribute('target', '_blank');
      safeElement.setAttribute('rel', 'noopener noreferrer');
    }
  }

  if (tagName === 'td' || tagName === 'th') {
    const colspan = node.getAttribute('colspan');
    const rowspan = node.getAttribute('rowspan');
    if (colspan && /^\d+$/.test(colspan)) {
      safeElement.setAttribute('colspan', colspan);
    }
    if (rowspan && /^\d+$/.test(rowspan)) {
      safeElement.setAttribute('rowspan', rowspan);
    }
  }

  Array.from(node.childNodes || []).forEach((child) => {
    const safeChild = sanitizeImportedNode(child, doc);
    if (safeChild) {
      safeElement.appendChild(safeChild);
    }
  });

  if (!safeElement.childNodes.length && EMPTY_KEEP_TAGS.has(tagName)) {
    safeElement.appendChild(doc.createElement('br'));
  }

  if (tagName === 'a' && !safeElement.getAttribute('href')) {
    const fragment = doc.createDocumentFragment();
    Array.from(safeElement.childNodes || []).forEach((child) => {
      fragment.appendChild(child);
    });
    return fragment;
  }

  return safeElement;
};

export const sanitizeImportedHtml = (html = '', fallbackText = '') => {
  if (typeof window === 'undefined') {
    return plainTextToHtml(fallbackText || String(html || '').replace(/<[^>]+>/g, ' '));
  }

  const parser = new DOMParser();
  const parsed = parser.parseFromString(`<body>${html || ''}</body>`, 'text/html');
  const safeDoc = document.implementation.createHTMLDocument('');
  const safeBody = safeDoc.body;

  Array.from(parsed.body.childNodes || []).forEach((child) => {
    const safeNode = sanitizeImportedNode(child, safeDoc);
    if (safeNode) {
      safeBody.appendChild(safeNode);
    }
  });

  const normalizedHtml = safeBody.innerHTML.trim();
  if (normalizedHtml) {
    return normalizedHtml;
  }

  return plainTextToHtml(fallbackText || extractTextFromHtml(String(html || '')));
};

const getPdfItemGeometry = (item = {}) => {
  const transform = Array.isArray(item.transform) ? item.transform : [];
  const x = Number(transform[4] ?? item.x ?? 0);
  const y = Number(transform[5] ?? item.y ?? 0);
  const height = Math.max(1, Number(item.height ?? Math.abs(transform[3] ?? 0) ?? 12));
  const width = Math.max(0, Number(item.width ?? 0));
  const text = String(item.str ?? '').split('\u0000').join('');
  return {
    text,
    x,
    y,
    height,
    width,
    avgCharWidth: width / Math.max(text.length, 1),
  };
};

const buildPdfLines = (items = []) => {
  const normalizedItems = items
    .map((item) => getPdfItemGeometry(item))
    .filter((item) => item.text && item.text.trim())
    .sort((left, right) => {
      if (Math.abs(right.y - left.y) > 2) {
        return right.y - left.y;
      }
      return left.x - right.x;
    });

  if (!normalizedItems.length) {
    return [];
  }

  const lines = [];
  let currentLine = null;

  normalizedItems.forEach((item) => {
    if (!currentLine) {
      currentLine = { y: item.y, height: item.height, items: [item] };
      lines.push(currentLine);
      return;
    }

    const tolerance = Math.max(3, Math.max(currentLine.height, item.height) * 0.45);
    if (Math.abs(currentLine.y - item.y) <= tolerance) {
      currentLine.items.push(item);
      currentLine.height = Math.max(currentLine.height, item.height);
      return;
    }

    currentLine = { y: item.y, height: item.height, items: [item] };
    lines.push(currentLine);
  });

  return lines
    .map((line) => {
      const orderedItems = line.items.sort((left, right) => left.x - right.x);
      let text = '';
      let previousItem = null;

      orderedItems.forEach((item) => {
        const normalizedText = String(item.text || '');
        if (!normalizedText.trim()) {
          return;
        }

        if (!text) {
          text = normalizedText;
          previousItem = item;
          return;
        }

        const gap = item.x - ((previousItem?.x || 0) + (previousItem?.width || 0));
        const spacingThreshold = Math.max(2, ((previousItem?.avgCharWidth || 0) + item.avgCharWidth) * 0.7);
        const needsSpace =
          gap > spacingThreshold &&
          !/\s$/.test(text) &&
          !/^[,.;:!?%)\]}]/.test(normalizedText) &&
          !/^[\s]/.test(normalizedText);

        text += `${needsSpace ? ' ' : ''}${normalizedText}`;
        previousItem = item;
      });

      return {
        text: normalizeInlineWhitespace(text),
        y: line.y,
        height: line.height,
      };
    })
    .filter((line) => line.text);
};

const getMedianValue = (values = []) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
};

const parsePdfListMarker = (text = '') => {
  const trimmed = String(text || '').trim();
  const bulletMatch = trimmed.match(/^([•●▪◦■□\-–—])\s+(.*)$/);
  if (bulletMatch) {
    return { type: 'ul', content: bulletMatch[2].trim() };
  }

  const orderedMatch = trimmed.match(/^(\d+|[A-Za-z])[.)]\s+(.*)$/);
  if (orderedMatch) {
    return { type: 'ol', content: orderedMatch[2].trim() };
  }

  return null;
};

const buildPdfBlocks = (lines = []) => {
  const blocks = [];
  let currentBlock = null;
  let previousLine = null;

  lines.forEach((line) => {
    const verticalGap = previousLine ? previousLine.y - line.y : 0;
    const shouldBreak =
      !currentBlock || verticalGap > Math.max(previousLine?.height || 0, line.height) * 1.75;

    if (shouldBreak) {
      currentBlock = { lines: [line] };
      blocks.push(currentBlock);
    } else {
      currentBlock.lines.push(line);
    }

    previousLine = line;
  });

  return blocks;
};

const renderPdfBlock = (block, medianLineHeight = 12) => {
  const lines = Array.isArray(block?.lines) ? block.lines : [];
  if (!lines.length) return '';

  const listItems = lines.map((line) => parsePdfListMarker(line.text));
  if (listItems.every(Boolean) && new Set(listItems.map((item) => item.type)).size === 1) {
    const listTag = listItems[0].type;
    return `<${listTag}>${listItems
      .map((item) => `<li>${escapeHtml(item.content)}</li>`)
      .join('')}</${listTag}>`;
  }

  const averageHeight = lines.reduce((sum, line) => sum + line.height, 0) / lines.length;
  const joinedText = lines.map((line) => line.text).join(' ');
  const lineHtml = lines.map((line) => escapeHtml(line.text)).join('<br>');
  const isHeading = lines.length <= 2 && averageHeight >= medianLineHeight * 1.2 && joinedText.length <= 120;

  return isHeading ? `<h2>${lineHtml}</h2>` : `<p>${lineHtml}</p>`;
};

export const buildPdfHtmlFromPageItems = (pages = []) => {
  const pageLines = pages.map((page) => buildPdfLines(page));
  const medianLineHeight = getMedianValue(
    pageLines.flatMap((lines) => lines.map((line) => line.height)).filter((value) => value > 0)
  );

  return pageLines
    .map((lines, index) => {
      const blocks = buildPdfBlocks(lines);
      const blockHtml = blocks.map((block) => renderPdfBlock(block, medianLineHeight || 12)).filter(Boolean).join('');
      if (!blockHtml) {
        return '';
      }
      return `<section data-pdf-page="${index + 1}">${blockHtml}</section>`;
    })
    .filter(Boolean)
    .join('');
};

const extractDocxContent = async (file) => {
  const { convertToHtml } = await import('mammoth');
  const buffer = await readAsArrayBuffer(file);

  try {
    const result = await convertToHtml({ arrayBuffer: buffer });
    const html = sanitizeImportedHtml(result.value || '');
    const text = extractTextFromHtml(html);
    if (!text) {
      throw new Error(globalT('errors.unsupportedDocx'));
    }
    return buildImportedFileContent({ text, html, sourceType: 'docx', fileName: file.name });
  } catch {
    throw new Error(globalT('errors.unsupportedDocx'));
  }
};

const extractPdfContent = async (file) => {
  const buffer = await readAsArrayBuffer(file);
  const pdfjsLib = await import('pdfjs-dist/build/pdf');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;
  }

  try {
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pageNumbers = Array.from({ length: pdf.numPages }, (_, index) => index + 1);
    const pageItems = await Promise.all(
      pageNumbers.map(async (pageNumber) => {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        return content.items || [];
      })
    );

    const html = buildPdfHtmlFromPageItems(pageItems);
    const text = extractTextFromHtml(html);
    if (!text) {
      throw new Error(globalT('errors.unsupportedPdf'));
    }

    return buildImportedFileContent({ text, html, sourceType: 'pdf', fileName: file.name });
  } catch {
    throw new Error(globalT('errors.unsupportedPdf'));
  }
};

const extractTextContent = async (file, extension) => {
  const text = await readAsText(file);
  if (HTML_LIKE_EXTENSIONS.includes(extension)) {
    const html = sanitizeImportedHtml(text, text);
    return buildImportedFileContent({
      text: extractTextFromHtml(html),
      html,
      sourceType: 'html',
      fileName: file.name,
    });
  }

  return buildImportedFileContent({
    text,
    html: plainTextToHtml(text),
    sourceType: 'text',
    fileName: file.name,
  });
};

const extractUnknownText = async (file) => {
  const buffer = await readAsArrayBuffer(file);
  const text = decoder.decode(buffer);
  return buildImportedFileContent({
    text,
    html: plainTextToHtml(text),
    sourceType: 'text',
    fileName: file.name,
  });
};

export const combineImportedFileContents = (items = []) => {
  const normalizedItems = Array.from(items || []).filter((item) => item && (item.text || item.html));
  if (!normalizedItems.length) {
    return buildImportedFileContent();
  }
  if (normalizedItems.length === 1) {
    return buildImportedFileContent(normalizedItems[0]);
  }

  const text = normalizedItems.map((item) => normalizeImportedText(item.text)).filter(Boolean).join('\n\n');
  const html = normalizedItems
    .map((item) => {
      const contentHtml = String(item.html || '').trim() || plainTextToHtml(item.text || '');
      return `<section data-imported-file="true">${contentHtml}</section>`;
    })
    .join('');

  return buildImportedFileContent({
    text,
    html,
    sourceType: 'multi',
  });
};

export const readTextFromFile = async (file) => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (!extension) {
    throw new Error(globalT('errors.unknownFormat'));
  }

  if (TEXT_LIKE_EXTENSIONS.includes(extension) || HTML_LIKE_EXTENSIONS.includes(extension)) {
    return extractTextContent(file, extension);
  }

  if (DOCX_EXTENSIONS.includes(extension)) {
    return extractDocxContent(file);
  }

  if (PDF_EXTENSIONS.includes(extension)) {
    return extractPdfContent(file);
  }

  return extractUnknownText(file);
};
