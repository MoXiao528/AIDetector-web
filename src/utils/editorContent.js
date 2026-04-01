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

const collectRenderableBlocks = (root) => {
  if (!root) return [];

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
      const classes = getProbabilityChipClasses(item.probability);
      return `<p><span class="highlight-chip ${classes}" data-sentence-id="${item.id}">${escapeHtml(paragraph.raw)}</span></p>`;
    })
    .join('');
};

const createStructuredHighlightWrapper = (doc, sentenceId, classes) => {
  const wrapper = doc.createElement('span');
  wrapper.classList.add('highlight-chip', 'highlight-chip--structured');
  classes
    .split(/\s+/)
    .filter(Boolean)
    .forEach((className) => wrapper.classList.add(className));
  wrapper.setAttribute('data-sentence-id', sentenceId);
  return wrapper;
};

const applyStructuredHighlight = (block, sentence, index) => {
  const doc = block?.ownerDocument;
  if (!doc || !block) return;

  const sentenceId = sentence?.id || `block-${index + 1}`;
  const classes = getProbabilityChipClasses(clampProbability(sentence?.probability));
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
      currentWrapper = createStructuredHighlightWrapper(doc, sentenceId, classes);
      block.insertBefore(currentWrapper, child);
    }
    currentWrapper.appendChild(child);
    hasWrappedContent = true;
  });

  if (!hasWrappedContent) {
    const fallbackWrapper = createStructuredHighlightWrapper(doc, sentenceId, classes);
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
    return fallbackHighlightedHtml || buildPlainHighlightedHtml(fallbackText, normalizedSentences);
  }

  const doc = createDocumentFromHtml(editorHtml);
  if (!doc) {
    return fallbackHighlightedHtml || buildPlainHighlightedHtml(fallbackText, normalizedSentences);
  }

  const blocks = collectRenderableBlocks(doc.body);
  if (!blocks.length) {
    return fallbackHighlightedHtml || buildPlainHighlightedHtml(fallbackText || extractTextFromHtml(editorHtml), normalizedSentences);
  }

  blocks.forEach((block, index) => {
    const sentence = resolveSentenceForParagraph(index + 1, normalizedSentences);
    if (!sentence) {
      return;
    }
    applyStructuredHighlight(block, sentence, index);
  });

  return doc.body.innerHTML || fallbackHighlightedHtml || buildPlainHighlightedHtml(fallbackText, normalizedSentences);
};
