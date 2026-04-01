import { describe, expect, it } from 'vitest';

import { buildHeroLandingPreview } from './heroPreview';
import { getFallbackHeroExamples } from './usageExamples';

const zhCopy = {
  scoreLabel: '风险预估',
  scorePendingLabel: '正式判断',
  highRisk: '优先复核',
  review: '建议复核',
  stable: '低风险',
  empty: '等待输入',
  pending: '待扫描',
  previewOnly: '草稿预览',
  ready: '草稿已就绪',
  typing: '继续补充内容可获得更稳定的判断',
  scanRequired: '点击扫描获取正式判断',
  previewSubtitleEmpty: '输入一段文本后再生成预览。',
  previewSubtitleDraft: '当前仅展示草稿预览，正式判断需点击扫描。',
  previewSubtitleExample: '当前展示范例预设快照，不代表实时检测结果。',
  queueSubtitleEmpty: '输入文本后，这里会显示预览片段。',
  queueSubtitleDraft: '这里只展示片段预览，正式风险判断需点击扫描。',
  queueSubtitleExample: '这里展示范例中的代表性片段与预设标签。',
  queueEmptyLabel: '等待文本',
  queuePreviewLabel: '片段预览',
  queueExampleLabel: '示例片段',
  snapshotHint: '点击开始扫描后，正式风险分布会出现在这里。',
  signals: {
    structure: '结构密度',
    rhythm: '语言节奏',
    action: '处理建议',
    awaitingDescription: '输入文本后再生成状态快照',
    previewOnly: '预览中',
    notScored: '未正式判断',
    previewDescription: '当前仅展示预览，不代表正式检测结果',
    exampleSnapshot: '示例快照',
    exampleDescription: '当前展示的是范例预设快照',
    actionPending: '点击扫描',
    actionPendingDescription: '进入工作台后开始正式检测',
    ai: 'AI 痕迹',
    mixed: '改写痕迹',
    human: '人工细节',
    emptyLine: '输入文本后，这里会显示优先复核的句段。',
    badges: {
      high: '高风险',
      medium: '复核',
      low: '稳定',
    },
  },
};

describe('heroPreview utils', () => {
  it('空文本不再伪造 46% 风险', () => {
    const output = buildHeroLandingPreview({
      text: '',
      selectedExampleKey: '',
      examples: getFallbackHeroExamples('zh-CN'),
      locale: 'zh-CN',
      copy: zhCopy,
    });

    expect(output.mode).toBe('empty');
    expect(output.scoreDisplay).toBe('--');
    expect(output.hasQuantitativeSnapshot).toBe(false);
    expect(output.badge).toBe('等待输入');
  });

  it('范例优先使用预设快照而不是长度公式', () => {
    const examples = getFallbackHeroExamples('zh-CN');

    const chatgptOutput = buildHeroLandingPreview({
      text: examples.find((item) => item.key === 'chatgpt')?.content || '',
      selectedExampleKey: 'chatgpt',
      examples,
      locale: 'zh-CN',
      copy: zhCopy,
    });
    const humanOutput = buildHeroLandingPreview({
      text: examples.find((item) => item.key === 'human')?.content || '',
      selectedExampleKey: 'human',
      examples,
      locale: 'zh-CN',
      copy: zhCopy,
    });

    expect(chatgptOutput.mode).toBe('example');
    expect(chatgptOutput.ai).toBeGreaterThan(humanOutput.ai);
    expect(chatgptOutput.ai).toBe(88);
    expect(humanOutput.ai).toBe(14);
    expect(chatgptOutput.hasQuantitativeSnapshot).toBe(true);
  });

  it('普通输入只显示中性预览，不贴伪高风险标签', () => {
    const output = buildHeroLandingPreview({
      text: '这是第一段。\n\n这是第二段，用来观察预览片段。',
      selectedExampleKey: '',
      examples: getFallbackHeroExamples('zh-CN'),
      locale: 'zh-CN',
      copy: zhCopy,
    });

    expect(output.mode).toBe('draft');
    expect(output.scoreDisplay).toBe('--');
    expect(output.hasQuantitativeSnapshot).toBe(false);
    expect(output.snippets.every((item) => item.badge === '待扫描')).toBe(true);
  });
});
