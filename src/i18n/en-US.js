export default {
  common: {
    brand: 'Veritascribe',
    dashboard: 'Dashboard',
    login: 'Log In',
    register: 'Sign Up',
    openMenu: 'Open menu',
    logout: 'Log Out',
    contactUs: 'Contact Us',
    accountDetails: 'Account Details',
    welcome: 'Welcome, {name}',
    getStarted: 'Get started',
    choosePlan: 'Choose Plan',
    scheduleDemo: 'Schedule Demo',
    teamPlans: 'Team Plans',
    apiPlans: 'API Plans',
    educationBadge: 'New for Educators',
    freePlan: 'Free Plan',
    language: 'Language',
  },
  languages: {
    en: 'English',
    zh: '中文（简体）',
  },
  header: {
    nav: {
      capabilities: 'Capabilities',
      workflow: 'Workflow',
      showcase: 'Showcase',
      pricing: 'Pricing',
    },
    buttons: {
      openDashboard: 'Open Dashboard',
      dashboard: 'Dashboard',
      login: 'Log In',
      register: 'Sign Up',
      mobileDashboard: 'Open Dashboard',
      logout: 'Log Out',
    },
    user: {
      plan: 'Personal Plan · Free',
    },
    mobile: {
      prompt: 'Drag TXT / DOCX / PDF files into the editor to import automatically.',
    },
  },
  hero: {
    title: 'Detect AI-generated content with RepreGuard',
    subtitle:
      'Identify, score, and explain AI-written passages across documents, assignments, and creative drafts.',
    primary: 'Start scanning',
    secondary: 'View pricing',
    stats: {
      accuracy: 'Model accuracy benchmarked across GPT, Claude, and Gemini outputs.',
      turnaround: 'Real-time scoring and highlighted explanations.',
      universities: 'Trusted by universities worldwide.',
    },
  },
  trust: {
    title: 'Trusted by compliance and security teams',
    items: ['SOC 2 certified', 'FERPA-aligned data handling', 'GDPR ready', 'Data encrypted at rest'],
  },
  capabilities: {
    title: 'Capabilities that go beyond detection',
    description: 'Guide writers with transparent AI probabilities, source attributions, and content policies.',
    items: [
      {
        title: 'Mixed-model AI detection',
        description: 'Blend multiple detectors to lower false positives with transparent scores.',
      },
      {
        title: 'Content safety checks',
        description: 'Flag hallucinations, policy violations, and risky claims automatically.',
      },
      {
        title: 'Plagiarism and citations',
        description: 'Scan for copied passages and missing citations side by side.',
      },
      {
        title: 'Writing insights',
        description: 'Return human-readable feedback for clarity, tone, and originality.',
      },
    ],
  },
  workflow: {
    title: 'How teams review AI content',
    steps: [
      {
        title: 'Import any file',
        description: 'Drag TXT, DOCX, or PDF files to begin scanning instantly.',
      },
      {
        title: 'Review flagged areas',
        description: 'Check heatmaps, probability scores, and suggested citations.',
      },
      {
        title: 'Share reports',
        description: 'Export clean reports for students, writers, or compliance.',
      },
    ],
  },
  showcase: {
    title: 'Built for classrooms and publishers',
    cards: [
      {
        title: 'Higher education',
        description: 'Keep academic integrity with transparent AI scoring.',
      },
      {
        title: 'Newsrooms',
        description: 'Check sourcing and originality before publishing.',
      },
      {
        title: 'Enterprises',
        description: 'Meet compliance requirements with auditable reports.',
      },
    ],
  },
  testimonials: {
    title: 'Teams stay confident with RepreGuard',
    quote:
      'RepreGuard reduces our AI false positive rate while giving reviewers clear, actionable explanations.',
    author: 'Director of Academic Integrity, US University',
  },
  pricingPreview: {
    title: 'Simple pricing to start detecting today',
    subtitle: 'Choose the plan that matches your review volume.',
    cta: 'View full pricing',
  },
  cta: {
    title: 'Ready to scan your next document?',
    subtitle: 'Detect AI-generated text, flag risks, and export transparent reports.',
    button: 'Start scanning',
  },
  footer: {
    links: ['Product', 'Security', 'Support', 'Status', 'Documentation'],
    copyright: '© 2024 RepreGuard. All rights reserved.',
  },
  pricingPage: {
    statusBanner: {
      onPlan: "You're on a {plan}.",
      limit: 'You have access to 10,000 words a month.',
      close: 'Close banner',
    },
    hero: {
      title: 'Words that matter start with the right plan.',
      subtitle: 'Choose the AI detection workflow that matches your team size and compliance requirements.',
    },
    billing: {
      annual: 'Annual (Save 45%)',
      monthly: 'Monthly',
    },
    plans: {
      free: {
        name: 'FREE',
        description: 'Essential RepreGuard safeguards for individuals testing AI content.',
        limit: '10,000 words per month',
        features: ['Basic AI Scan', '5 Free Advanced Scans'],
      },
      essential: {
        name: 'ESSENTIAL',
        description: 'Expanded detection muscle with RepreGuard mixed-model comparisons.',
        limit: '150,000 words per month',
        features: [
          'Basic AI Scan',
          'Up to 150,000 words per month',
          'Premium AI detection models',
          'Plagiarism scanning',
          'Advanced Grammar and Writing feedback',
        ],
      },
      premium: {
        name: 'PREMIUM',
        description: 'Our most popular toolkit powered by RepreGuard deep scan layers.',
        limit: '300,000 words per month',
        features: [
          'Everything in Essential',
          'Up to 300,000 words per month',
          'AI watermarking detection',
          'Advanced source corroboration',
          'Citation assistant and writing feedback',
        ],
      },
      enterprise: {
        name: 'ENTERPRISE',
        description: 'Custom detection, policy enforcement, and integrations for teams.',
        limit: 'Custom volume and compliance controls',
        features: [
          'SSO/SAML',
          'Admin analytics dashboards',
          'Custom AI model evaluation',
          'API & LMS integrations',
          'Dedicated success manager',
        ],
      },
    },
    badges: {
      bestValue: 'Most Popular',
    },
    periods: {
      month: 'month',
      year: 'year',
    },
    table: {
      title: 'Compare Plans',
      subtitle: 'See which RepreGuard-powered toolkit fits your workflow.',
      feature: 'Feature',
      sections: [
        {
          name: 'Detection',
          rows: [
            'Basic AI Scan',
            'Advanced Scan',
            'AI watermarking detection',
            'Multiple detection models',
            'Bulk scanning',
          ],
        },
        {
          name: 'Collaboration',
          rows: ['Report export', 'Commenting', 'Team seats'],
        },
        {
          name: 'Support',
          rows: ['Email support', 'Dedicated success manager'],
        },
      ],
    },
    cards: {
      teams: {
        title: 'Teams Plans',
        badge: 'BEST FOR SCHOOLS',
        description: 'Purchase multiple plans for your organization.',
        price: 'Starting at $24.99 / user / month',
        actions: {
          schedule: 'Schedule Demo',
          open: 'Team Plans',
        },
      },
      api: {
        title: 'API Plans',
        description: 'View our API plans, which allow you to integrate RepreGuard with your organization’s software.',
        actions: {
          schedule: 'Schedule Demo',
          open: 'API Plans',
        },
      },
    },
  },
  scan: {
    nav: {
      home: 'Home',
      document: 'Document',
      history: 'History',
      new: 'New',
      settings: 'Settings',
      qa: 'Q&A',
      newScan: 'New scan',
      multiUpload: 'Bulk upload',
    },
    sidebarTip: 'Drag TXT / DOCX / PDF files into the editor to import automatically.',
    welcome: {
      title: 'Welcome, {name}',
      plan: '{plan} Plan',
      quotes: [
        'Quality feedback builds trust faster than strict scoring.',
        'Explain the why behind every AI probability.',
        'Flag the risk and provide a remediation path.',
      ],
    },
    quickLaunch: {
      badge: 'Quick launch',
      title: 'New scan',
      description: 'Have text ready? Jump back into the editor to start a RepreGuard check.',
    },
    features: {
      title: 'Feature Capsules',
      subtitle: 'Tap to learn more',
      cards: [
        { title: 'Plagiarism scan', subtitle: 'Cross-checks academic sources.', tag: 'New' },
        { title: 'AI explainability', subtitle: 'Rationales for probability scores.', tag: 'Beta' },
        { title: 'Writing coach', subtitle: 'Actionable writing suggestions.' },
        { title: 'Policy checks', subtitle: 'Maps content to custom policies.' },
      ],
    },
    educator: {
      badge: 'New for Educators',
      title: 'New for Educators',
      description: 'Our AI scoring assistant helps teachers deliver consistent feedback while staying in control.',
      cta: 'Get started',
    },
    integrations: {
      title: 'More ways to scan...',
      buttons: [
        { label: 'Google Docs Add-on' },
        { label: 'Export report' },
        { label: 'Share to LMS' },
        { label: 'Download CSV' },
      ],
    },
  },
  auth: {
    login: {
      title: 'Welcome back',
      subtitle: 'Sign in to use detection, rewriting, translation, and more.',
      identifier: 'Email or username',
      placeholder: 'test or name@company.com',
      password: 'Password',
      passwordPlaceholder: 'At least 8 characters',
      submit: 'Log in and start detecting',
      noAccount: "Don't have an account?",
      register: 'Sign up now',
      errors: {
        missing: 'Please enter your account and password.',
        failed: 'Login failed, please try again later.',
      },
    },
    register: {
      title: 'Create your account',
      subtitle: 'Register to unlock full AI detection capabilities.',
      email: 'Email',
      name: 'Full name',
      password: 'Password',
      confirm: 'Confirm password',
      placeholderEmail: 'name@company.com',
      placeholderName: 'Your name',
      placeholderPassword: 'At least 8 characters',
      submit: 'Create account',
      haveAccount: 'Already have an account?',
      login: 'Log in',
      errors: {
        missing: 'Please fill in all fields.',
        failed: 'Registration failed, please try again.',
      },
    },
  },
};
