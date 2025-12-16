export default {
  common: {
    brand: 'Veritascribe',
    dashboard: 'Dashboard',
    login: '登录',
    register: '注册',
    openMenu: '打开菜单',
    logout: '退出登录',
    contactUs: '联系我们',
    accountDetails: '账号详情',
    welcome: '欢迎，{name}',
    getStarted: '立即开始',
    choosePlan: '选择方案',
    scheduleDemo: '预约演示',
    teamPlans: '团队方案',
    apiPlans: 'API 方案',
    educationBadge: '教育版更新',
    freePlan: '免费方案',
    language: '语言',
  },
  languages: {
    en: 'English',
    zh: '中文（简体）',
  },
  header: {
    nav: {
      capabilities: '功能概览',
      workflow: '工作流',
      showcase: '行业案例',
      pricing: '定价',
    },
    buttons: {
      openDashboard: '打开 Dashboard',
      dashboard: 'Dashboard',
      login: '登录',
      register: '注册',
      mobileDashboard: '打开 Dashboard',
      logout: '退出登录',
    },
    user: {
      plan: 'Personal Plan · Free',
    },
    mobile: {
      prompt: '拖拽 TXT / DOCX / PDF 等文件到编辑区即可自动读取。',
    },
  },
  hero: {
    title: '使用 RepreGuard 检测 AI 生成内容',
    subtitle: '跨文档、作业、创意稿件识别、评分并解释 AI 文本。',
    primary: '开始检测',
    secondary: '查看定价',
    stats: {
      accuracy: '在 GPT、Claude、Gemini 输出上验证准确度。',
      turnaround: '实时评分并高亮解释。',
      universities: '获得全球高校信任。',
    },
  },
  trust: {
    title: '合规与安全团队的选择',
    items: ['SOC 2 认证', '符合 FERPA 的数据处理', 'GDPR 就绪', '静态加密'],
  },
  capabilities: {
    title: '不仅是检测的能力',
    description: '用透明的 AI 概率、来源标注和内容策略指导写作者。',
    items: [
      {
        title: '多模型检测',
        description: '融合多种检测器以降低误判，并给出透明分数。',
      },
      {
        title: '内容安全检查',
        description: '自动标注幻觉、策略违规与风险表述。',
      },
      {
        title: '查重与引用',
        description: '并行扫描抄袭段落与缺失引用。',
      },
      {
        title: '写作洞察',
        description: '输出可读的清晰度、语气与原创性反馈。',
      },
    ],
  },
  workflow: {
    title: '团队审阅 AI 文本的方式',
    steps: [
      {
        title: '导入任意文件',
        description: '拖拽 TXT/DOCX/PDF 即刻开始检测。',
      },
      {
        title: '查看标注区域',
        description: '检查热力图、概率分数与引用建议。',
      },
      {
        title: '分享报告',
        description: '导出给学生、作者或合规团队的清晰报告。',
      },
    ],
  },
  showcase: {
    title: '为课堂与出版而生',
    cards: [
      {
        title: '高等教育',
        description: '以透明评分守护学术诚信。',
      },
      {
        title: '新闻编辑部',
        description: '发布前检查来源与原创性。',
      },
      {
        title: '企业',
        description: '以可审计报告满足合规需求。',
      },
    ],
  },
  testimonials: {
    title: '团队因 RepreGuard 更有信心',
    quote: 'RepreGuard 降低了我们的误判率，同时提供清晰可执行的解释。',
    author: '美国某大学学术诚信负责人',
  },
  pricingPreview: {
    title: '简单定价，立即开始检测',
    subtitle: '根据检测量选择合适方案。',
    cta: '查看完整定价',
  },
  cta: {
    title: '准备好检测下一份文档了吗？',
    subtitle: '检测 AI 文本、标记风险并导出透明报告。',
    button: '开始检测',
  },
  footer: {
    links: ['产品', '安全', '支持', '状态', '文档'],
    copyright: '© 2024 RepreGuard. 保留所有权利。',
  },
  pricingPage: {
    statusBanner: {
      onPlan: '你正在使用 {plan}。',
      limit: '每月可用 10,000 个字。',
      close: '关闭提示',
    },
    hero: {
      title: '重要的文字从合适的方案开始。',
      subtitle: '选择适配团队规模和合规需求的 AI 检测流程。',
    },
    billing: {
      annual: '年付（立省 45%）',
      monthly: '月付',
    },
    plans: {
      free: {
        name: 'FREE',
        description: '适合个人测试 AI 内容的基础防护。',
        limit: '每月 10,000 字',
        features: ['基础 AI 检测', '5 次高级扫描'],
      },
      essential: {
        name: 'ESSENTIAL',
        description: '通过多模型对比获得更强检测能力。',
        limit: '每月 150,000 字',
        features: ['基础 AI 检测', '每月 150,000 字', '高级检测模型', '查重扫描', '高级语法和写作反馈'],
      },
      premium: {
        name: 'PREMIUM',
        description: '最受欢迎的深度检测工具包。',
        limit: '每月 300,000 字',
        features: ['包含 Essential 全部功能', '每月 300,000 字', 'AI 水印检测', '高级来源佐证', '引用助手与写作反馈'],
      },
      enterprise: {
        name: 'ENTERPRISE',
        description: '面向团队的自定义检测、策略执行与集成。',
        limit: '自定义字量与合规控制',
        features: ['SSO/SAML', '管理员分析面板', '自定义模型评估', 'API 与 LMS 集成', '专属客户成功'],
      },
    },
    badges: {
      bestValue: '最受欢迎',
    },
    periods: {
      month: '月',
      year: '年',
    },
    table: {
      title: '方案对比',
      subtitle: '找到最契合你流程的 RepreGuard 工具包。',
      feature: '功能',
      sections: [
        {
          name: '检测',
          rows: ['基础 AI 检测', '高级检测', 'AI 水印检测', '多模型检测', '批量扫描'],
        },
        {
          name: '协作',
          rows: ['报告导出', '评论', '团队席位'],
        },
        {
          name: '支持',
          rows: ['邮件支持', '专属客户成功'],
        },
      ],
    },
    cards: {
      teams: {
        title: '团队方案',
        badge: '院校推荐',
        description: '为组织批量购买方案。',
        price: '起价 $24.99 / 用户 / 月',
        actions: {
          schedule: '预约演示',
          open: '团队方案',
        },
      },
      api: {
        title: 'API 方案',
        description: '查看可将 RepreGuard 集成到组织软件的 API 方案。',
        actions: {
          schedule: '预约演示',
          open: 'API 方案',
        },
      },
    },
  },
  scan: {
    nav: {
      home: '首页',
      document: '文档',
      history: '历史',
      new: '新建',
      settings: '设置',
      qa: '问答',
      newScan: '新建扫描',
      multiUpload: '批量上传',
    },
    sidebarTip: '拖拽 TXT / DOCX / PDF 等文件到编辑区即可自动读取。',
    welcome: {
      title: '欢迎，{name}',
      plan: '{plan} 方案',
      quotes: ['高质量反馈比严苛评分更快建立信任。', '解释每个 AI 概率背后的原因。', '标记风险并提供改进路径。'],
    },
    quickLaunch: {
      badge: '快速开始',
      title: '新建扫描',
      description: '准备好文本？返回编辑器立即开始 RepreGuard 检测。',
    },
    features: {
      title: '功能胶囊',
      subtitle: '点击了解更多',
      cards: [
        { title: '查重扫描', subtitle: '交叉对比学术来源。', tag: '新' },
        { title: 'AI 可解释性', subtitle: '展示概率评分的理由。', tag: '测试版' },
        { title: '写作教练', subtitle: '提供可执行的写作建议。' },
        { title: '策略校验', subtitle: '映射内容到自定义策略。' },
      ],
    },
    educator: {
      badge: '教育版更新',
      title: '教育版更新',
      description: '我们的 AI 评分助手帮助教师在掌控下提供一致反馈。',
      cta: '立即开始',
    },
    integrations: {
      title: '更多扫描方式…',
      buttons: [
        { label: 'Google Docs 插件' },
        { label: '导出报告' },
        { label: '分享至 LMS' },
        { label: '下载 CSV' },
      ],
    },
  },
  auth: {
    login: {
      title: '欢迎回来',
      subtitle: '登录后即可使用检测、润色、翻译等全部功能。',
      identifier: '邮箱或用户名',
      placeholder: 'test 或 name@company.com',
      password: '密码',
      passwordPlaceholder: '至少 8 位字符',
      submit: '登录并进入识别页面',
      noAccount: '还没有账号？',
      register: '立即注册',
      errors: {
        missing: '请填写账号和密码。',
        failed: '登录失败，请稍后再试。',
      },
    },
    register: {
      title: '创建你的账号',
      subtitle: '注册以解锁完整的 AI 检测能力。',
      email: '邮箱',
      name: '姓名',
      password: '密码',
      confirm: '确认密码',
      placeholderEmail: 'name@company.com',
      placeholderName: '你的姓名',
      placeholderPassword: '至少 8 位字符',
      submit: '创建账号',
      haveAccount: '已经有账号？',
      login: '去登录',
      errors: {
        missing: '请填写所有字段。',
        failed: '注册失败，请稍后再试。',
      },
    },
  },
};
