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
      humanPercentile: comparable ? 50 : null, aiPercentile: comparable ? 50 : null,
      referenceRanges: comparable ? { human: [0, 0], ai: [0, 0] } : null,
      relation: comparable ? { human: 'within', ai: 'within' } : null,
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
  props: { evidence: { type: Object as PropType<EvidenceResult | null>, default: undefined } },
  setup() {
    const { setLocale } = useI18n();
    setLocale('zh-CN');
    return { setLocale };
  },
  template: '<EvidencePanel :evidence="evidence" />',
});
const mountPanel = (evidence: EvidenceResult | null | undefined = makeEvidence()) =>
  mount(Harness, { props: { evidence }, global: { plugins: [createI18n()] } });

describe('EvidencePanel', () => {
  it('展示四维全部 22 项，默认折叠且保持后端分组顺序', () => {
    const evidence = makeEvidence();
    const original = JSON.stringify(evidence);
    const wrapper = mountPanel(evidence);
    expect(wrapper.findAll('details')).toHaveLength(4);
    expect(wrapper.findAll('[data-metric]')).toHaveLength(22);
    for (const [dimension, names] of Object.entries(metrics)) {
      const card = wrapper.get(`[data-dimension="${dimension}"]`);
      expect(card.attributes('open')).toBeUndefined();
      expect(card.get('summary').text()).not.toBe('');
      expect(card.findAll('[data-metric]').map((row) => row.attributes('data-metric'))).toEqual(names);
    }
    expect(wrapper.text()).not.toMatch(/scan\.evidence\.|undefined|NaN|Mixed|generator|reference_mismatch|outside_both/);
    expect(JSON.stringify(evidence)).toBe(original);
  });

  it.each([
    ['ready', '全部指标可与参考样本比较。', 4],
    ['partial', '部分指标可比较', 4],
    ['insufficient', '暂无足够可比证据', 4],
    ['unsupported', '此文本语言暂不支持', 0],
    ['failed', '特征参考暂不可用', 0],
  ] as const)('%s 使用对应基本态，不用新阈值改判或增加选择器与来源类别', async (status, message, cards) => {
    const wrapper = mountPanel(makeEvidence(status));
    expect(wrapper.get('[data-testid="evidence-status"]').text()).toContain(message);
    expect(wrapper.findAll('details')).toHaveLength(cards);
    expect(wrapper.findAll('[data-metric]')).toHaveLength(cards ? 22 : 0);
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
    expect(wrapper.findAll('details')).toHaveLength(4);
  });

  it('保留 0、退化区间、小数长度、大于 1 的 CV 和微小正数，不换算成概率', () => {
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
    const wrapper = mountPanel(evidence);
    const row = (metric: string) => wrapper.get(`[data-metric="${metric}"]`);
    expect(row('mattr').get('[data-value="observed"]').text()).toBe('0');
    expect(row('mattr').get('[data-value="human"]').text()).toBe('0 – 0');
    expect(row('sentence_length_median').get('[data-value="observed"]').text()).toBe('1.25');
    expect(row('paragraph_length_iqr').get('[data-value="observed"]').text()).toBe('0.75');
    expect(row('sentence_length_cv').get('[data-value="observed"]').text()).toBe('2.5');
    expect(row('sentence_length_cv').get('[data-value="ai"]').text()).toBe('2.5 – 2.5');
    expect(row('hapax_type_ratio').get('[data-value="observed"]').text()).toBe('0.000000123456');
    for (const value of wrapper.findAll('[data-value="observed"], [data-value="human"], [data-value="ai"]')) {
      expect(value.text()).not.toContain('%');
    }
  });

  it('partial 保留不可比项，区分观察值缺失与参考缺失', () => {
    const evidence = makeEvidence('partial');
    const missing = evidence.signals.find((item) => item.metric === 'paragraph_nonadjacent_jaccard_q90')!;
    missing.observed = null;
    missing.reasons.push('insufficient_observations');
    const wrapper = mountPanel(evidence);
    const observedOnly = wrapper.get('[data-metric="paragraph_adjacent_jaccard"]');
    expect(observedOnly.get('[data-value="observed"]').text()).toBe('0');
    expect(observedOnly.get('[data-value="human"]').text()).toBe('暂无可比参考');
    expect(observedOnly.get('[data-value="ai"]').text()).toBe('暂无可比参考');
    const noObservation = wrapper.get('[data-metric="paragraph_nonadjacent_jaccard_q90"]');
    expect(noObservation.get('[data-value="observed"]').text()).toBe('暂无观察值');
    expect(noObservation.get('[data-value="human"]').text()).toBe('暂无可比参考');
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
    expect(heading('sentence_length_cv')).toContain('(无量纲)');
    expect(heading('paragraph_length_cv')).toContain('(无量纲)');
    expect(heading('section_heading_count')).toContain('(个)');
  });

  it('切换中英文同步更新标题、指标、单位和基本态，无未翻译键', async () => {
    const wrapper = mountPanel();
    expect(wrapper.get('h3').text()).toBe('文本特征参考');
    expect(wrapper.get('[data-metric="transition_diversity"] h4').text()).toContain('过渡表达词表覆盖率');
    expect(wrapper.get('[data-metric="intro_conclusion_jaccard"] h4').text()).toContain('首尾段');
    wrapper.vm.setLocale('en-US');
    await nextTick();
    expect(wrapper.get('h3').text()).toBe('Text feature reference');
    expect(wrapper.findAll('summary').map((item) => item.text())).toEqual([
      'Vocabulary', 'Phrase templates', 'Sentence and paragraph rhythm', 'Discourse cohesion',
    ]);
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
    expect(wrapper.get('[data-testid="evidence-route"]').text()).toContain('not represent routing correctness probabilities or AI probabilities');
    expect(wrapper.get('[data-testid="evidence-quality"]').text()).toContain('denominator is always 22 metrics');
    expect(wrapper.get('[data-testid="evidence-quality"]').text()).toContain('not an AI probability or classification accuracy');
    expect(wrapper.get('[data-metric="mattr"] [data-testid="evidence-notice"]').text()).toContain('does not mean the main model is wrong');
    expect(wrapper.get('[data-metric="token_entropy"] [data-testid="evidence-notice"]').text()).toContain('does not establish a new source classification');
    expect(wrapper.get('summary [data-testid="dimension-notice"]').text()).toBe('Reference notice');
    for (const status of ['partial', 'insufficient', 'unsupported', 'failed'] as const) {
      await wrapper.setProps({ evidence: makeEvidence(status) });
      expect(wrapper.get('[data-testid="evidence-status"]').text()).not.toMatch(/scan\.evidence\.|[\u4e00-\u9fff]/);
    }
    wrapper.vm.setLocale('zh-CN');
    await wrapper.setProps({ evidence });
    await nextTick();
    expect(wrapper.get('h3').text()).toBe('文本特征参考');
    expect(wrapper.get('[data-metric="mattr"] [data-testid="evidence-notice"]').text()).toContain('不表示主模型判错');
    expect(wrapper.get('[data-metric="token_entropy"] [data-testid="evidence-notice"]').text()).toContain('两侧参考范围之外');
  });

  it.each([
    [0, 'insufficient', '0%', '不可比较'],
    [1, 'partial', '4.5%', '部分可比'],
    [19, 'partial', '86.4%', '部分可比'],
    [22, 'ready', '100%', '全部可比'],
  ] as const)('%i / 22 保持后端 Quality 状态及固定分母', (available, status, coverage, level) => {
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
    expect(wrapper.find('select, input').exists()).toBe(false);
    if (fallback === 'unavailable') {
      expect(wrapper.get('[data-testid="quality-reasons"]').text()).not.toContain('没有可用的参考分组');
    } else if (fallback !== 'exact') {
      expect(wrapper.get('[data-testid="quality-reasons"]').text()).toContain('参考范围已扩大');
    }
  });

  it('逐项保留 N=0/9 与两类缺失原因，不合计或改写为总样本量', () => {
    const evidence = makeEvidence('partial');
    const missing = evidence.signals.find((signal) => signal.metric === 'paragraph_adjacent_jaccard')!;
    missing.observed = null;
    missing.reasons = ['insufficient_observations', 'no_valid_source_groups'];
    const small = evidence.signals.find((signal) => signal.metric === 'paragraph_nonadjacent_jaccard_q90')!;
    small.sampleCount = 9;
    small.reasons = ['fewer_than_10_source_groups'];
    evidence.signals[0].sampleCount = 1234567;
    const wrapper = mountPanel(evidence);
    const emptyRow = wrapper.get('[data-metric="paragraph_adjacent_jaccard"]');
    expect(emptyRow.get('[data-value="sample-count"]').text()).toBe('0');
    expect(emptyRow.get('[data-testid="signal-reasons"]').text()).toContain('本次文本不足以提取');
    expect(emptyRow.get('[data-testid="signal-reasons"]').text()).toContain('没有共同有效的配对参考样本组');
    const smallRow = wrapper.get('[data-metric="paragraph_nonadjacent_jaccard_q90"]');
    expect(smallRow.get('[data-value="sample-count"]').text()).toBe('9');
    expect(smallRow.get('[data-testid="signal-reasons"]').text()).toContain('不足 10 组');
    expect(smallRow.get('[data-value="human-percentile"]').text()).toBe('暂无可比参考');
    expect(wrapper.get('[data-metric="mattr"] [data-value="sample-count"]').text()).toBe('1,234,567');
  });

  it('没有选用参考组时 N=null 不显示为 0，并保留已提取观察值', () => {
    const evidence = makeEvidence('insufficient');
    evidence.route!.fallbackLevel = 'unavailable';
    evidence.quality.reasons = ['reference_cell_unavailable'];
    for (const signal of evidence.signals) {
      signal.sampleCount = null;
      signal.reasons = ['reference_cell_unavailable'];
    }
    const wrapper = mountPanel(evidence);
    expect(wrapper.get('[data-value="sample-count"]').text()).toBe('未取得样本量');
    expect(wrapper.get('[data-value="observed"]').text()).toBe('0');
    expect(wrapper.get('[data-value="human-relation"]').text()).toBe('暂无可比参考');
    expect(wrapper.get('[data-value="coverage"]').text()).toBe('0%');
  });

  it.each([[0, 2.5], [1, 97.5]])('端点值 %s 的百分位 %s 仍直接显示后端 within', (observed, percentile) => {
    const evidence = makeEvidence();
    Object.assign(evidence.signals[0], {
      observed, humanPercentile: percentile, aiPercentile: percentile,
      referenceRanges: { human: [0, 1], ai: [0, 1] },
    });
    const wrapper = mountPanel(evidence);
    const row = wrapper.get('[data-metric="mattr"]');
    expect(row.get('[data-value="human-percentile"]').text()).toBe(String(percentile));
    expect(row.get('[data-value="ai-percentile"]').text()).toBe(String(percentile));
    expect(row.get('[data-value="human-relation"]').text()).toBe('范围内');
    expect(row.find('[data-testid="evidence-notice"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="dimension-notice"]').exists()).toBe(false);
  });

  it('舍入显示相同时仍保留后端 relation/notice，折叠标题显示中性提示', () => {
    const evidence = makeEvidence();
    Object.assign(evidence.signals.find((signal) => signal.metric === 'sentence_length_cv')!, {
      observed: 1.0000004, humanPercentile: 100, aiPercentile: 50,
      referenceRanges: { human: [0, 1], ai: [0, 2] },
      relation: { human: 'above', ai: 'within' }, notice: 'reference_mismatch',
    });
    const original = JSON.stringify(evidence);
    const wrapper = mountPanel(evidence);
    const row = wrapper.get('[data-metric="sentence_length_cv"]');
    expect(row.get('[data-value="observed"]').text()).toBe('1');
    expect(row.get('[data-value="human"]').text()).toBe('0 – 1');
    expect(row.get('[data-value="human-relation"]').text()).toBe('高于范围');
    expect(row.get('[data-value="human-percentile"]').text()).toBe('100');
    expect(row.get('[data-testid="evidence-notice"]').text()).toContain('不表示主模型判错');
    const card = wrapper.get('[data-dimension="rhythm"]');
    expect(card.attributes('open')).toBeUndefined();
    expect(card.get('summary [data-testid="dimension-notice"]').text()).toBe('有参考提示');
    expect(wrapper.findAll('[data-testid="dimension-notice"]')).toHaveLength(1);
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
    expect(wrapper.get('[data-value="quality-level"]').text()).toBe('不可用');
    expect(wrapper.get('[data-testid="quality-reasons"]').text()).toContain('无法确定');
    expect(wrapper.text()).not.toContain('暂不支持');
    await wrapper.setProps({ evidence: makeEvidence('unsupported') });
    expect(wrapper.get('[data-testid="quality-reasons"]').text()).toContain('暂不支持');
    expect(wrapper.get('[data-value="coverage"]').text()).toBe('0%');
    await wrapper.setProps({ evidence: undefined });
    expect(wrapper.find('[data-testid="evidence-quality"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="evidence-panel"]').exists()).toBe(false);
  });

  it('28 个公共原因均有独立中英文文案，不暴露原始原因码或触发英文回退', async () => {
    const reasons = {
      invalid_evidence_config: true, invalid_evidence_bundle: true, bundle_unavailable: true,
      invalid_router_response: true, invalid_text: true, invalid_main_label: true,
      feature_extraction_failed: true, comparison_failed: true, model_unavailable: true,
      model_failure: true, busy: true, timeout: true, language_undetermined: true,
      unsupported_language: true, below_minimum_length: true, fewer_than_10_sentences: true,
      excluded_content_over_40pct: true, length_out_of_range: true, reference_cell_unavailable: true,
      reference_fallback_language_length: true, reference_fallback_language: true,
      missing_observations: true, reference_metrics_unavailable: true, no_comparable_metrics: true,
      no_valid_source_groups: true, fewer_than_10_source_groups: true,
      not_applicable_for_language: true, insufficient_observations: true,
    } satisfies Record<EvidenceReason, true>;
    const codes = Object.keys(reasons) as EvidenceReason[];
    const evidence = makeEvidence('failed');
    evidence.quality.reasons = codes;
    const wrapper = mountPanel(evidence);
    const messages = () => wrapper.get('[data-testid="quality-reasons"]').findAll('li').map((item) => item.text());
    expect(messages()).toHaveLength(28);
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
