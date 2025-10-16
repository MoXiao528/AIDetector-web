import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { readTextFromFile } from '../utils/fileReaders';

const examples = [
  {
    key: 'chatgpt',
    label: 'ChatGPT',
    content:
      'Artificial intelligence systems have rapidly accelerated the pace of information creation, challenging educators to distinguish authentic student work from generated text.',
  },
  {
    key: 'human',
    label: 'Human',
    content:
      'When I interviewed each student, I paid attention to their pauses, their personal anecdotes, and the way they connected class discussions to their own experiences.',
  },
  {
    key: 'hybrid',
    label: 'AI + Human',
    content:
      'The initial outline was produced by an AI assistant, but I rewrote each paragraph to weave in citations from recent journals and to adjust the tone to match our faculty guidelines.',
  },
  {
    key: 'polished',
    label: 'Polished by AI',
    content:
      'After running the report, the assistant suggested consolidating redundant sentences and elevating the academic voice; the revised excerpt now reads with greater clarity and cohesion.',
  },
];

export const useScanStore = defineStore('scan', () => {
  const inputText = ref(examples[0].content);
  const selectedExampleKey = ref(examples[0].key);
  const isUploading = ref(false);
  const uploadError = ref('');
  const lastUploadedFileName = ref('');

  const characterCount = computed(() => inputText.value.length);

  const setText = (value) => {
    inputText.value = value;
    selectedExampleKey.value = '';
  };

  const applyExample = (key) => {
    const matched = examples.find((item) => item.key === key);
    if (!matched) return;
    inputText.value = matched.content;
    selectedExampleKey.value = matched.key;
  };

  const readFile = async (file) => {
    if (!file) return;
    isUploading.value = true;
    uploadError.value = '';
    try {
      const content = await readTextFromFile(file);
      inputText.value = content;
      selectedExampleKey.value = '';
      lastUploadedFileName.value = file.name;
    } catch (error) {
      uploadError.value = error.message || '文件解析失败，请稍后重试。';
      throw error;
    } finally {
      isUploading.value = false;
    }
  };

  const resetError = () => {
    uploadError.value = '';
  };

  return {
    examples,
    inputText,
    selectedExampleKey,
    isUploading,
    uploadError,
    lastUploadedFileName,
    characterCount,
    setText,
    applyExample,
    readFile,
    resetError,
  };
});
