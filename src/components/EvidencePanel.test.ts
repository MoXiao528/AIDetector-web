import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, nextTick, type PropType } from 'vue';
import { enableAutoUnmount, mount } from '@vue/test-utils';
import EvidencePanel from './EvidencePanel.vue';
import type { EvidenceReason, EvidenceResult, EvidenceSignal } from '../api/modules/scan';
import { createI18n, useI18n } from '../i18n';

enableAutoUnmount(afterEach);

// Independent contract fixture: all 22 public metrics in backend order.
const metrics = {
  lexical: ['mattr', 'token_entropy', 'entropy_per_log_vocab', 'hapax_type_ratio', 'top_token_concentration'],
  phrase_template: ['repeat_ngram_coverage', 'sentence_start_repeat'],
  rhythm: ['sentence_length_median', 'sentence_length_iqr', 'sentence_length_cv', 'sentence_adjacent_change_median',
    'paragraph_length_median', 'paragraph_length_iqr', 'paragraph_length_cv', 'punctuation_per_1k', 'punctuation_entropy'],
  discourse: ['transition_per_1k', 'transition_diversity', 'paragraph_adjacent_jaccard',
    'paragraph_nonadjacent_jaccard_q90', 'intro_conclusion_jaccard', 'section_heading_count'],
} satisfies Record<EvidenceSignal['dimension'], string[]>;

const makeEvidence = (status: EvidenceResult['status'] = 'ready'): EvidenceResult => {
  if (status === 'failed' || status === 'unsupported') {
    return {
      status, artifactVersion: null, featureSchemaVersion: 1, route: null,
      quality: { level: 'unavailable', coverage: 0, reasons: [status === 'failed' ? 'timeout' : 'unsupported_language'] },
      signals: [], patterns: null,
    };
  }
  const signals: EvidenceSignal[] = Object.entries(metrics).flatMap(([dimension, names]) => names.map((metric) => {
    const comparable = status === 'ready' || (status === 'partial' && ![
      'paragraph_adjacent_jaccard', 'paragraph_nonadjacent_jaccard_q90', 'intro_conclusion_jaccard',
    ].includes(metric));
    return {
      dimension: dimension as EvidenceSignal['dimension'], metric, observed: 0,
      humanPercentile: comparable ? 50 : null, aiPercentile: comparable ? 0 : null,
      referenceRanges: comparable ? { human: [0, 0], ai: [0.5, 1] } : null,
      referenceExtent: comparable ? [0, 1] : undefined,
      relation: comparable ? { human: 'within', ai: 'below' } : null,
      notice: null, sampleCount: comparable ? 10 : 0, offsets: [],
      reasons: comparable ? [] : ['no_valid_source_groups'],
    };
  }));
  return {
    status, artifactVersion: '1'.repeat(64), featureSchemaVersion: 1,
    route: {
      language: 'en', domain: 'academic', confidence: { language: 0, domain: 0 },
      lengthBucket: 'short', fallbackLevel: 'exact',
    },
    quality: {
      level: status, coverage: (status === 'ready' ? 22 : status === 'partial' ? 19 : 0) / 22,
      reasons: status === 'ready' ? [] : ['reference_metrics_unavailable'],
    },
    signals,
    patterns: { descriptive_top_tokens: [], repeated_phrases: [], sentence_start_templates: [] },
  };
};

// Exercise the existing i18n provider, including live locale changes.
const Harness = defineComponent({
  components: { EvidencePanel },
  props: {
    evidence: { type: Object as PropType<EvidenceResult | null>, default: undefined },
    detailed: { type: Boolean, default: true },
    submittedText: { type: String, default: '' },
    initialDimension: { type: String as PropType<EvidenceSignal['dimension']>, default: 'lexical' },
    initialShowAll: { type: Boolean, default: false },
  },
  setup() {
    const { setLocale } = useI18n();
    setLocale('zh-CN');
    return { setLocale };
  },
  template: '<EvidencePanel :evidence="evidence" :detailed="detailed" :submitted-text="submittedText" :initial-dimension="initialDimension" :initial-show-all="initialShowAll" />',
});
const mountPanel = (
  evidence: EvidenceResult | null | undefined = makeEvidence(),
  props: { detailed?: boolean; submittedText?: string; initialDimension?: EvidenceSignal['dimension']; initialShowAll?: boolean } = {},
) => mount(Harness, { props: { evidence, ...props }, global: { plugins: [createI18n()] } });

describe('EvidencePanel', () => {
  it('概要只显示四项可读结论，点击维度或查看依据发出详情导航事件', async () => {
    const wrapper = mountPanel(makeEvidence('partial'), { detailed: false });
    const panel = wrapper.getComponent(EvidencePanel);
    expect(wrapper.get('h3').text()).toBe('写作特点');
    expect(wrapper.findAll('[data-testid="evidence-summary"]')).toHaveLength(4);
    expect(wrapper.find('[data-metric], [data-testid="evidence-professional"], [data-value="coverage"]').exists()).toBe(false);
    expect(wrapper.text()).not.toMatch(/MATTR|86\.4%|诊断分数|Q05|百分位|Human/);
    for (const dimension of Object.keys(metrics)) {
      await wrapper.get(`button[data-dimension="${dimension}"]`).trigger('click');
      expect(panel.emitted('view-details')?.slice(-1)[0]).toEqual([dimension, false]);
    }
    const detailsButton = wrapper.findAll('button').find((button) => button.text() === '查看依据');
    expect(detailsButton).toBeDefined();
    await detailsButton!.trigger('click');
    expect(panel.emitted('view-details')).toHaveLength(5);
    expect(panel.emitted('view-details')?.slice(-1)[0]).toEqual(['lexical', false]);
    wrapper.vm.setLocale('en-US');
    await nextTick();
    expect(wrapper.get('h3').text()).toBe('Writing characteristics');
    expect(wrapper.text()).not.toMatch(/scan\.evidence\.|[\u4e00-\u9fff]/);
  });

  it('详情按维度切换解释，原文摘录使用码点偏移且作为文本安全展示', async () => {
    const markup = '<img src=x onerror=alert(1)>';
    const submittedText = `😀${markup} 重复片段重复片段`;
    const phraseStart = Array.from(`😀${markup} `).length;
    const evidence = makeEvidence();
    evidence.patterns = {
      descriptive_top_tokens: [],
      repeated_phrases: [{ count: 2, offsets: [{ start: phraseStart, end: phraseStart + 4 }] }],
      sentence_start_templates: [{ count: 2, offsets: [{ start: 1, end: 1 + Array.from(markup).length }] }],
    };
    const wrapper = mountPanel(evidence, { submittedText });
    expect(wrapper.findAll('[data-testid="evidence-dimension"]')).toHaveLength(4);
    expect(wrapper.get('[data-dimension="lexical"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.find('[data-testid="evidence-examples"]').exists()).toBe(false);
    for (const dimension of Object.keys(metrics) as EvidenceSignal['dimension'][]) {
      await wrapper.get(`[data-testid="evidence-dimension"][data-dimension="${dimension}"]`).trigger('click');
      expect(wrapper.get(`[data-dimension="${dimension}"]`).attributes('aria-pressed')).toBe('true');
      expect(wrapper.findAll('[data-testid="evidence-dimension"][aria-pressed="true"]')).toHaveLength(1);
      const explanations = wrapper.findAll('[data-testid="evidence-explanation"]');
      expect(explanations.length).toBeGreaterThan(0);
      for (const row of explanations) {
        expect(metrics[dimension]).toContain(row.attributes('data-summary-metric'));
      }
      if (dimension === 'phrase_template') {
        expect(wrapper.text()).toContain('重复片段');
        expect(wrapper.text()).toContain(markup);
        expect(wrapper.find('img, script').exists()).toBe(false);
      }
    }
    await wrapper.setProps({ initialDimension: 'rhythm' });
    expect(wrapper.get('[data-dimension="rhythm"]').attributes('aria-pressed')).toBe('true');
  });

  it('词汇多样性默认展示含义和解读边界，同时保留 MATTR 数值、百分位及专业数据', async () => {
    const evidence = makeEvidence();
    Object.assign(evidence.signals[0], {
      observed: 0.73231, humanPercentile: 42.5,
      referenceRanges: { human: [0.6, 0.8], ai: [0.7, 0.9] },
    });
    const original = JSON.stringify(evidence);
    const wrapper = mountPanel(evidence);
    const card = wrapper.get('[data-summary-metric="mattr"]');
    expect(wrapper.get('[data-dimension="lexical"]').text()).toBe('词汇多样性');
    expect(card.get('h4').text()).toBe('词汇多样性');
    expect(card.text()).toContain('词汇多样性指数（MATTR）');
    expect(card.text()).toContain('0.7323');
    expect(card.get('[data-range-label="human"]').text()).toBe('0.6 – 0.8');
    expect(card.find('[data-testid="reference-values"]').exists()).toBe(true);
    expect(card.find('[data-testid="metric-definition"]').exists()).toBe(false);
    const method = card.get('details[data-testid="range-method"]');
    expect(method.attributes('open')).toBeUndefined();
    expect(method.get('summary').text()).toBe('范围如何得出');
    expect(method.text()).toContain('中间约 90%');
    expect(method.text()).toContain('10 组有效配对来源');
    expect(card.get('[data-testid="lexical-definition"]').isVisible()).toBe(true);
    const context = card.get('[data-testid="lexical-context"]');
    expect(context.isVisible()).toBe(true);
    for (const term of ['主题词', '称谓', '术语', '重复很正常', '不能单独判断是否由 AI 生成']) expect(context.text()).toContain(term);
    expect(wrapper.get('[data-metric="mattr"] [data-value="observed"]').text()).toBe('0.7323');
    expect(wrapper.get('[data-metric="mattr"] [data-value="human-percentile"]').text()).toBe('42.5');
    expect(JSON.stringify(evidence)).toBe(original);
    wrapper.vm.setLocale('en-US');
    await nextTick();
    expect(wrapper.get('[data-dimension="lexical"]').text()).toBe('Lexical diversity');
    expect(card.get('h4').text()).toBe('Lexical diversity');
    expect(card.text()).toContain('MATTR');
    expect(card.text()).not.toMatch(/scan\.evidence\.|[\u4e00-\u9fff]/);
  });

  it('所有语言均移除词汇列表，重复词组和句首示例仍保留原次数和安全边界', async () => {
    const evidence = makeEvidence();
    evidence.route!.language = 'zh';
    const oneCharacter = [{ count: 2, offsets: [{ start: 0, end: 1 }] }];
    evidence.patterns = {
      descriptive_top_tokens: [...oneCharacter, { count: 3, offsets: [{ start: 0, end: 2 }] }],
      repeated_phrases: oneCharacter,
      sentence_start_templates: oneCharacter,
    };
    const wrapper = mountPanel(evidence, { submittedText: '甲乙' });
    expect(wrapper.find('[data-testid="evidence-examples"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="evidence-explanation"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="evidence-professional"]').exists()).toBe(true);
    await wrapper.setProps({ evidence: { ...evidence, route: { ...evidence.route!, language: 'en' } } });
    expect(wrapper.find('[data-testid="evidence-examples"]').exists()).toBe(false);
    await wrapper.get('[data-dimension="phrase_template"]').trigger('click');
    const groups = wrapper.findAll('[data-testid="evidence-examples"]');
    expect(groups).toHaveLength(2);
    for (const group of groups) {
      expect(group.get('li').text()).toBe('甲出现 2 次');
      expect(group.text()).toContain('仅展示部分匹配示例，摘自本次送检原文。');
    }
  });

  it('词组维度只展示当前可推荐指标的示例，查看全部后恢复隐藏指标示例', async () => {
    const evidence = makeEvidence();
    evidence.signals.find((signal) => signal.metric === 'sentence_start_repeat')!.referenceRanges = { human: [0, 1], ai: [0, 1] };
    evidence.patterns = {
      descriptive_top_tokens: [],
      repeated_phrases: [{ count: 2, offsets: [{ start: 0, end: 5 }] }],
      sentence_start_templates: [{ count: 3, offsets: [{ start: 6, end: 10 }] }],
    };
    const wrapper = mountPanel(evidence, { submittedText: 'Alpha Beta', initialDimension: 'phrase_template' });
    expect(wrapper.findAll('[data-summary-metric]')).toHaveLength(1);
    expect(wrapper.findAll('[data-testid="evidence-examples"]')).toHaveLength(1);
    expect(wrapper.get('[data-testid="evidence-examples"]').text()).toContain('Alpha');
    expect(wrapper.text()).not.toContain('Beta');

    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    expect(wrapper.findAll('[data-testid="evidence-examples"]')).toHaveLength(2);
    expect(wrapper.text()).toContain('Beta');
  });

  it('词汇多样性三种参考关系使用局部变化文案，不重新解释 AI 参考方向', async () => {
    const evidence = makeEvidence();
    const wrapper = mountPanel(evidence);
    const messages = { below: '局部用词变化较少', within: '用词变化处于参考样本的常见范围', above: '局部用词变化较多' } as const;
    for (const relation of ['below', 'within', 'above'] as const) {
      await wrapper.setProps({ evidence: {
        ...evidence,
        signals: evidence.signals.map((signal) => signal.metric === 'mattr'
          ? { ...signal, relation: { human: relation, ai: 'below' as const } } : signal),
      } });
      if (relation !== 'within') {
        await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
        await wrapper.get('[data-dimension="lexical"]').trigger('click');
      }
      expect(wrapper.get('[data-summary-metric="mattr"]').text()).toContain(messages[relation]);
    }
  });

  it('专业数据保留四维全部 22 项，默认折叠且保持后端分组顺序', () => {
    const evidence = makeEvidence();
    const original = JSON.stringify(evidence);
    const wrapper = mountPanel(evidence);
    const professional = wrapper.get('details[data-testid="evidence-professional"]');
    expect(professional.attributes('open')).toBeUndefined();
    expect(wrapper.findAll('[data-metric]')).toHaveLength(22);
    expect(professional.findAll('thead th')).toHaveLength(4);
    expect(wrapper.find('[data-value="sample-count"]').exists()).toBe(false);
    for (const definition of wrapper.findAll('[data-testid="metric-definition"]')) expect(definition.attributes('open')).toBeUndefined();
    expect(professional.findAll('[data-metric]').map((row) => row.attributes('data-metric')))
      .toEqual(Object.values(metrics).flat());
    expect(wrapper.text()).not.toMatch(/scan\.evidence\.|undefined|NaN|Mixed|generator|reference_mismatch|outside_both/);
    expect(JSON.stringify(evidence)).toBe(original);
  });

  it('默认同时过滤高重叠和不可比较项，查看全部可恢复并标注，不改写响应', async () => {
    const evidence = makeEvidence();
    Object.assign(evidence.signals[0], { referenceRanges: { human: [0, 1], ai: [0.2, 1.2] } });
    evidence.signals[1].relation = null;
    evidence.signals[2].observed = null;
    evidence.signals[3].referenceRanges = null;
    const original = JSON.stringify(evidence);
    const wrapper = mountPanel(evidence);
    expect(wrapper.findAll('[data-metric]')).toHaveLength(18);
    for (const metric of metrics.lexical.slice(0, 4)) expect(wrapper.find(`[data-metric="${metric}"]`).exists()).toBe(false);
    expect(wrapper.find('[data-dimension="lexical"]').exists()).toBe(false);
    expect(wrapper.get('[data-dimension="phrase_template"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.get('[data-testid="evidence-show-all"]').text()).toContain('4 项');
    expect(wrapper.get('[data-value="coverage"]').text()).toBe('100%');
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    expect(wrapper.get('[data-testid="evidence-show-all"]').attributes('aria-pressed')).toBe('true');
    expect(wrapper.findAll('[data-metric]')).toHaveLength(22);
    expect(wrapper.get('[data-metric="mattr"] [data-testid="high-overlap"]').text()).toContain('参考区间高度重叠');
    expect(wrapper.find('[data-metric="token_entropy"] [data-testid="high-overlap"]').exists()).toBe(false);
    await wrapper.get('[data-dimension="lexical"]').trigger('click');
    expect(wrapper.get('[data-summary-metric="mattr"] [data-testid="high-overlap"]').text()).toContain('本次不建议参考');
    await wrapper.setProps({ detailed: false });
    expect(wrapper.get('[data-testid="evidence-summary"][data-dimension="lexical"]').text()).toContain('参考区间高度重叠');
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    expect(wrapper.find('[data-dimension="lexical"]').exists()).toBe(false);
    expect(wrapper.findAll('[data-testid="evidence-summary"]')).toHaveLength(3);
    expect(JSON.stringify(evidence)).toBe(original);
  });

  it('全部区间高度重叠时提供可恢复空态，不保留空维度', async () => {
    const evidence = makeEvidence();
    for (const signal of evidence.signals) signal.referenceRanges = { human: [0, 1], ai: [0, 1] };
    const original = JSON.stringify(evidence);
    const wrapper = mountPanel(evidence);
    expect(wrapper.get('[data-testid="evidence-empty-selection"]').text()).toBe('本次写作特点未提供清晰的区间差异，暂不能为来源判断提供补充依据。');
    expect(wrapper.find('[data-testid="evidence-dimension"], [data-testid="evidence-explanation"], [data-metric]').exists()).toBe(false);
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    expect(wrapper.find('[data-testid="evidence-empty-selection"]').exists()).toBe(false);
    expect(wrapper.findAll('[data-testid="evidence-dimension"]')).toHaveLength(4);
    expect(wrapper.findAll('[data-metric]')).toHaveLength(22);
    expect(wrapper.findAll('[data-metric] [data-testid="high-overlap"]')).toHaveLength(22);
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    expect(wrapper.find('[data-testid="evidence-empty-selection"]').exists()).toBe(true);
    expect(JSON.stringify(evidence)).toBe(original);
  });

  it('低重叠也只默认展示单侧范围内的项目，双方范围内或双方范围外需查看全部', async () => {
    const evidence = makeEvidence();
    const relations = {
      mattr: { human: 'within', ai: 'within' },
      repeat_ngram_coverage: { human: 'within', ai: 'below' },
      sentence_length_median: { human: 'above', ai: 'within' },
      transition_per_1k: { human: 'above', ai: 'above' },
    } as const;
    evidence.signals = evidence.signals.filter((signal) => signal.metric in relations);
    for (const signal of evidence.signals) {
      signal.referenceRanges = { human: [0.2, 0.6], ai: [0.4, 0.8] };
      signal.relation = relations[signal.metric as keyof typeof relations];
    }
    const original = JSON.stringify(evidence);
    const wrapper = mountPanel(evidence);
    expect(wrapper.findAll('[data-metric]').map((row) => row.attributes('data-metric'))).toEqual(['repeat_ngram_coverage', 'sentence_length_median']);
    expect(wrapper.findAll('[data-testid="evidence-dimension"]').map((button) => button.attributes('data-dimension'))).toEqual(['phrase_template', 'rhythm']);
    expect(wrapper.get('[data-value="coverage"]').text()).toBe('100%');
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    expect(wrapper.findAll('[data-metric]')).toHaveLength(4);
    await wrapper.get('[data-dimension="lexical"]').trigger('click');
    expect(wrapper.get('[data-summary-metric="mattr"] [data-testid="range-comparison-summary"]').attributes('data-comparison-state')).toBe('both');
    await wrapper.get('[data-dimension="discourse"]').trigger('click');
    expect(wrapper.get('[data-summary-metric="transition_per_1k"] [data-testid="range-comparison-summary"]').attributes('data-comparison-state')).toBe('neither');
    expect(wrapper.find('[data-testid="high-overlap"]').exists()).toBe(false);
    expect(JSON.stringify(evidence)).toBe(original);
  });

  it('低重叠但全部没有单侧差异时明确说明不能补充来源判断，全部入口仍可恢复', async () => {
    const evidence = makeEvidence();
    evidence.signals.forEach((signal, index) => {
      signal.referenceRanges = { human: [0.2, 0.6], ai: [0.4, 0.8] };
      signal.relation = index % 2 ? { human: 'above', ai: 'above' } : { human: 'within', ai: 'within' };
    });
    const original = JSON.stringify(evidence);
    const wrapper = mountPanel(evidence, { detailed: false });
    expect(wrapper.find('[data-testid="evidence-summary"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="evidence-empty-selection"]').text()).toBe('本次写作特点未提供清晰的区间差异，暂不能为来源判断提供补充依据。');
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    expect(wrapper.findAll('[data-testid="evidence-summary"]')).toHaveLength(4);
    expect(wrapper.text()).not.toContain('参考区间高度重叠');
    expect(JSON.stringify(evidence)).toBe(original);
  });

  it('新快照重置查看全部和所选维度，初始维度被过滤时选择可用维度', async () => {
    const evidence = makeEvidence();
    evidence.signals[0].referenceRanges = { human: [0, 1], ai: [0, 1] };
    const wrapper = mountPanel(evidence, { initialDimension: 'rhythm' });
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    await wrapper.get('[data-dimension="discourse"]').trigger('click');
    expect(wrapper.get('[data-dimension="discourse"]').attributes('aria-pressed')).toBe('true');
    await wrapper.setProps({ evidence: { ...evidence, signals: [...evidence.signals] } });
    expect(wrapper.get('[data-testid="evidence-show-all"]').attributes('aria-pressed')).toBe('false');
    expect(wrapper.get('[data-dimension="rhythm"]').attributes('aria-pressed')).toBe('true');
    await wrapper.setProps({ initialDimension: 'lexical' });
    expect(wrapper.find('[data-dimension="lexical"]').exists()).toBe(false);
    expect(wrapper.get('[data-dimension="phrase_template"]').attributes('aria-pressed')).toBe('true');
  });

  it('概要展开全部后导航携带展开意图，详情保留选中的隐藏维度直到新快照', async () => {
    const evidence = makeEvidence();
    evidence.signals[0].referenceRanges = { human: [0, 1], ai: [0, 1] };
    const compact = mountPanel(evidence, { detailed: false });
    expect(compact.find('[data-dimension="lexical"]').exists()).toBe(false);
    await compact.get('[data-testid="evidence-show-all"]').trigger('click');
    await compact.get('[data-dimension="lexical"]').trigger('click');
    expect(compact.getComponent(EvidencePanel).emitted('view-details')?.slice(-1)[0]).toEqual(['lexical', true]);
    await compact.findAll('button').find((button) => button.text() === '查看依据')!.trigger('click');
    expect(compact.getComponent(EvidencePanel).emitted('view-details')?.slice(-1)[0]).toEqual(['lexical', true]);
    const detail = mountPanel(evidence, { initialDimension: 'lexical', initialShowAll: true });
    expect(detail.get('[data-testid="evidence-show-all"]').attributes('aria-pressed')).toBe('true');
    expect(detail.get('[data-dimension="lexical"]').attributes('aria-pressed')).toBe('true');
    expect(detail.get('[data-summary-metric="mattr"] [data-testid="high-overlap"]').text()).toContain('参考区间高度重叠');
    await detail.setProps({ initialShowAll: false });
    expect(detail.find('[data-dimension="lexical"]').exists()).toBe(false);
    await detail.setProps({ initialShowAll: true });
    expect(detail.find('[data-dimension="lexical"]').exists()).toBe(true);
    await detail.setProps({ evidence: { ...evidence, signals: [...evidence.signals] } });
    expect(detail.get('[data-testid="evidence-show-all"]').attributes('aria-pressed')).toBe('false');
    expect(detail.find('[data-dimension="lexical"]').exists()).toBe(false);
  });

  it('句长在单轨上按整体参考端点归一化，观察点独立于样本百分位', () => {
    const evidence = makeEvidence();
    Object.assign(evidence.signals.find((signal) => signal.metric === 'sentence_length_median')!, {
      observed: 25, humanPercentile: 3, aiPercentile: 95,
      referenceRanges: { human: [10, 20], ai: [30, 40] },
      referenceExtent: [0, 100],
      relation: { human: 'above', ai: 'below' },
    });
    const original = JSON.stringify(evidence);
    const wrapper = mountPanel(evidence, { initialDimension: 'rhythm', initialShowAll: true });
    const card = wrapper.get('[data-summary-metric="sentence_length_median"]');
    expect(card.get('[data-range-label="human"]').text()).toBe('10 – 20');
    expect(card.get('[data-range-label="ai"]').text()).toBe('30 – 40');
    expect(card.get('[data-testid="reference-ticks"]').findAll('span').map((tick) => tick.text())).toEqual(['0%', '25%', '50%', '75%', '100%']);
    expect(card.get('[data-axis-min]').attributes('data-axis-min')).toBe('0');
    expect(card.get('[data-axis-max]').attributes('data-axis-max')).toBe('100');
    expect(card.get('[data-axis-min]').text()).toBe('0% 对应 0');
    expect(card.get('[data-axis-max]').text()).toBe('100% 对应 100');
    expect(card.findAll('[data-testid="single-range-track"]')).toHaveLength(1);
    expect(card.findAll('[data-testid="observed-marker"]')).toHaveLength(1);
    expect(parseFloat((card.get('[data-testid="observed-marker"]').element as HTMLElement).style.left)).toBe(25);
    const track = card.get('[data-testid="single-range-track"]');
    const human = card.get('[data-testid="human-range-band"]');
    const ai = card.get('[data-testid="ai-range-band"]');
    for (const band of [human, ai]) {
      expect(band.element.parentElement).toBe(track.element);
      expect(band.classes()).toEqual(expect.arrayContaining(['top-2', 'h-3']));
    }
    expect(parseFloat((human.element as HTMLElement).style.left)).toBe(10);
    expect(parseFloat((ai.element as HTMLElement).style.left)).toBe(30);
    expect(card.find('[data-testid="overlap-range-band"]').exists()).toBe(false);
    expect(wrapper.get('[data-metric="sentence_length_median"] [data-value="human-percentile"]').text()).toBe('3');
    const method = card.get('details[data-testid="range-method"]');
    expect(method.attributes('open')).toBeUndefined();
    expect(method.text()).toContain('第 5 和第 95 百分位');
    expect(method.text()).toContain('10 组有效配对来源');
    expect(wrapper.text()).toContain('百分比仅表示图中相对位置，不是 AI 概率或样本百分位');
    expect(wrapper.text()).not.toContain('无量纲');
    expect(JSON.stringify(evidence)).toBe(original);
  });

  it('同语言指标跨分组和本次观察值变化时保持同一整体标尺', async () => {
    const wrapper = mountPanel(makeEvidence(), { initialDimension: 'rhythm' });
    for (const [domain, lengthBucket, start, observed] of [
      ['academic', 'short', 10, 15], ['news', 'medium', 50, 55], ['news', 'medium', 50, 150],
    ] as const) {
      const evidence = makeEvidence();
      Object.assign(evidence.route!, { domain, lengthBucket });
      Object.assign(evidence.signals.find((signal) => signal.metric === 'sentence_length_median')!, {
        observed, referenceExtent: [0, 100],
        referenceRanges: { human: [start, start + 10], ai: [start + 20, start + 30] },
        relation: { human: observed > 100 ? 'above' : 'within', ai: observed > 100 ? 'above' : 'below' },
      });
      const original = JSON.stringify(evidence);
      await wrapper.setProps({ evidence });
      if (observed > 100) await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
      const card = wrapper.get('[data-summary-metric="sentence_length_median"]');
      expect(card.get('[data-axis-min]').attributes('data-axis-min')).toBe('0');
      expect(card.get('[data-axis-max]').attributes('data-axis-max')).toBe('100');
      expect(parseFloat((card.get('[data-testid="human-range-band"]').element as HTMLElement).style.left)).toBe(start);
      expect(parseFloat((card.get('[data-testid="observed-marker"]').element as HTMLElement).style.left)).toBeCloseTo(Math.min(observed, 100));
      expect(card.find('[data-testid="outside-reference"]').exists()).toBe(observed > 100);
      expect(card.text()).toContain('同语言全部可用参考样本（跨领域、长度）');
      expect(JSON.stringify(evidence)).toBe(original);
    }
  });

  it('旧快照缺整体标尺仍保留原值和两侧区间，不从当前分组或本次值伪造图', () => {
    const evidence = makeEvidence();
    Object.assign(evidence.signals[0], {
      observed: 0.3214, referenceRanges: { human: [0.2, 0.5], ai: [0.6, 0.9] },
      humanPercentile: 37, aiPercentile: 0,
    });
    delete evidence.signals[0].referenceExtent;
    const original = JSON.stringify(evidence);
    const wrapper = mountPanel(evidence);
    const card = wrapper.get('[data-summary-metric="mattr"]');
    expect(card.text()).toContain('0.3214');
    expect(card.get('[data-range-label="human"]').text()).toBe('0.2 – 0.5');
    expect(card.get('[data-range-label="ai"]').text()).toBe('0.6 – 0.9');
    expect(card.get('[data-testid="reference-extent-unavailable"]').text()).toContain('未保存可用的整体参考范围');
    expect(card.find('[data-testid="reference-values"], [data-testid="observed-marker"], [data-testid="reference-ticks"]').exists()).toBe(false);
    expect(card.get('[data-testid="range-comparison-summary"]').attributes('data-comparison-state')).toBe('human');
    const row = wrapper.get('[data-metric="mattr"]');
    expect(row.get('[data-value="observed"]').text()).toBe('0.3214');
    expect(row.get('[data-value="human"]').text()).toBe('0.2 – 0.5');
    expect(row.get('[data-value="ai"]').text()).toBe('0.6 – 0.9');
    expect(row.get('[data-value="human-percentile"]').text()).toBe('37');
    expect(JSON.stringify(evidence)).toBe(original);
    expect(evidence.signals[0]).not.toHaveProperty('referenceExtent');
  });

  it('四种对比结论读取后端关系，重叠区同轨中性覆盖且两侧均常见时仍展开图', async () => {
    const wrapper = mountPanel();
    for (const [human, ai, state, text] of [
      ['within', 'within', 'both', '两类参考样本均常见'],
      ['within', 'below', 'human', '落在人工常见范围内，且低于 AI 常见范围。'],
      ['within', 'above', 'human', '落在人工常见范围内，且高于 AI 常见范围。'],
      ['above', 'within', 'ai', '落在 AI 常见范围内，且高于人工常见范围。'],
      ['below', 'within', 'ai', '落在 AI 常见范围内，且低于人工常见范围。'],
      ['above', 'below', 'neither', '超出两类常见范围'],
    ] as const) {
      const evidence = makeEvidence();
      // Keep the numeric position unchanged to verify that text consumes backend relations.
      Object.assign(evidence.signals[0], {
        observed: 0.5, humanPercentile: 99, aiPercentile: 1,
        referenceRanges: { human: [0.2, 0.6], ai: [0.4, 0.8] },
        relation: { human, ai },
      });
      const original = JSON.stringify(evidence);
      await wrapper.setProps({ evidence });
      if (state === 'both' || state === 'neither') {
        expect(wrapper.find('[data-summary-metric="mattr"]').exists()).toBe(false);
        await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
        await wrapper.get('[data-dimension="lexical"]').trigger('click');
      }
      const card = wrapper.get('[data-summary-metric="mattr"]');
      const conclusion = card.get('[data-testid="range-comparison-summary"]');
      expect(conclusion.attributes('data-comparison-state')).toBe(state);
      expect(conclusion.text()).toContain(text);
      const graph = card.get('[data-testid="reference-values"]');
      expect(graph.isVisible()).toBe(true);
      expect(graph.element.closest('details')).toBeNull();
      expect(graph.findAll('[data-testid="observed-marker"]')).toHaveLength(1);
      const overlap = graph.get('[data-testid="overlap-range-band"]');
      expect(overlap.element.parentElement).toBe(graph.get('[data-testid="single-range-track"]').element);
      expect(overlap.classes()).toEqual(expect.arrayContaining(['reference-overlap', 'top-2', 'h-3']));
      expect(parseFloat((overlap.element as HTMLElement).style.left)).toBeCloseTo(40);
      expect(parseFloat((overlap.element as HTMLElement).style.width)).toBeCloseTo(20);
      expect(JSON.stringify(evidence)).toBe(original);
    }
  });

  it('越界观察值只钳制标记并显示方向与原值，不改变参考轴端点', async () => {
    const wrapper = mountPanel();
    for (const [observed, relation, position, arrow] of [[-10, 'below', 0, '←'], [40, 'above', 100, '→']] as const) {
      const evidence = makeEvidence();
      Object.assign(evidence.signals[0], {
        observed, humanPercentile: 50, aiPercentile: 50,
        referenceRanges: { human: [0.2, 0.6], ai: [0.4, 0.8] },
        relation: { human: relation, ai: relation },
      });
      const original = JSON.stringify(evidence);
      await wrapper.setProps({ evidence });
      await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
      await wrapper.get('[data-dimension="lexical"]').trigger('click');
      const card = wrapper.get('[data-summary-metric="mattr"]');
      expect(card.get('[data-axis-min]').attributes('data-axis-min')).toBe('0');
      expect(card.get('[data-axis-max]').attributes('data-axis-max')).toBe('1');
      expect(card.findAll('[data-testid="observed-marker"]')).toHaveLength(1);
      expect(parseFloat((card.get('[data-testid="observed-marker"]').element as HTMLElement).style.left)).toBe(position);
      expect(card.get('[data-testid="edge-arrow"]').text()).toBe(arrow);
      expect(card.get('[data-testid="outside-reference"]').text()).toContain(String(observed));
      expect(card.get('[data-testid="range-comparison-summary"]').attributes('data-comparison-state')).toBe('neither');
      expect(JSON.stringify(evidence)).toBe(original);
    }
  });

  it.each([0.5, 2])('退化共同参考点保留观察值 %s 和说明，不生成百分比刻度', (observed) => {
    const evidence = makeEvidence();
    Object.assign(evidence.signals[0], {
      observed, referenceRanges: { human: [0.5, 0.5], ai: [0.5, 0.5] },
      referenceExtent: [0.5, 0.5],
      relation: { human: observed === 0.5 ? 'within' : 'above', ai: observed === 0.5 ? 'within' : 'above' },
    });
    const original = JSON.stringify(evidence);
    const wrapper = mountPanel(evidence, { initialShowAll: true });
    const card = wrapper.get('[data-summary-metric="mattr"]');
    expect(card.get('[data-testid="degenerate-range"]').text()).toContain('整体参考范围为单点 0.5');
    expect(card.find('[data-testid="reference-ticks"], [data-axis-min], [data-axis-max]').exists()).toBe(false);
    expect(card.findAll('[data-testid="single-range-track"]')).toHaveLength(1);
    expect(card.findAll('[data-testid="observed-marker"]')).toHaveLength(1);
    expect(parseFloat((card.get('[data-testid="observed-marker"]').element as HTMLElement).style.left)).toBe(observed === 0.5 ? 50 : 100);
    expect(card.find('[data-testid="outside-reference"]').exists()).toBe(observed !== 0.5);
    expect(wrapper.get('[data-metric="mattr"] [data-value="observed"]').text()).toBe(String(observed));
    expect(JSON.stringify(evidence)).toBe(original);
  });

  it.each([
    ['8abe24fc7e7747f4e2e9b90a80bf26b7999726373fa80e8519a97dffbe7014b2', 'V1 参考统计'],
    ['f04fee602a09850adae31e5e78ea9926a27cd96663aeeeaeaafb11d8a959fb0e', 'V1 参考统计与中文短文补充'],
  ])('已核对的来源版本 %s 保留内部识别但不显示长标识', async (artifactVersion, sourceLabel) => {
    const evidence = makeEvidence();
    evidence.artifactVersion = artifactVersion;
    const original = JSON.stringify(evidence);
    const wrapper = mountPanel(evidence);
    const source = wrapper.get('details[data-testid="reference-source"]');
    expect(source.attributes('open')).toBeUndefined();
    expect(source.get('a').text()).toBe('DetectRL-X · Binary General Open');
    expect(source.get('a').attributes('href')).toBe('https://huggingface.co/datasets/WUJUNCHAO/DetectRL-X/blob/main/README.md');
    expect(source.get('a').attributes('rel')).toBe('noopener noreferrer');
    expect(source.text()).toContain(sourceLabel);
    expect(source.find('code').exists()).toBe(false);
    expect(wrapper.text()).not.toContain(artifactVersion);
    expect(wrapper.text()).not.toContain('参考版本标识');
    expect(source.text()).not.toContain('中文短文范围由拟合样本建立');
    expect(JSON.stringify(evidence)).toBe(original);
    wrapper.vm.setLocale('en-US');
    await nextTick();
    expect(source.text()).not.toMatch(/scan\.evidence\.|[\u4e00-\u9fff]/);
    expect(wrapper.text()).not.toContain(artifactVersion);
    expect(wrapper.text()).not.toContain('Reference version identifier');
  });

  it.each(['1'.repeat(64), null])('未知或缺失版本 %s 不冒充已核实的语料来源', (artifactVersion) => {
    const evidence = makeEvidence();
    evidence.artifactVersion = artifactVersion;
    const wrapper = mountPanel(evidence);
    const source = wrapper.get('[data-testid="reference-source"]');
    expect(source.text()).toContain('暂无可核对的来源说明');
    expect(source.find('a').exists()).toBe(false);
    expect(source.text()).not.toContain('DetectRL-X');
    expect(source.find('code').exists()).toBe(false);
    expect(wrapper.text()).not.toMatch(/[a-f0-9]{64}/i);
    expect(evidence.artifactVersion).toBe(artifactVersion);
  });

  it('中文短文验证说明仅用于已知短文版本、中文短文路由且存在比较的快照', async () => {
    const shortVersion = 'f04fee602a09850adae31e5e78ea9926a27cd96663aeeeaeaafb11d8a959fb0e';
    const originalVersion = '8abe24fc7e7747f4e2e9b90a80bf26b7999726373fa80e8519a97dffbe7014b2';
    const wrapper = mountPanel();
    for (const [artifactVersion, language, lengthBucket, status, show] of [
      [shortVersion, 'zh', 'brief_200_399', 'ready', true],
      [shortVersion, 'zh', 'brief_400_599', 'partial', true],
      [shortVersion, 'zh', 'short', 'ready', false],
      [shortVersion, 'en', 'brief_200_399', 'ready', false],
      [shortVersion, 'zh', 'brief_200_399', 'insufficient', false],
      [originalVersion, 'zh', 'brief_200_399', 'ready', false],
      ['1'.repeat(64), 'zh', 'brief_200_399', 'ready', false],
    ] as const) {
      const evidence = makeEvidence(status);
      evidence.artifactVersion = artifactVersion;
      Object.assign(evidence.route!, { language, lengthBucket });
      await wrapper.setProps({ evidence });
      expect(wrapper.get('[data-testid="reference-source"]').text().includes('中文短文范围由拟合样本建立')).toBe(show);
    }
  });

  it.each([
    ['ready', 4], ['partial', 4], ['insufficient', 0], ['unsupported', 0], ['failed', 0],
  ] as const)('%s 概要仅展示写作特点或简短失败态，不增加来源分类', async (status, cards) => {
    const wrapper = mountPanel(makeEvidence(status), { detailed: false });
    expect(wrapper.findAll('[data-testid="evidence-summary"]')).toHaveLength(cards);
    expect(wrapper.find('[data-metric], [data-testid="evidence-quality"], [data-testid="evidence-route"]').exists()).toBe(false);
    if (status === 'unsupported' || status === 'failed') {
      expect(wrapper.get('[data-testid="evidence-status"]').text()).not.toBe('');
      expect(wrapper.get('details[data-testid="evidence-failure-reasons"]').attributes('open')).toBeUndefined();
    }
    for (const locale of ['en-US', 'zh-CN']) {
      wrapper.vm.setLocale(locale);
      await nextTick();
      expect(wrapper.find('select, input, progress, [role="combobox"], [role="listbox"], [aria-haspopup="listbox"]').exists()).toBe(false);
      expect(wrapper.text()).not.toMatch(/\b(?:mixed|borderline|generator|deepseek|gemini|gpt-4o|qwen)\b|生成器|混合来源/i);
    }
  });

  it('缺失或 null 时移除面板，恢复快照时重新展示', async () => {
    const wrapper = mountPanel();
    await wrapper.setProps({ evidence: undefined });
    expect(wrapper.find('[data-testid="evidence-panel"]').exists()).toBe(false);
    await wrapper.setProps({ evidence: null });
    expect(wrapper.find('[data-testid="evidence-panel"]').exists()).toBe(false);
    await wrapper.setProps({ evidence: makeEvidence() });
    expect(wrapper.findAll('[data-testid="evidence-dimension"]')).toHaveLength(4);
  });

  it('查看全部后保留 0、退化区间、小数长度、大于 1 的 CV 和微小正数，不换算成概率', async () => {
    const evidence = makeEvidence();
    const setValue = (metric: string, value: number) => {
      const signal = evidence.signals.find((item) => item.metric === metric)!;
      signal.observed = value;
      signal.referenceRanges = { human: [value, value], ai: [value, value] };
    };
    setValue('sentence_length_median', 1.25);
    setValue('paragraph_length_iqr', 0.75);
    setValue('sentence_length_cv', 2.5);
    setValue('hapax_type_ratio', 0.000000123456);
    setValue('transition_per_1k', 1.31579);
    setValue('punctuation_entropy', -0);
    evidence.route!.confidence.language = 0.999978;
    const wrapper = mountPanel(evidence);
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    const row = (metric: string) => wrapper.get(`[data-metric="${metric}"]`);
    expect(row('mattr').get('[data-value="observed"]').text()).toBe('0');
    expect(row('mattr').get('[data-value="human"]').text()).toBe('0 – 0');
    expect(row('sentence_length_median').get('[data-value="observed"]').text()).toBe('1.25');
    expect(row('paragraph_length_iqr').get('[data-value="observed"]').text()).toBe('0.75');
    expect(row('sentence_length_cv').get('[data-value="observed"]').text()).toBe('2.5');
    expect(row('sentence_length_cv').get('[data-value="ai"]').text()).toBe('2.5 – 2.5');
    expect(row('hapax_type_ratio').get('[data-value="observed"]').text()).toBe('0');
    expect(row('transition_per_1k').get('[data-value="observed"]').text()).toBe('1.3158');
    expect(row('transition_per_1k').get('[data-value="human"]').text()).toBe('1.3158 – 1.3158');
    expect(row('punctuation_entropy').get('[data-value="observed"]').text()).toBe('0');
    expect(wrapper.get('[data-confidence="language"]').text()).toBe('1');
    expect(evidence.signals.find((signal) => signal.metric === 'transition_per_1k')!.observed).toBe(1.31579);
    for (const value of wrapper.findAll('[data-value="observed"], [data-value="human"], [data-value="ai"]')) {
      expect(value.text()).not.toContain('%');
    }
  });

  it('partial 查看全部后保留不可比项，区分观察值缺失与参考缺失', async () => {
    const evidence = makeEvidence('partial');
    const missing = evidence.signals.find((item) => item.metric === 'paragraph_nonadjacent_jaccard_q90')!;
    missing.observed = null;
    missing.reasons.push('insufficient_observations');
    const wrapper = mountPanel(evidence);
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    const observedOnly = wrapper.get('[data-metric="paragraph_adjacent_jaccard"]');
    expect(observedOnly.get('[data-value="observed"]').text()).toBe('0');
    expect(observedOnly.get('[data-value="human"]').text()).toBe('—');
    expect(observedOnly.get('[data-value="ai"]').text()).toBe('—');
    expect(observedOnly.find('[data-value="human-percentile"], [data-value="human-relation"]').exists()).toBe(false);
    const noObservation = wrapper.get('[data-metric="paragraph_nonadjacent_jaccard_q90"]');
    expect(noObservation.get('[data-value="observed"]').text()).toBe('暂无观察值');
    expect(noObservation.get('[data-value="human"]').text()).toBe('—');
    expect(wrapper.findAll('[data-metric]')).toHaveLength(22);
  });

  it.each(['zh', 'ar', 'de', 'en', 'es', 'fr', 'pt', 'ru'] as const)('%s 使用提取器的长度与密度单位', (language) => {
    const evidence = makeEvidence();
    evidence.route!.language = language;
    const wrapper = mountPanel(evidence);
    const heading = (metric: string) => wrapper.get(`[data-metric="${metric}"] h4`).text();
    for (const metric of ['sentence_length_median', 'sentence_length_iqr', 'sentence_adjacent_change_median',
      'paragraph_length_median', 'paragraph_length_iqr']) {
      expect(heading(metric)).toContain(language === 'zh' ? '(汉字)' : '(词元)');
    }
    expect(heading('punctuation_per_1k')).toContain(language === 'zh' ? '(次 / 千汉字)' : '(次 / 千词元)');
    expect(heading('transition_per_1k')).toContain('(次 / 千词元)');
    expect(heading('mattr')).toContain('(比例)');
    expect(heading('token_entropy')).toContain('(bit)');
    expect(heading('punctuation_entropy')).toContain('(bit)');
    expect(heading('sentence_length_cv')).toBe('句长变化程度');
    expect(heading('paragraph_length_cv')).toBe('段长变化程度');
    expect(heading('section_heading_count')).toContain('(个)');
  });

  it('切换中英文同步更新标题、指标、单位和基本态，无未翻译键', async () => {
    const wrapper = mountPanel();
    expect(wrapper.get('h3').text()).toBe('写作特点');
    expect(wrapper.get('[data-metric="transition_diversity"] h4').text()).toContain('过渡表达词表覆盖率');
    expect(wrapper.get('[data-metric="intro_conclusion_jaccard"] h4').text()).toContain('首尾段');
    wrapper.vm.setLocale('en-US');
    await nextTick();
    expect(wrapper.get('h3').text()).toBe('Writing characteristics');
    expect(wrapper.findAll('[data-testid="evidence-dimension"]')).toHaveLength(4);
    expect(wrapper.get('[data-metric="sentence_length_median"] h4').text()).toContain('(tokens)');
    expect(wrapper.text()).toContain('not source probabilities or confidence intervals');
    expect(wrapper.text()).not.toMatch(/scan\.evidence\.|undefined|[\u4e00-\u9fff]/);
    const evidence = makeEvidence();
    Object.assign(evidence.signals[0], {
      humanPercentile: 0, aiPercentile: 2.5,
      referenceRanges: { human: [0.1, 0.5], ai: [0, 0.5] },
      relation: { human: 'below', ai: 'within' }, notice: 'reference_mismatch',
    });
    Object.assign(evidence.signals[1], {
      humanPercentile: 0, aiPercentile: 0,
      referenceRanges: { human: [0.1, 0.5], ai: [0.1, 0.5] },
      relation: { human: 'below', ai: 'below' }, notice: 'outside_both',
    });
    await wrapper.setProps({ evidence });
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    expect(wrapper.get('[data-testid="evidence-route"]').text()).toContain('not represent routing correctness probabilities or AI probabilities');
    expect(wrapper.get('[data-testid="evidence-quality"]').text()).toContain('denominator is always 22 metrics');
    expect(wrapper.get('[data-testid="evidence-quality"]').text()).toContain('not an AI probability or classification accuracy');
    expect(wrapper.get('[data-metric="mattr"] [data-testid="evidence-notice"]').text()).toContain('does not mean the main model is wrong');
    expect(wrapper.get('[data-metric="token_entropy"] [data-testid="evidence-notice"]').text()).toContain('does not establish a new source classification');
    for (const status of ['partial', 'insufficient', 'unsupported', 'failed'] as const) {
      await wrapper.setProps({ evidence: makeEvidence(status) });
      if (status === 'partial') expect(wrapper.find('[data-testid="evidence-status"]').exists()).toBe(false);
      else expect(wrapper.get('[data-testid="evidence-status"]').text()).not.toMatch(/scan\.evidence\.|[\u4e00-\u9fff]/);
    }
    wrapper.vm.setLocale('zh-CN');
    await wrapper.setProps({ evidence });
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    await nextTick();
    expect(wrapper.get('h3').text()).toBe('写作特点');
    expect(wrapper.get('[data-metric="mattr"] [data-testid="evidence-notice"]').text()).toContain('不表示主模型判错');
    expect(wrapper.get('[data-metric="token_entropy"] [data-testid="evidence-notice"]').text()).toContain('两侧参考范围之外');
  });

  it.each([
    [0, 'insufficient', '0%', '不可比较'],
    [1, 'partial', '4.5455%', '部分可比'],
    [19, 'partial', '86.3636%', '部分可比'],
    [22, 'ready', '100%', '全部可比'],
  ] as const)('%i / 22 保持后端 Quality 状态及固定分母', async (available, status, coverage, level) => {
    const evidence = makeEvidence('ready');
    evidence.status = status;
    evidence.quality = { level: status, coverage: available / 22, reasons: available === 22 ? [] : ['reference_metrics_unavailable'] };
    for (const signal of evidence.signals.slice(available)) {
      Object.assign(signal, {
        humanPercentile: null, aiPercentile: null, referenceRanges: null, relation: null,
        sampleCount: 0, reasons: ['no_valid_source_groups'],
      });
    }
    const wrapper = mountPanel(evidence);
    if (available < 22) await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    expect(wrapper.get('[data-value="coverage"]').text()).toBe(coverage);
    expect(wrapper.get('[data-value="quality-level"]').text()).toBe(level);
    expect(wrapper.get('[data-testid="evidence-quality"]').text()).toContain('分母固定为 22 项');
    expect(wrapper.get('[data-testid="evidence-quality"]').text()).toContain('不是 AI 概率或判断正确率');
    expect(wrapper.findAll('[data-metric]')).toHaveLength(22);
  });

  it.each([
    ['exact', '同语言、同领域、同长度档'],
    ['language_length', '同语言、同长度档（跨领域）'],
    ['language', '同语言（跨领域、跨长度档）'],
    ['unavailable', '未使用参考组'],
  ] as const)('只读显示 %s 参考组，零诊断分数不触发弃权', (fallback, label) => {
    const evidence = makeEvidence(fallback === 'unavailable' ? 'insufficient' : 'ready');
    evidence.route!.fallbackLevel = fallback;
    if (fallback === 'language_length' || fallback === 'language') {
      evidence.quality.reasons = [`reference_fallback_${fallback}`];
    } else if (fallback === 'unavailable') {
      evidence.route!.lengthBucket = 'below_minimum';
      evidence.quality.reasons = ['below_minimum_length'];
      for (const signal of evidence.signals) {
        signal.sampleCount = null;
        signal.reasons = ['below_minimum_length'];
      }
    }
    const wrapper = mountPanel(evidence);
    expect(wrapper.get('[data-route="fallbackLevel"]').text()).toBe(label);
    expect(wrapper.get('[data-route="language"]').text()).toBe('英语');
    expect(wrapper.get('[data-route="domain"]').text()).toBe('学术');
    expect(wrapper.get('[data-confidence="language"]').text()).toBe('0');
    expect(wrapper.get('[data-confidence="domain"]').text()).toBe('0');
    expect(wrapper.get('[data-testid="evidence-route"]').text()).toContain('不是路由正确概率或 AI 概率');
    expect(wrapper.get('[data-value="quality-level"]').text()).toBe(fallback === 'unavailable' ? '不可比较' : '全部可比');
    const group = wrapper.get('[data-testid="reference-group"]').text();
    expect(group).toContain(label);
    if (fallback === 'exact') expect(group).toContain('英语 · 学术 · 短文本');
    if (fallback === 'language_length') {
      expect(group).toContain('英语 · 短文本');
      expect(group).not.toContain('学术');
    }
    if (fallback === 'language') {
      expect(group).toContain('英语');
      expect(group).not.toMatch(/学术|短文本/);
    }
    if (fallback === 'unavailable') expect(group).not.toMatch(/英语|学术|短文本/);
    expect(wrapper.find('select, input').exists()).toBe(false);
    if (fallback === 'unavailable') {
      expect(wrapper.get('[data-testid="quality-reasons"]').text()).not.toContain('没有可用的参考分组');
    } else if (fallback !== 'exact') {
      expect(wrapper.get('[data-testid="quality-reasons"]').text()).toContain('参考范围已扩大');
    }
  });

  it('隐藏样本数列且不改写 N=0/9/大数，查看全部后缺参考只显示占位和真实原因', async () => {
    const evidence = makeEvidence('partial');
    const missing = evidence.signals.find((signal) => signal.metric === 'paragraph_adjacent_jaccard')!;
    missing.observed = null;
    missing.reasons = ['insufficient_observations', 'no_valid_source_groups'];
    const small = evidence.signals.find((signal) => signal.metric === 'paragraph_nonadjacent_jaccard_q90')!;
    small.sampleCount = 9;
    small.reasons = ['fewer_than_10_source_groups'];
    evidence.signals[0].sampleCount = 1234567;
    const wrapper = mountPanel(evidence);
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    const emptyRow = wrapper.get('[data-metric="paragraph_adjacent_jaccard"]');
    expect(wrapper.find('[data-value="sample-count"]').exists()).toBe(false);
    expect(missing.sampleCount).toBe(0);
    expect(emptyRow.get('[data-testid="signal-reasons"]').text()).toContain('本次文本不足以提取');
    expect(emptyRow.get('[data-testid="signal-reasons"]').text()).toContain('没有共同有效的配对参考样本组');
    const smallRow = wrapper.get('[data-metric="paragraph_nonadjacent_jaccard_q90"]');
    expect(small.sampleCount).toBe(9);
    expect(smallRow.get('[data-testid="signal-reasons"]').text()).toContain('不足 10 组');
    expect(smallRow.find('[data-value="human-percentile"]').exists()).toBe(false);
    expect(evidence.signals[0].sampleCount).toBe(1234567);
  });

  it('没有选用参考组时 N=null 不显示为 0，查看全部后保留已提取观察值', async () => {
    const evidence = makeEvidence('insufficient');
    evidence.route!.fallbackLevel = 'unavailable';
    evidence.quality.reasons = ['reference_cell_unavailable'];
    for (const signal of evidence.signals) {
      signal.sampleCount = null;
      signal.reasons = ['reference_cell_unavailable'];
    }
    const wrapper = mountPanel(evidence);
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    expect(wrapper.find('[data-value="sample-count"]').exists()).toBe(false);
    expect(evidence.signals[0].sampleCount).toBeNull();
    expect(wrapper.get('[data-value="observed"]').text()).toBe('0');
    expect(wrapper.find('[data-value="human-relation"]').exists()).toBe(false);
    expect(wrapper.get('[data-value="coverage"]').text()).toBe('0%');
  });

  it('短文概要展示真实观察事实，只在顶部解释比较门槛，不把缺参考写成较多或常见', async () => {
    const evidence = makeEvidence('insufficient');
    evidence.route!.language = 'zh';
    evidence.quality.reasons = ['below_minimum_length', 'length_out_of_range', 'fewer_than_10_sentences', 'no_comparable_metrics'];
    Object.assign(evidence.signals.find((signal) => signal.metric === 'mattr')!, { observed: 0.0792308 });
    Object.assign(evidence.signals.find((signal) => signal.metric === 'sentence_length_median')!, { observed: 36 });
    Object.assign(evidence.signals.find((signal) => signal.metric === 'sentence_length_cv')!, { observed: 0.337975 });
    Object.assign(evidence.signals.find((signal) => signal.metric === 'transition_per_1k')!, { observed: 33.5821 });
    const original = JSON.stringify(evidence);
    const wrapper = mountPanel(evidence, { detailed: false });
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    expect(wrapper.get('[data-testid="evidence-status"]').text()).toContain('至少 10 句');
    expect(wrapper.text().match(/至少 10 句/g)).toHaveLength(1);
    expect(wrapper.get('[data-testid="evidence-status"]').text()).not.toContain('未覆盖本次文本长度');
    expect(wrapper.text()).toContain('词汇多样性指数（MATTR）0.0792');
    expect(wrapper.text()).toContain('典型句长 36 汉字');
    expect(wrapper.text()).toContain('句长变化程度 0.338');
    expect(wrapper.text()).toContain('每千词元出现 33.5821 次连接表达');
    expect(wrapper.text()).toContain('未检出重复词组');
    expect(wrapper.text()).not.toMatch(/暂无可比参考|暂缺比较参考|较多|较少|常见范围/);
    expect(JSON.stringify(evidence)).toBe(original);
    wrapper.vm.setLocale('en-US');
    await nextTick();
    expect(wrapper.text()).toContain('Typical sentence length: 36 Han characters');
    expect(wrapper.text()).not.toMatch(/scan\.evidence\.|[\u4e00-\u9fff]/);
    await wrapper.setProps({ detailed: true });
    expect(wrapper.get('[data-metric="mattr"] [data-value="observed"]').text()).toBe('0.0792');
    expect(wrapper.get('[data-metric="sentence_length_cv"] [data-value="observed"]').text()).toBe('0.338');
    expect(wrapper.get('[data-metric="transition_per_1k"] [data-value="observed"]').text()).toBe('33.5821');
    expect(wrapper.get('[data-testid="quality-reasons"]').text()).toContain('outside the comparable range');
  });

  it('无参考仍保留 MATTR 观察值且不展示词频，缺段只提示对应段间指标所需的段数', async () => {
    const evidence = makeEvidence('insufficient');
    evidence.quality.reasons = ['reference_metrics_unavailable', 'missing_observations'];
    evidence.patterns!.descriptive_top_tokens = [{ count: 3, offsets: [{ start: 0, end: 2 }] }];
    for (const metric of ['paragraph_adjacent_jaccard', 'paragraph_nonadjacent_jaccard_q90', 'intro_conclusion_jaccard']) {
      Object.assign(evidence.signals.find((signal) => signal.metric === metric)!, { observed: null, reasons: ['insufficient_observations'] });
    }
    const wrapper = mountPanel(evidence, { submittedText: '技术技术技术' });
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    expect(wrapper.find('[data-testid="evidence-examples"]').exists()).toBe(false);
    expect(wrapper.get('[data-metric="mattr"] [data-value="observed"]').text()).toBe('0');
    expect(wrapper.get('[data-metric="paragraph_nonadjacent_jaccard_q90"] [data-testid="signal-reasons"]').text()).toContain('至少需要 3 个');
    expect(wrapper.get('[data-metric="intro_conclusion_jaccard"] [data-testid="signal-reasons"]').text()).toContain('至少需要 2 个');
    await wrapper.get('[data-dimension="discourse"]').trigger('click');
    const missing = wrapper.get('[data-summary-metric="paragraph_adjacent_jaccard"]');
    expect(missing.text()).toContain('至少需要 2 个');
    expect(missing.text()).not.toMatch(/本次文本: 0|暂无可比参考/);
    expect(wrapper.get('[data-metric="paragraph_adjacent_jaccard"] [data-value="observed"]').text()).toBe('暂无观察值');
  });

  it.each(['brief_200_399', 'brief_400_599'] as const)('短文档 %s 显示已验证的路由字段，有限观察不足不误写成无法提取', async (lengthBucket) => {
    const evidence = makeEvidence('partial');
    evidence.route!.language = 'zh';
    evidence.route!.lengthBucket = lengthBucket;
    evidence.quality.reasons = ['reference_validation_failed'];
    Object.assign(evidence.signals.find((signal) => signal.metric === 'sentence_length_median')!, {
      observed: 36, referenceRanges: null, relation: null, humanPercentile: null, aiPercentile: null,
      reasons: ['insufficient_observations'],
    });
    const wrapper = mountPanel(evidence, { initialDimension: 'rhythm' });
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    expect(wrapper.get('[data-route="lengthBucket"]').text()).toBe(lengthBucket === 'brief_200_399' ? '200–399 汉字' : '400–599 汉字');
    expect(wrapper.find('[data-testid="evidence-status"]').exists()).toBe(false);
    const observation = wrapper.get('[data-summary-metric="sentence_length_median"]');
    expect(observation.text()).toContain('本次文本: 36 汉字');
    expect(observation.get('[data-testid="metric-comparison-reason"]').text()).toBe('已计算，暂不作范围比较。');
    expect(observation.text()).not.toMatch(/无法|需要可识别|不足以提取/);
    expect(wrapper.get('[data-metric="sentence_length_median"] [data-testid="signal-reasons"]').text()).toBe('本次文本对该指标的有效观察不足。');
    wrapper.vm.setLocale('en-US');
    await nextTick();
    expect(wrapper.text()).not.toMatch(/scan\.evidence\.|[\u4e00-\u9fff]/);
  });

  it.each([[0, 2.5], [1, 97.5]])('端点原值 %s 独立于百分位 %s 作图，仍直接显示后端 within', async (observed, percentile) => {
    const evidence = makeEvidence();
    Object.assign(evidence.signals[0], {
      observed, humanPercentile: percentile, aiPercentile: percentile,
      referenceRanges: { human: [0, 1], ai: [0, 1] },
    });
    const wrapper = mountPanel(evidence);
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    await wrapper.get('[data-dimension="lexical"]').trigger('click');
    const row = wrapper.get('[data-metric="mattr"]');
    expect(row.get('[data-value="human-percentile"]').text()).toBe(String(percentile));
    expect(row.get('[data-value="ai-percentile"]').text()).toBe(String(percentile));
    expect(row.get('[data-value="human-relation"]').text()).toBe('范围内');
    for (const marker of wrapper.findAll('[data-testid="observed-marker"]')) expect(marker.attributes('style')).toContain(`left: ${observed * 100}%`);
    expect(wrapper.get('[data-testid="reference-ticks"]').findAll('span').map((tick) => tick.text())).toEqual(['0%', '25%', '50%', '75%', '100%']);
    expect(wrapper.find('[data-testid="reference-percentile"]').exists()).toBe(false);
    expect(row.find('[data-testid="evidence-notice"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="dimension-notice"]').exists()).toBe(false);
  });

  it('参考验证失败仅在对应卡片提示，不影响可比卡片或伪造百分位', async () => {
    const evidence = makeEvidence('partial');
    Object.assign(evidence.signals.find((signal) => signal.metric === 'paragraph_adjacent_jaccard')!, {
      observed: 0.12, reasons: ['reference_validation_failed'],
    });
    evidence.quality.reasons = ['reference_validation_failed', 'reference_metrics_unavailable'];
    const wrapper = mountPanel(evidence, { initialDimension: 'discourse' });
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    expect(wrapper.find('[data-testid="evidence-status"]').exists()).toBe(false);
    const comparable = wrapper.get('[data-summary-metric="transition_per_1k"]');
    expect(comparable.find('[data-testid="metric-comparison-reason"]').exists()).toBe(false);
    const observation = wrapper.get('[data-summary-metric="paragraph_adjacent_jaccard"]');
    expect(observation.get('[data-testid="metric-comparison-reason"]').text()).toContain('参考统计未通过验证');
    expect(observation.find('[data-testid="reference-values"]').exists()).toBe(false);
    expect(observation.text().match(/0\.12/g)).toHaveLength(1);
    wrapper.vm.setLocale('en-US');
    await nextTick();
    expect(observation.get('[data-testid="metric-comparison-reason"]').text()).toContain('failed validation');
    expect(wrapper.text()).not.toMatch(/scan\.evidence\.|[\u4e00-\u9fff]/);
  });

  it('舍入显示相同时查看全部的专业数据仍保留后端 relation/notice', async () => {
    const evidence = makeEvidence();
    Object.assign(evidence.signals.find((signal) => signal.metric === 'sentence_length_cv')!, {
      observed: 1.0000004, humanPercentile: 100, aiPercentile: 50,
      referenceRanges: { human: [0, 1], ai: [0, 2] },
      relation: { human: 'above', ai: 'within' }, notice: 'reference_mismatch',
    });
    const original = JSON.stringify(evidence);
    const wrapper = mountPanel(evidence);
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    const row = wrapper.get('[data-metric="sentence_length_cv"]');
    expect(row.get('[data-value="observed"]').text()).toBe('1');
    expect(row.get('[data-value="human"]').text()).toBe('0 – 1');
    expect(row.get('[data-value="human-relation"]').text()).toBe('高于范围');
    expect(row.get('[data-value="human-percentile"]').text()).toBe('100');
    expect(row.get('[data-testid="evidence-notice"]').text()).toContain('不表示主模型判错');
    expect(wrapper.get('details[data-testid="evidence-professional"]').attributes('open')).toBeUndefined();
    expect(JSON.stringify(evidence)).toBe(original);
  });

  it('两侧范围外与 null 提示分开；更新快照移除旧提示，不把无提示写成主结果正确', async () => {
    const evidence = makeEvidence();
    Object.assign(evidence.signals[0], {
      observed: 0, humanPercentile: 0, aiPercentile: 0,
      referenceRanges: { human: [0.1, 0.5], ai: [0.2, 0.6] },
      relation: { human: 'below', ai: 'below' }, notice: 'outside_both',
    });
    const wrapper = mountPanel(evidence);
    await wrapper.get('[data-testid="evidence-show-all"]').trigger('click');
    const row = wrapper.get('[data-metric="mattr"]');
    expect(row.get('[data-value="ai-percentile"]').text()).toBe('0');
    expect(row.get('[data-value="ai-relation"]').text()).toBe('低于范围');
    expect(row.get('[data-testid="evidence-notice"]').text()).toContain('两侧参考范围之外');
    await wrapper.setProps({ evidence: makeEvidence() });
    expect(wrapper.find('[data-testid="evidence-notice"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="dimension-notice"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('主结果正确');
  });

  it('failed 的语言未确定不冒充 unsupported，缺失快照清除全部元信息', async () => {
    const evidence = makeEvidence('failed');
    evidence.quality.reasons = ['language_undetermined'];
    const wrapper = mountPanel(evidence);
    expect(wrapper.find('[data-testid="evidence-route"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="evidence-quality"]').exists()).toBe(false);
    expect(wrapper.get('details[data-testid="evidence-failure-reasons"]').attributes('open')).toBeUndefined();
    expect(wrapper.get('[data-testid="quality-reasons"]').text()).toContain('无法确定');
    expect(wrapper.text()).not.toContain('暂不支持');
    await wrapper.setProps({ evidence: makeEvidence('unsupported') });
    expect(wrapper.get('[data-testid="quality-reasons"]').text()).toContain('暂不支持');
    expect(wrapper.find('[data-value="coverage"]').exists()).toBe(false);
    await wrapper.setProps({ evidence: undefined });
    expect(wrapper.find('[data-testid="evidence-quality"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="evidence-panel"]').exists()).toBe(false);
  });

  it('29 个公共原因均有独立中英文文案，不暴露原始原因码或触发英文回退', async () => {
    const reasons = {
      invalid_evidence_config: true, invalid_evidence_bundle: true, bundle_unavailable: true,
      invalid_router_response: true, invalid_text: true, invalid_main_label: true,
      feature_extraction_failed: true, comparison_failed: true, model_unavailable: true,
      model_failure: true, busy: true, timeout: true, language_undetermined: true,
      unsupported_language: true, below_minimum_length: true, fewer_than_10_sentences: true,
      excluded_content_over_40pct: true, length_out_of_range: true, reference_cell_unavailable: true,
      reference_fallback_language_length: true, reference_fallback_language: true,
      missing_observations: true, reference_metrics_unavailable: true, reference_validation_failed: true, no_comparable_metrics: true,
      no_valid_source_groups: true, fewer_than_10_source_groups: true,
      not_applicable_for_language: true, insufficient_observations: true,
    } satisfies Record<EvidenceReason, true>;
    const codes = Object.keys(reasons) as EvidenceReason[];
    const evidence = makeEvidence('failed');
    evidence.quality.reasons = codes;
    const wrapper = mountPanel(evidence);
    const messages = () => wrapper.get('[data-testid="quality-reasons"]').findAll('li').map((item) => item.text());
    expect(messages()).toHaveLength(29);
    for (const message of messages()) expect(message).toMatch(/[\u4e00-\u9fff]/);
    wrapper.vm.setLocale('en-US');
    await nextTick();
    for (const [index, message] of messages().entries()) {
      expect(message.length).toBeGreaterThan(0);
      expect(message).not.toBe(codes[index]);
      expect(message).not.toMatch(/scan\.evidence\.|undefined|[\u4e00-\u9fff]/);
    }
    wrapper.vm.setLocale('zh-CN');
    await nextTick();
  });
});
