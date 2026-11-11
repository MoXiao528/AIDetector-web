import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n, useI18n } from '../../i18n';
import detectionExamples from '../../data/detectionExamples.json';
import { getFallbackHeroExamples } from '../../utils/usageExamples';
import UsageExamplesModal from './UsageExamplesModal.vue';

beforeEach(() => vi.stubEnv('VITE_EVIDENCE_ENABLED', 'true'));
afterEach(() => vi.unstubAllEnvs());

const findButton = (text: string, root: ParentNode = document) => {
  const button = Array.from(root.querySelectorAll('button')).find((item) => item.textContent?.trim() === text);
  expect(button).toBeDefined();
  return button!;
};

const openReport = async (examples = detectionExamples) => {
  const tryOwn = vi.fn();
  const Host = defineComponent({
    setup() {
      useI18n().setLocale('zh-CN');
      const open = ref(false);
      const ownInput = ref<HTMLTextAreaElement | null>(null);
      return () => h('div', [
        h('button', { onClick: () => { open.value = true; } }, '查看示例'),
        h('textarea', { ref: ownInput, value: '用户的未保存草稿' }),
        h(UsageExamplesModal, {
          open: open.value,
          examples,
          onClose: () => { open.value = false; },
          onTryOwn: () => {
            tryOwn(document.querySelector('[role="dialog"]'));
            ownInput.value?.focus();
          },
        }),
      ]);
    },
  });
  const wrapper = mount(Host, { attachTo: document.body, global: { plugins: [createI18n()] } });
  const trigger = wrapper.get('button');
  (trigger.element as HTMLButtonElement).focus();
  await trigger.trigger('click');
  await flushPromises();
  await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')?.contains(document.activeElement)).toBe(true));
  return { wrapper, trigger, tryOwn };
};

describe('UsageExamplesModal', () => {
  it('示例报告metadata只作上下文，原文无高亮且段落详情不显示占位概率', async () => {
    const examples = structuredClone(detectionExamples);
    Object.assign(examples[0].analysis.sentences[0], { type: 'metadata', probability: 0, score: 0 });
    const { wrapper } = await openReport(examples);
    try {
      const first = examples[0].analysis.sentences[0];
      const original = document.querySelector('[data-testid="example-original"]')!;
      expect(original.querySelector(`[data-sentence-id="${first.id}"]`)).toBeNull();
      expect(original.textContent).toContain(first.raw);
      findButton('段落详情').click();
      await flushPromises();
      const firstDetail = document.querySelector('[data-testid="example-paragraphs"] article')!;
      expect(firstDetail.textContent).toContain('元信息 · 仅作上下文');
      expect(firstDetail.textContent).not.toContain('AI 概率');
      expect(document.querySelector('[data-testid="example-ai-score"]')?.textContent).toBe(`${examples[0].analysis.summary.ai}%`);
    } finally {
      wrapper.unmount();
      await flushPromises();
    }
  });

  it('固定报告始终对应首页送检示例和完整检测段落', () => {
    expect(detectionExamples.map((report) => report.key)).toEqual(['chatgpt', 'human']);
    for (const locale of ['zh-CN', 'en-US']) {
      const heroExamples = getFallbackHeroExamples(locale);
      for (const report of detectionExamples) {
        expect(report.text).toBe(heroExamples.find((example) => example.key === report.key)?.content);
        expect(report.analysis.sentences.map((paragraph) => paragraph.raw).join('\n\n')).toBe(report.text);
      }
    }
  });

  it('双换行只呈现真实段落，保留原文、高亮和实际模型分数且不发起检测', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const savedDraft = JSON.stringify({ inputText: '用户的未保存草稿' });
    localStorage.setItem('ai-detector-scan-draft', savedDraft);
    const { wrapper } = await openReport();
    try {
      const aiReport = detectionExamples[0];
      const aiOriginal = document.querySelector('[data-testid="example-original"]')!;
      expect(Array.from(aiOriginal.querySelectorAll('p')).map((paragraph) => paragraph.textContent)).toEqual(aiReport.text.split('\n\n'));
      expect(Array.from(aiOriginal.querySelectorAll('.highlight-chip')).map((highlight) => highlight.getAttribute('data-sentence-id'))).toEqual(aiReport.analysis.sentences.map((paragraph) => paragraph.id));
      expect(document.querySelector('[data-testid="example-ai-score"]')?.textContent).toBe(`${aiReport.analysis.summary.ai}%`);
      expect(document.querySelector('[role="dialog"]')?.textContent).toContain('AI 特征演示文本');

      findButton('人工写作').click();
      await flushPromises();
      const humanReport = detectionExamples[1];
      const humanOriginal = document.querySelector('[data-testid="example-original"]')!;
      expect(Array.from(humanOriginal.querySelectorAll('p')).map((paragraph) => paragraph.textContent)).toEqual(humanReport.text.split('\n\n'));
      const highlights = humanOriginal.querySelectorAll('.highlight-chip');
      expect(highlights).toHaveLength(3);
      expect(Array.from(highlights).map((highlight) => highlight.textContent)).toEqual(humanReport.analysis.sentences.map((paragraph) => paragraph.raw));
      expect(Array.from(highlights).every((highlight) => highlight.classList.contains('bg-emerald-100'))).toBe(true);
      expect(document.querySelector('[data-testid="example-ai-score"]')?.textContent).toBe('0%');
      expect(document.querySelector('[role="dialog"]')?.textContent).toContain('鲁迅《故乡》节选');
      expect(document.querySelector('[data-testid="example-source-note"]')).toBeNull();

      findButton('段落详情').click();
      await flushPromises();
      const details = document.querySelector('[data-testid="example-paragraphs"]')!;
      expect(Array.from(details.querySelectorAll('article p')).map((paragraph) => paragraph.textContent)).toEqual(humanReport.analysis.sentences.map((paragraph) => paragraph.raw));
      for (const paragraph of humanReport.analysis.sentences) {
        expect(details.textContent).toContain(`AI 概率 ${Math.round(paragraph.probability * 100)}%`);
      }
      expect(wrapper.get('textarea').element.value).toBe('用户的未保存草稿');
      expect(localStorage.getItem('ai-detector-scan-draft')).toBe(savedDraft);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      wrapper.unmount();
      await flushPromises();
    }
  });

  it('无可展示差异时可查看全部和维度详情，切换示例恢复默认视图', async () => {
    const examples = structuredClone(detectionExamples);
    examples[1].evidence.signals.forEach((signal) => { signal.relation = null; });
    const { wrapper } = await openReport(examples);
    try {
      await vi.waitFor(() => expect(document.querySelector('[data-testid="evidence-panel"]')).not.toBeNull());
      findButton('人工写作').click();
      await flushPromises();
      expect(document.querySelector('[data-testid="evidence-empty-selection"]')?.textContent).toContain('未提供清晰的区间差异');
      (document.querySelector('[data-testid="evidence-show-all"]') as HTMLButtonElement).click();
      await flushPromises();
      (document.querySelector('[data-testid="evidence-summary"][data-dimension="rhythm"]') as HTMLButtonElement).click();
      await flushPromises();

      const details = document.querySelector('[data-testid="example-evidence-details"]')!;
      expect(details.querySelector('details[data-testid="evidence-professional"]')?.hasAttribute('open')).toBe(false);
      expect(details.querySelector('[data-testid="evidence-show-all"]')?.getAttribute('aria-pressed')).toBe('true');
      expect(details.querySelector('[data-testid="evidence-dimension"][data-dimension="rhythm"]')?.getAttribute('aria-pressed')).toBe('true');
      expect(details.querySelectorAll('[data-metric]')).toHaveLength(22);
      expect(details.querySelector('[data-metric="mattr"] [data-value="observed"]')?.textContent).toBe(
        new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 4 }).format(detectionExamples[1].evidence.signals.find((signal) => signal.metric === 'mattr')!.observed!)
      );

      (details.querySelector('[data-testid="evidence-show-recommended"]') as HTMLButtonElement).click();
      await flushPromises();
      const compact = Array.from(document.querySelectorAll('[data-testid="evidence-panel"]')).find((panel) => !details.contains(panel))!;
      expect(compact.querySelector('[data-testid="evidence-show-all"]')?.getAttribute('aria-pressed')).toBe('false');
      expect(compact.querySelectorAll('[data-testid="evidence-summary"]')).toHaveLength(0);
      expect(details.querySelectorAll('[data-testid="evidence-dimension"]')).toHaveLength(0);
      (details.querySelector('[data-testid="evidence-show-all"]') as HTMLButtonElement).click();
      await flushPromises();
      expect(compact.querySelector('[data-testid="evidence-show-all"]')?.getAttribute('aria-pressed')).toBe('true');
      expect(compact.querySelectorAll('[data-testid="evidence-summary"]')).toHaveLength(4);

      findButton('AI 文本').click();
      await flushPromises();
      expect(document.querySelector('[data-testid="example-evidence-details"]')).toBeNull();
      expect(document.querySelector('[data-testid="example-original"]')).not.toBeNull();
      expect(document.querySelector('[data-testid="evidence-empty-selection"]')).toBeNull();
      expect(document.querySelectorAll('[data-testid="evidence-summary"]').length).toBeGreaterThan(0);
      expect(document.querySelector('[data-testid="evidence-show-all"]')?.getAttribute('aria-pressed')).toBe('false');
    } finally {
      wrapper.unmount();
      await flushPromises();
    }
  });

  it('已知人工来源与模型标签不一致时仍显示提示', async () => {
    const examples = structuredClone(detectionExamples);
    examples[1].label = 'ai';
    const { wrapper } = await openReport(examples);
    try {
      findButton('人工写作').click();
      await flushPromises();
      expect(document.querySelector('[data-testid="example-source-note"]')?.textContent).toContain('模型判断与已知来源不一致');
    } finally {
      wrapper.unmount();
      await flushPromises();
    }
  });

  it('Escape 关闭并回焦，检测自己的文本在退出弹窗后才交还焦点', async () => {
    const { wrapper, trigger, tryOwn } = await openReport();
    try {
      await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')?.contains(document.activeElement)).toBe(true));
      document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
      await vi.waitFor(() => expect(document.activeElement).toBe(trigger.element));
      expect(tryOwn).not.toHaveBeenCalled();

      await trigger.trigger('click');
      await flushPromises();
      findButton('检测自己的文本').click();
      expect(tryOwn).not.toHaveBeenCalled();
      await vi.waitFor(() => expect(tryOwn).toHaveBeenCalledExactlyOnceWith(null));
      expect(document.querySelector('[role="dialog"]')).toBeNull();
      expect(document.activeElement).toBe(wrapper.get('textarea').element);
      expect(wrapper.get('textarea').element.value).toBe('用户的未保存草稿');
    } finally {
      wrapper.unmount();
      await flushPromises();
    }
  });
});
