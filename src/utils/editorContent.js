import { clampProbability, getProbabilityChipClasses } from './detectionStyles';

const LEAF_BLOCK_TAGS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'LI']);
const CONTAINER_TAGS = new Set([
  'BODY',
  'DIV',
  'SECTION',
  'ARTICLE',
  'MAIN',
  'ASIDE',
  'HEADER',
  'FOOTER',
  'BLOCKQUOTE',
  'UL',
  'OL',
  'TABLE',
  'THEAD',
  'TBODY',
  'TR',
  'TD',
  'TH',
]);
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT']);
const SAFE_HTML_TAGS = new Set([
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'span',
  'font',
  'div',
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
  'section',
]);
const DROP_HTML_TAGS = new Set(['script', 'style', 'noscript', 'iframe', 'object', 'embed', 'meta', 'link']);
const EMPTY_KEEP_TAGS = new Set(['p', 'li', 'blockquote', 'pre', 'th', 'td']);
const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);
const SAFE_CLASS_TOKENS = new Set([
  'highlight-chip',
  'highlight-chip--structured',
  'bg-rose-100',
  'text-rose-900',
  'bg-orange-100',
  'text-orange-900',
  'bg-amber-100',
  'text-amber-900',
  'bg-lime-100',
  'text-lime-900',
  'bg-emerald-100',
  'text-emerald-900',
  'bg-slate-100',
  'text-slate-600',
  'ring-1',
  'ring-slate-200',
]);
const SAFE_DATA_SENTENCE_ID_PATTERN = /^[\w:.-]+$/;
const SAFE_ALIGN_VALUES = new Set(['left', 'right', 'center', 'justify', 'start', 'end']);
const SAFE_STYLE_PROPERTIES = new Set(['text-align', 'font-size']);
const SAFE_FONT_SIZE_PATTERN =
  /^(?:\d{1,2}(?:\.\d+)?(?:px|em|rem|%)|xx-small|x-small|small|medium|large|x-large|xx-large|smaller|larger)$/i;

const isElementNode = (node) => node?.nodeType === Node.ELEMENT_NODE;
const isTextNode = (node) => node?.nodeType === Node.TEXT_NODE;

export const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const plainTextToHtml = (value = '') => {
  if (!value) return '';
  const normalized = String(value).replace(/\r\n/g, '\n');
  return normalized
    .split('\n')
    .map((line) => {
      if (!line) {
        return '<p><br></p>';
      }
      return `<p>${escapeHtml(line)
        .replace(/  /g, ' &nbsp;')
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')}</p>`;
    })
    .join('');
};

const sanitizeHref = (value = '') => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('#') || raw.startsWith('/')) {
    return raw;
  }

  try {
    const parsed = new URL(raw, 'https://aidetector.local');
    return SAFE_URL_PROTOCOLS.has(parsed.protocol) ? raw : '';
  } catch {
    return '';
  }
};

const sanitizeStyle = (value = '') => {
  const declarations = String(value || '')
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
  const safeDeclarations = [];

  declarations.forEach((declaration) => {
    const [rawProperty, ...rawValueParts] = declaration.split(':');
    const property = String(rawProperty || '').trim().toLowerCase();
    const styleValue = rawValueParts.join(':').trim().toLowerCase();
    if (!SAFE_STYLE_PROPERTIES.has(property) || !styleValue) return;

    if (property === 'text-align' && SAFE_ALIGN_VALUES.has(styleValue)) {
      safeDeclarations.push(`${property}: ${styleValue}`);
      return;
    }

    if (property === 'font-size' && SAFE_FONT_SIZE_PATTERN.test(styleValue)) {
      safeDeclarations.push(`${property}: ${styleValue}`);
    }
  });

  return safeDeclarations.join('; ');
};

const copySafeAttributes = (source, target, tagName) => {
  if (tagName === 'a') {
    const href = sanitizeHref(source.getAttribute('href'));
    if (href) {
      target.setAttribute('href', href);
      target.setAttribute('target', '_blank');
      target.setAttribute('rel', 'noopener noreferrer');
    }
  }

  if (tagName === 'td' || tagName === 'th') {
    const colspan = source.getAttribute('colspan');
    const rowspan = source.getAttribute('rowspan');
    if (colspan && /^\d+$/.test(colspan)) {
      target.setAttribute('colspan', colspan);
    }
    if (rowspan && /^\d+$/.test(rowspan)) {
      target.setAttribute('rowspan', rowspan);
    }
  }

  if (tagName === 'font') {
    const size = source.getAttribute('size');
    if (size && /^[1-7]$/.test(size)) {
      target.setAttribute('size', size);
    }
  }

  const align = source.getAttribute('align');
  if (align && SAFE_ALIGN_VALUES.has(align.trim().toLowerCase())) {
    target.setAttribute('align', align.trim().toLowerCase());
  }

  const safeStyle = sanitizeStyle(source.getAttribute('style'));
  if (safeStyle) {
    target.setAttribute('style', safeStyle);
  }

  const safeClasses = String(source.getAttribute('class') || '')
    .split(/\s+/)
    .map((item) => item.trim())
    .filter((item) => SAFE_CLASS_TOKENS.has(item));
  if (safeClasses.length) {
    target.setAttribute('class', Array.from(new Set(safeClasses)).join(' '));
  }

  const sentenceId = source.getAttribute('data-sentence-id');
  if (sentenceId && SAFE_DATA_SENTENCE_ID_PATTERN.test(sentenceId)) {
    target.setAttribute('data-sentence-id', sentenceId);
  }

  const sentenceBlockId = source.getAttribute('data-sentence-block-id');
  if (sentenceBlockId && SAFE_DATA_SENTENCE_ID_PATTERN.test(sentenceBlockId)) {
    target.setAttribute('data-sentence-block-id', sentenceBlockId);
  }

  const pdfPage = source.getAttribute('data-pdf-page');
  if (tagName === 'section' && pdfPage && /^\d+$/.test(pdfPage)) {
    target.setAttribute('data-pdf-page', pdfPage);
  }
};

const sanitizeHtmlNode = (node, doc) => {
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) {
    return doc.createTextNode(node.textContent || '');
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const tagName = node.tagName?.toLowerCase?.() || '';
  if (!tagName || DROP_HTML_TAGS.has(tagName)) {
    return null;
  }

  if (!SAFE_HTML_TAGS.has(tagName)) {
    const fragment = doc.createDocumentFragment();
    Array.from(node.childNodes || []).forEach((child) => {
      const safeChild = sanitizeHtmlNode(child, doc);
      if (safeChild) {
        fragment.appendChild(safeChild);
      }
    });
    return fragment;
  }

  const safeElement = doc.createElement(tagName);
  copySafeAttributes(node, safeElement, tagName);

  Array.from(node.childNodes || []).forEach((child) => {
    const safeChild = sanitizeHtmlNode(child, doc);
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

export const sanitizeHtmlForEditor = (html = '', fallbackText = '') => {
  if (typeof window === 'undefined') {
    return plainTextToHtml(fallbackText || String(html || '').replace(/<[^>]+>/g, ' '));
  }

  const parsed = createDocumentFromHtml(html || '');
  if (!parsed?.body) {
    return plainTextToHtml(fallbackText || String(html || '').replace(/<[^>]+>/g, ' '));
  }

  const safeDoc = document.implementation.createHTMLDocument('');
  const safeBody = safeDoc.body;
  Array.from(parsed.body.childNodes || []).forEach((child) => {
    const safeNode = sanitizeHtmlNode(child, safeDoc);
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

const createDocumentFromHtml = (html = '') => {
  if (typeof window === 'undefined') return null;
  const parser = new DOMParser();
  return parser.parseFromString(`<body>${html}</body>`, 'text/html');
};

const normalizeBlockText = (value = '') =>
  String(value)
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

const extractNodeText = (node) => {
  if (!node) return '';
  if (isTextNode(node)) {
    return node.textContent || '';
  }
  if (!isElementNode(node)) {
    return '';
  }

  const tagName = node.tagName?.toUpperCase?.() || '';
  if (tagName === 'BR') {
    return '\n';
  }
  if (SKIP_TAGS.has(tagName)) {
    return '';
  }

  return Array.from(node.childNodes)
    .map((child) => extractNodeText(child))
    .join('');
};

const hasMeaningfulText = (element) => normalizeBlockText(extractNodeText(element)).length > 0;

const isStructuralTagName = (tagName = '') => LEAF_BLOCK_TAGS.has(tagName) || CONTAINER_TAGS.has(tagName);

const hasStructuralChildren = (element) =>
  Array.from(element.children || []).some((child) => {
    const tagName = child.tagName?.toUpperCase?.() || '';
    return isStructuralTagName(tagName);
  });

const extractOwnInlineText = (element) =>
  Array.from(element.childNodes || [])
    .map((child) => {
      if (isElementNode(child)) {
        const tagName = child.tagName?.toUpperCase?.() || '';
        if (isStructuralTagName(tagName)) {
          return '';
        }
      }
      return extractNodeText(child);
    })
    .join('');

const hasOwnMeaningfulText = (element) => normalizeBlockText(extractOwnInlineText(element)).length > 0;

const normalizeRootInlineRuns = (root) => {
  if (!root?.ownerDocument) return;

  let run = [];
  const flushRun = (beforeNode = null) => {
    if (!run.length) return;

    const hasText = run.some((node) => normalizeBlockText(extractNodeText(node)).length > 0);
    if (!hasText) {
      run = [];
      return;
    }

    const paragraph = root.ownerDocument.createElement('p');
    root.insertBefore(paragraph, beforeNode);
    run.forEach((node) => {
      paragraph.appendChild(node);
    });
    run = [];
  };

  Array.from(root.childNodes || []).forEach((child) => {
    if (isTextNode(child)) {
      if ((child.textContent || '').trim() || run.length) {
        run.push(child);
      }
      return;
    }

    if (!isElementNode(child)) {
      flushRun(child);
      return;
    }

    const tagName = child.tagName?.toUpperCase?.() || '';
    if (tagName === 'BR') {
      flushRun(child);
      child.remove();
      return;
    }
    if (SKIP_TAGS.has(tagName) || isStructuralTagName(tagName)) {
      flushRun(child);
      return;
    }

    run.push(child);
  });

  flushRun(null);
};

const collectRenderableBlocks = (root) => {
  if (!root) return [];

  normalizeRootInlineRuns(root);

  const blocks = [];
  const visit = (node) => {
    if (!isElementNode(node)) return;

    const tagName = node.tagName?.toUpperCase?.() || '';
    if (SKIP_TAGS.has(tagName)) return;

    if (LEAF_BLOCK_TAGS.has(tagName)) {
      if (tagName === 'LI' && hasStructuralChildren(node)) {
        if (hasOwnMeaningfulText(node)) {
          blocks.push(node);
        }
        Array.from(node.childNodes || []).forEach((child) => {
          if (isElementNode(child)) {
            const childTagName = child.tagName?.toUpperCase?.() || '';
            if (isStructuralTagName(childTagName)) {
              visit(child);
            }
          }
        });
        return;
      }
      if (hasMeaningfulText(node)) {
        blocks.push(node);
      }
      return;
    }

    if ((tagName === 'DIV' || tagName === 'BLOCKQUOTE' || tagName === 'TD' || tagName === 'TH') && !hasStructuralChildren(node)) {
      if (hasMeaningfulText(node)) {
        blocks.push(node);
      }
      return;
    }

    Array.from(node.childNodes || []).forEach((child) => {
      if (isElementNode(child)) {
        visit(child);
      }
    });
  };

  Array.from(root.childNodes || []).forEach((child) => {
    if (isElementNode(child)) {
      visit(child);
    }
  });

  return blocks;
};

export const extractTextFromHtml = (html = '') => {
  if (!html) return '';
  if (typeof window === 'undefined') {
    return String(html).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
  }

  const doc = createDocumentFromHtml(html);
  if (!doc) return '';

  const blocks = collectRenderableBlocks(doc.body);
  if (!blocks.length) {
    return normalizeBlockText(extractNodeText(doc.body));
  }

  return blocks
    .map((block) => normalizeBlockText(extractNodeText(block)))
    .filter(Boolean)
    .join('\n');
};

export const hasParagraphRange = (sentence) => {
  const start = Number(sentence?.startParagraph ?? sentence?.start_paragraph);
  const end = Number(sentence?.endParagraph ?? sentence?.end_paragraph);
  return Number.isFinite(start) && start > 0 && Number.isFinite(end) && end >= start;
};

export const resolveSentenceRange = (sentence, fallbackIndex = 0) => {
  const start = Number(sentence?.startParagraph ?? sentence?.start_paragraph);
  const end = Number(sentence?.endParagraph ?? sentence?.end_paragraph);
  if (Number.isFinite(start) && start > 0) {
    return {
      start,
      end: Number.isFinite(end) && end >= start ? end : start,
    };
  }
  const index = fallbackIndex + 1;
  return { start: index, end: index };
};

export const buildSentenceParagraphLinkId = (sentence, paragraphIndex = 0) => {
  const fallbackIndex = Math.max(Number(paragraphIndex) || 1, 1) - 1;
  const range = resolveSentenceRange(sentence, fallbackIndex);
  const baseId = String(sentence?.id || `paragraph-${Math.max(Number(paragraphIndex) || range.start, 1)}`);
  const paragraphCount = countPlainTextParagraphs(sentence?.raw ?? sentence?.text ?? '');
  if (range.start === range.end && paragraphCount <= 1) {
    return baseId;
  }
  const normalizedParagraphIndex = Math.max(Number(paragraphIndex) || range.start, range.start);
  return `${baseId}:p-${normalizedParagraphIndex}`;
};

const resolveSentenceForParagraph = (paragraphIndex, sentences = []) =>
  sentences.find((sentence, index) => {
    const range = resolveSentenceRange(sentence, index);
    return paragraphIndex >= range.start && paragraphIndex <= range.end;
  }) || null;

const buildPlainHighlightedHtml = (text = '', sentences = []) => {
  const paragraphs = String(text)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((raw) => ({ raw, text: raw.trim() }));

  if (!paragraphs.length) {
    return plainTextToHtml(text);
  }

  let visibleParagraphIndex = 0;
  return paragraphs
    .map((paragraph) => {
      if (!paragraph.text) {
        return '<p><br></p>';
      }
      visibleParagraphIndex += 1;
      const item = resolveSentenceForParagraph(visibleParagraphIndex, sentences) || sentences[visibleParagraphIndex - 1];
      if (!item) {
        return `<p>${escapeHtml(paragraph.raw)}</p>`;
      }
      const classes = getProbabilityChipClasses(item.probability, item.type);
      const sentenceId = buildSentenceParagraphLinkId(item, visibleParagraphIndex);
      const blockId = String(item?.id || '');
      const blockAttribute = blockId && blockId !== sentenceId ? ` data-sentence-block-id="${escapeHtml(blockId)}"` : '';
      return `<p><span class="highlight-chip ${classes}" data-sentence-id="${escapeHtml(sentenceId)}"${blockAttribute}>${escapeHtml(paragraph.raw)}</span></p>`;
    })
    .join('');
};

const countPlainTextParagraphs = (text = '') =>
  String(text)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.trim())
    .length;

const buildPlainTextFromSentences = (sentences = []) =>
  sentences
    .map((sentence) => String(sentence?.raw ?? sentence?.text ?? '').replace(/\r\n/g, '\n').trim())
    .filter(Boolean)
    .join('\n');

const pickMostSegmentedText = (...candidates) =>
  candidates.reduce((best, candidate) => {
    const next = String(candidate || '');
    return countPlainTextParagraphs(next) > countPlainTextParagraphs(best) ? next : best;
  }, '');

const getMaxSentenceParagraphIndex = (sentences = []) =>
  sentences.reduce((maxParagraphIndex, sentence, index) => {
    const range = resolveSentenceRange(sentence, index);
    const paragraphCount = Math.max(countPlainTextParagraphs(sentence?.raw ?? sentence?.text ?? ''), 1);
    return Math.max(maxParagraphIndex, range.end, range.start + paragraphCount - 1);
  }, 0);

const createStructuredHighlightWrapper = (doc, sentenceId, classes, blockId = '') => {
  const wrapper = doc.createElement('span');
  wrapper.classList.add('highlight-chip', 'highlight-chip--structured');
  classes
    .split(/\s+/)
    .filter(Boolean)
    .forEach((className) => wrapper.classList.add(className));
  wrapper.setAttribute('data-sentence-id', sentenceId);
  if (blockId && blockId !== sentenceId) {
    wrapper.setAttribute('data-sentence-block-id', blockId);
  }
  return wrapper;
};

const applyStructuredHighlight = (block, sentence, index) => {
  const doc = block?.ownerDocument;
  if (!doc || !block) return;

  const paragraphIndex = index + 1;
  const blockId = String(sentence?.id || `block-${paragraphIndex}`);
  const sentenceId = buildSentenceParagraphLinkId(sentence, paragraphIndex);
  const classes = getProbabilityChipClasses(clampProbability(sentence?.probability), sentence?.type);
  const childNodes = Array.from(block.childNodes || []);
  let currentWrapper = null;
  let hasWrappedContent = false;

  childNodes.forEach((child) => {
    if (isElementNode(child)) {
      const tagName = child.tagName?.toUpperCase?.() || '';
      if (isStructuralTagName(tagName)) {
        currentWrapper = null;
        return;
      }
    }

    if (!currentWrapper) {
      currentWrapper = createStructuredHighlightWrapper(doc, sentenceId, classes, blockId);
      block.insertBefore(currentWrapper, child);
    }
    currentWrapper.appendChild(child);
    hasWrappedContent = true;
  });

  if (!hasWrappedContent) {
    const fallbackWrapper = createStructuredHighlightWrapper(doc, sentenceId, classes, blockId);
    while (block.firstChild) {
      fallbackWrapper.appendChild(block.firstChild);
    }
    block.appendChild(fallbackWrapper);
  }
};

export const buildHighlightedPreviewHtml = ({
  editorHtml = '',
  fallbackText = '',
  sentences = [],
  fallbackHighlightedHtml = '',
} = {}) => {
  const normalizedSentences = Array.isArray(sentences) ? sentences : [];

  if (!editorHtml) {
    return sanitizeHtmlForEditor(fallbackHighlightedHtml || buildPlainHighlightedHtml(fallbackText, normalizedSentences), fallbackText);
  }

  const doc = createDocumentFromHtml(editorHtml);
  if (!doc) {
    return sanitizeHtmlForEditor(fallbackHighlightedHtml || buildPlainHighlightedHtml(fallbackText, normalizedSentences), fallbackText);
  }

  const blocks = collectRenderableBlocks(doc.body);
  if (!blocks.length) {
    return sanitizeHtmlForEditor(
      fallbackHighlightedHtml || buildPlainHighlightedHtml(fallbackText || extractTextFromHtml(editorHtml), normalizedSentences),
      fallbackText
    );
  }

  const maxSentenceParagraphIndex = getMaxSentenceParagraphIndex(normalizedSentences);
  let plainHighlightText = pickMostSegmentedText(fallbackText, buildPlainTextFromSentences(normalizedSentences));
  if (countPlainTextParagraphs(plainHighlightText) < maxSentenceParagraphIndex) {
    plainHighlightText = pickMostSegmentedText(plainHighlightText, extractTextFromHtml(editorHtml));
  }
  const expectedParagraphCount = Math.max(countPlainTextParagraphs(plainHighlightText), maxSentenceParagraphIndex);
  if (expectedParagraphCount > blocks.length) {
    return sanitizeHtmlForEditor(buildPlainHighlightedHtml(plainHighlightText, normalizedSentences), plainHighlightText);
  }

  blocks.forEach((block, index) => {
    const sentence = resolveSentenceForParagraph(index + 1, normalizedSentences);
    if (!sentence) {
      return;
    }
    applyStructuredHighlight(block, sentence, index);
  });

  return sanitizeHtmlForEditor(doc.body.innerHTML || fallbackHighlightedHtml || buildPlainHighlightedHtml(fallbackText, normalizedSentences), fallbackText);
};
