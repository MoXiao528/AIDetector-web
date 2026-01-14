import { globalT } from '../i18n';

const TEXT_LIKE_EXTENSIONS = [
  'txt',
  'md',
  'markdown',
  'json',
  'csv',
  'yml',
  'yaml',
  'xml',
  'html',
  'htm',
  'log',
  'tex',
  'tax',
];

const DOCX_EXTENSIONS = ['docx', 'doc'];

const PDF_EXTENSIONS = ['pdf'];

const decoder = new TextDecoder();

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

const extractDocxText = async (file) => {
  const { convertToHtml } = await import('mammoth');
  const buffer = await readAsArrayBuffer(file);

  try {
    const result = await convertToHtml({ arrayBuffer: buffer });
    const html = result.value || '';
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
  } catch (error) {
    console.error('Failed to parse DOCX', error);
    throw new Error(globalT('errors.unsupportedDocx'));
  }
};

const extractPdfText = async (file) => {
  const buffer = await readAsArrayBuffer(file);
  const pdfjsLib = await import('pdfjs-dist/build/pdf');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  if (pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = worker.default;
  }
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pageNumbers = Array.from({ length: pdf.numPages }, (_, index) => index + 1);
  const pageTexts = await Promise.all(
    pageNumbers.map(async (pageNumber) => {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      return content.items.map((item) => item.str).join(' ');
    })
  );
  return pageTexts.join('\n').trim();
};

const extractUnknownText = async (file) => {
  const buffer = await readAsArrayBuffer(file);
  return decoder.decode(buffer);
};

export const readTextFromFile = async (file) => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (!extension) {
    throw new Error(globalT('errors.unknownFormat'));
  }

  if (TEXT_LIKE_EXTENSIONS.includes(extension)) {
    return readAsText(file);
  }

  if (DOCX_EXTENSIONS.includes(extension)) {
    return extractDocxText(file);
  }

  if (PDF_EXTENSIONS.includes(extension)) {
    return extractPdfText(file);
  }

  return extractUnknownText(file);
};
