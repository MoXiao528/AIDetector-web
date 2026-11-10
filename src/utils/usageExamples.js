import detectionExamples from '../data/detectionExamples.json';

const aiSample = detectionExamples.find((example) => example.key === 'chatgpt').text;
const humanSample = detectionExamples.find((example) => example.key === 'human').text;

export const fallbackHeroExamplesByLocale = {
  'zh-CN': [
    {
      key: 'chatgpt',
      label: 'AI',
      description: '为展示写作特点专门生成的 AI 文本，结果以实际检测为准。',
      content: aiSample,
    },
    {
      key: 'human',
      label: '人工写作',
      description: '鲁迅《故乡》原文节选',
      content: humanSample,
    },
    {
      key: 'hybrid',
      label: 'AI + 人工',
      description: '先由 AI 起草，再由人工补足证据和风格。',
      content:
        '初始提纲由 AI 助手生成，但我重新撰写了每一段内容，补入最近期刊的引用，并按学院写作规范把语气调整得更克制、更正式。',
      ai: 56,
      human: 44,
      snapshot: 'AI 起草后人工重写',
      snippet:
        '初始提纲由 AI 助手生成，但我重新撰写了每一段内容，补入最近期刊的引用，并按学院写作规范把语气调整得更克制、更正式。',
      structure: '偏规整',
      rhythm: '存在拼接感',
      action: '建议复核',
    },
    {
      key: 'polished',
      label: '规整改写',
      description: '经过润色后更平滑、更整齐的版本。',
      content:
        '完成初稿后，我重新整理了段落结构并压缩了重复表述，结果虽然更规整，但也让文本显得过于平均和顺滑。',
      ai: 64,
      human: 36,
      snapshot: '规整改写版本',
      snippet:
        '完成初稿后，我重新整理了段落结构并压缩了重复表述，结果虽然更规整，但也让文本显得过于平均和顺滑。',
      structure: '平滑偏强',
      rhythm: '人工细节偏少',
      action: '建议复核',
    },
  ],
  'en-US': [
    {
      key: 'chatgpt',
      label: 'AI',
      description: 'Chinese AI text generated to demonstrate writing characteristics. Run detection for results.',
      content: aiSample,
    },
    {
      key: 'human',
      label: 'Human',
      description: 'Lu Xun, “My Old Home” — excerpt in the original Chinese.',
      content: humanSample,
    },
    {
      key: 'hybrid',
      label: 'AI + Human',
      description: 'AI drafted first, then a human revised for evidence and voice.',
      content:
        'The initial outline was produced by an AI assistant, but I rewrote each paragraph to weave in citations from recent journals and to adjust the tone to match our faculty guidelines.',
      ai: 56,
      human: 44,
      snapshot: 'AI draft with human revision',
      snippet:
        'The initial outline was produced by an AI assistant, but I rewrote each paragraph to weave in citations from recent journals and to adjust the tone to match our faculty guidelines.',
      structure: 'Moderately regular',
      rhythm: 'Some stitched phrasing',
      action: 'Needs review',
    },
    {
      key: 'polished',
      label: 'Structured rewrite',
      description: 'A passage smoothed into a more uniformly rewritten version.',
      content:
        'After revising the draft, I compressed repeated points and smoothed the transitions; the result reads more uniform, but also less grounded and more mechanically balanced.',
      ai: 64,
      human: 36,
      snapshot: 'Smoothed rewrite',
      snippet:
        'After revising the draft, I compressed repeated points and smoothed the transitions; the result reads more uniform, but also less grounded and more mechanically balanced.',
      structure: 'Over-smoothed',
      rhythm: 'Low human detail',
      action: 'Needs review',
    },
  ],
};

export const fallbackUsageExamplesByLocale = {
  'zh-CN': [
    {
      key: 'thesis',
      title: '教育心理学论文段落',
      docType: 'Academic',
      length: '1200 words',
      description: '研究生论文中关于课堂互动的论证段落，包含引用与方法说明。',
      ai: 22,
      human: 78,
      snapshot: '章节摘要 + 标色句段',
      snippet:
        '本研究通过对 46 份课堂观察记录进行扎根理论编码，进一步提炼出互动质量指标与学生自我效能之间的非线性关系。',
      content:
        '本研究通过对 46 份课堂观察记录进行扎根理论编码，进一步提炼出互动质量指标与学生自我效能之间的非线性关系，并结合访谈材料验证教师反馈在其中的调节作用。',
    },
    {
      key: 'marketing',
      title: '品牌营销落地页',
      docType: 'Marketing',
      length: '780 words',
      description: '面向高校的 AI 评分助手推广页，突出效率提升与团队协作。',
      ai: 35,
      human: 65,
      snapshot: 'AI 概率分布 + CTA 建议',
      snippet:
        '我们为教师提供统一的反馈模板与语气库，让跨课程的评分标准更加一致，同时保留个性化的书写空间。',
      content:
        '我们为教师提供统一的反馈模板与语气库，让跨课程的评分标准更加一致，同时保留个性化的书写空间，并通过协作看板帮助教学团队同步处理高风险作业。',
    },
    {
      key: 'technical',
      title: '技术设计文档',
      docType: 'Technical',
      length: '6 pages',
      description: '数据清洗流水线的设计提案，包含风险提示与性能指标。',
      ai: 18,
      human: 82,
      snapshot: '风险提示 + 改写建议',
      snippet:
        '为避免批量检测阻塞，我们将文件分片上传并行处理，并在队列服务中设置退避重试策略以稳定延迟。',
      content:
        '为避免批量检测阻塞，我们将文件分片上传并行处理，并在队列服务中设置退避重试策略以稳定延迟；同时通过优先级队列隔离长文档任务，降低峰值抖动。',
    },
  ],
  'en-US': [
    {
      key: 'thesis',
      title: 'Educational psychology thesis excerpt',
      docType: 'Academic',
      length: '1200 words',
      description: 'A graduate thesis passage about classroom interaction with citations and method notes.',
      ai: 22,
      human: 78,
      snapshot: 'Section summary + highlighted sentences',
      snippet:
        'This study coded 46 classroom observation records with grounded theory to surface the nonlinear relationship between interaction quality and student self-efficacy.',
      content:
        'This study coded 46 classroom observation records with grounded theory to surface the nonlinear relationship between interaction quality and student self-efficacy, then validated the moderating role of teacher feedback with interview evidence.',
    },
    {
      key: 'marketing',
      title: 'Brand landing page copy',
      docType: 'Marketing',
      length: '780 words',
      description: 'A landing page for an AI grading assistant aimed at universities.',
      ai: 35,
      human: 65,
      snapshot: 'AI distribution + CTA guidance',
      snippet:
        'We give instructors shared feedback templates and tone libraries so grading standards stay aligned across courses without flattening individual teaching styles.',
      content:
        'We give instructors shared feedback templates and tone libraries so grading standards stay aligned across courses without flattening individual teaching styles, while a collaborative review board helps teams triage high-risk submissions faster.',
    },
    {
      key: 'technical',
      title: 'Technical design document',
      docType: 'Technical',
      length: '6 pages',
      description: 'A data-cleaning pipeline proposal with risk controls and performance targets.',
      ai: 18,
      human: 82,
      snapshot: 'Risk flags + rewrite guidance',
      snippet:
        'To prevent batch scans from stalling, we upload file shards in parallel and apply exponential backoff in the queue service to stabilize latency.',
      content:
        'To prevent batch scans from stalling, we upload file shards in parallel and apply exponential backoff in the queue service to stabilize latency, while a priority lane isolates oversized document jobs during traffic spikes.',
    },
  ],
};

export const getFallbackHeroExamples = (locale = 'zh-CN') =>
  (fallbackHeroExamplesByLocale[locale] || fallbackHeroExamplesByLocale['en-US'])
    .filter((example) => example.key === 'chatgpt' || example.key === 'human');

export const getFallbackUsageExamples = (locale = 'zh-CN') =>
  fallbackUsageExamplesByLocale[locale] || fallbackUsageExamplesByLocale['en-US'];

export const usageExamples = getFallbackUsageExamples('zh-CN');
