<template>
  <div class="min-h-screen bg-slate-950 text-white">
    <AppHeader />
    <main class="pb-24">
      <section class="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 pb-24 pt-20">
        <div class="absolute inset-0 -z-10 opacity-60">
          <div class="absolute left-1/4 top-10 h-60 w-60 rounded-full bg-primary-500/30 blur-3xl"></div>
          <div class="absolute right-1/4 bottom-0 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl"></div>
        </div>
        <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col justify-between gap-10 lg:flex-row lg:items-center">
            <div class="max-w-3xl space-y-6">
              <div class="inline-flex items-center space-x-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/60">
                <span class="flex h-2 w-2 rounded-full bg-emerald-400"></span>
                <span>实时检测工作台</span>
              </div>
              <h1 class="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                集成检测、润色、翻译于一体的 <span class="text-primary-300">GPTZero 级别仪表盘</span>
              </h1>
              <p class="text-base leading-relaxed text-white/70">
                在同一视图中完成 AI 痕迹检测、写作润色、跨语言翻译与引用校验。所有分析保存在安全的团队空间内，适用于高校、媒体与企业合规场景。
              </p>
              <div class="flex flex-wrap gap-3 text-xs text-white/50">
                <span class="inline-flex items-center space-x-2 rounded-full border border-white/10 px-3 py-1">
                  <SparklesIcon class="h-4 w-4 text-primary-200" />
                  <span>段落级风险热力图</span>
                </span>
                <span class="inline-flex items-center space-x-2 rounded-full border border-white/10 px-3 py-1">
                  <ShieldCheckIcon class="h-4 w-4 text-primary-200" />
                  <span>团队权限控制</span>
                </span>
                <span class="inline-flex items-center space-x-2 rounded-full border border-white/10 px-3 py-1">
                  <GlobeAltIcon class="h-4 w-4 text-primary-200" />
                  <span>支持 32 种语言</span>
                </span>
              </div>
            </div>
            <div class="w-full max-w-sm rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
              <div class="space-y-4">
                <h2 class="text-sm font-semibold uppercase tracking-widest text-white/70">团队概览</h2>
                <div class="space-y-3 text-sm text-white/70">
                  <div class="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                    <div>
                      <p class="text-xs text-white/50">本周扫描文档</p>
                      <p class="mt-1 text-2xl font-semibold text-white">128</p>
                    </div>
                    <span class="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">+18%</span>
                  </div>
                  <div class="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                    <div>
                      <p class="text-xs text-white/50">疑似 AI 段落</p>
                      <p class="mt-1 text-2xl font-semibold text-white">46</p>
                    </div>
                    <span class="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">重点复核</span>
                  </div>
                  <div class="rounded-2xl bg-white/5 p-4">
                    <p class="text-xs text-white/50">最近报告</p>
                    <ul class="mt-3 space-y-2 text-xs">
                      <li v-for="report in recentReports" :key="report.title" class="flex items-center justify-between">
                        <span class="truncate">{{ report.title }}</span>
                        <span class="text-white/40">{{ report.time }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="-mt-16 rounded-t-[3rem] bg-white px-4 pb-20 pt-24 text-slate-900 shadow-[0_-40px_80px_-50px_rgba(15,23,42,0.65)] sm:px-6 lg:px-8">
        <div class="mx-auto max-w-6xl">
          <div class="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 class="text-2xl font-semibold text-slate-900">快速开始</h2>
              <p class="mt-2 text-sm text-slate-600">选择一个任务，即可在仪表盘中体验与 GPTZero 类似的检测与润色流程。</p>
            </div>
            <div class="flex items-center gap-2 text-xs text-slate-500">
              <span class="inline-flex items-center space-x-1 rounded-full border border-slate-200 px-3 py-1">
                <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
                <span>登录后可执行</span>
              </span>
              <span class="inline-flex items-center space-x-1 rounded-full border border-slate-200 px-3 py-1">
                <span class="h-2 w-2 rounded-full bg-primary-500"></span>
                <span>推荐任务</span>
              </span>
            </div>
          </div>
          <div class="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <article
              v-for="feature in featureCards"
              :key="feature.key"
              :class="[
                'group relative flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_24px_45px_-24px_rgba(15,23,42,0.35)] transition',
                focusedFeature === feature.key ? 'border-primary-300 ring-2 ring-primary-100' : 'hover:-translate-y-1 hover:border-primary-200',
              ]"
            >
              <div>
                <span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
                  {{ feature.tag }}
                </span>
                <h3 class="mt-4 text-xl font-semibold text-slate-900">{{ feature.title }}</h3>
                <p class="mt-2 text-sm text-slate-600">{{ feature.description }}</p>
                <ul class="mt-4 space-y-2 text-xs text-slate-500">
                  <li v-for="bullet in feature.bullets" :key="bullet" class="flex items-center space-x-2">
                    <svg class="h-3.5 w-3.5 text-primary-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{{ bullet }}</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                class="mt-6 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                @click="handleFeature(feature)"
              >
                {{ feature.cta }}
                <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </article>
          </div>
        </div>
      </section>

      <section class="bg-slate-50 py-20 text-slate-900">
        <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div class="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div class="space-y-6">
              <h2 class="text-2xl font-semibold text-slate-900">智能报告中心</h2>
              <p class="text-sm text-slate-600">
                针对每次扫描，我们会保留可追溯的检测记录，包括段落风险分布、AI 痕迹解释、语气建议以及参考引用提醒，方便团队复核与导出。
              </p>
              <div class="space-y-4">
                <div v-for="insight in insightCards" :key="insight.title" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <component :is="insight.icon" class="h-5 w-5 text-primary-500" />
                      <h3 class="text-base font-semibold text-slate-900">{{ insight.title }}</h3>
                    </div>
                    <span class="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">{{ insight.badge }}</span>
                  </div>
                  <p class="mt-3 text-sm text-slate-600">{{ insight.description }}</p>
                </div>
              </div>
            </div>
            <div class="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
              <div>
                <h3 class="text-base font-semibold text-slate-900">使用建议</h3>
                <ul class="mt-4 space-y-3 text-sm text-slate-600">
                  <li class="flex items-start space-x-3">
                    <span class="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-600">1</span>
                    <span>上传原始文档或直接粘贴文本，系统会自动保留段落结构。</span>
                  </li>
                  <li class="flex items-start space-x-3">
                    <span class="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-600">2</span>
                    <span>点击扫描后可查看风险热力图、AI 概率与引用提醒，支持导出为 PDF。</span>
                  </li>
                  <li class="flex items-start space-x-3">
                    <span class="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-600">3</span>
                    <span>需要润色或翻译时，可一键切换至对应工具，保留上下文与历史记录。</span>
                  </li>
                </ul>
              </div>
              <button
                type="button"
                class="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-primary-500"
                @click="handleFeature(primaryAction)"
              >
                开始扫描文本
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
    <AppFooter />
    <LoginPromptModal :open="showLoginModal" :message="loginMessage" @close="showLoginModal = false" />
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { GlobeAltIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/vue/24/outline';
import AppHeader from '../sections/AppHeader.vue';
import AppFooter from '../sections/AppFooter.vue';
import LoginPromptModal from '../components/common/LoginPromptModal.vue';
import { useAuthStore } from '../store/auth';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const showLoginModal = ref(false);
const loginMessage = ref('登录后即可使用仪表盘中的全部检测与润色工具。');

const featureCards = [
  {
    key: 'scan',
    title: 'AI 文本检测',
    description: '识别整篇文档的 AI 生成概率，生成段落级风险分析与可导出的检测报告。',
    tag: 'Detection',
    bullets: ['支持粘贴与文件上传', '段落风险热力图', '可信度解释与建议'],
    cta: '前往扫描',
    action: 'scan',
  },
  {
    key: 'polish',
    title: '智能润色',
    description: '依据原文语境优化语言流畅度，可选择保留术语或增强学术语气。',
    tag: 'Polish',
    bullets: ['保留术语模式', '语气自定义', '润色建议对比'],
    cta: '打开润色',
    action: 'polish',
  },
  {
    key: 'translate',
    title: '多语言翻译',
    description: '支持 32 种语言互译，同时对比原文与译文的 AI 风险，辅助跨语言审核。',
    tag: 'Translate',
    bullets: ['专业术语词汇表', '段落对照显示', '译后风险复检'],
    cta: '开启翻译',
    action: 'translate',
  },
  {
    key: 'citation',
    title: '引用核查',
    description: '自动提取段落中的引用语句，生成引用清单并检测重复度，辅助学术写作。',
    tag: 'Citations',
    bullets: ['引用句检测', '相似度排查', '导出引用列表'],
    cta: '检查引用',
    action: 'citation',
  },
  {
    key: 'team',
    title: '团队工作区',
    description: '邀请成员共享扫描额度，设置角色权限并追踪使用情况。',
    tag: 'Workspace',
    bullets: ['成员邀请与 SSO', '使用额度仪表盘', '操作日志追踪'],
    cta: '管理团队',
    action: 'team',
  },
  {
    key: 'api',
    title: 'API 接入',
    description: '通过 API 将检测与润色能力嵌入现有系统，适配内容审核与知识库场景。',
    tag: 'Integrations',
    bullets: ['RESTful 接口', '批量任务队列', '安全审计与回调'],
    cta: '查看文档',
    action: 'api',
  },
];

const primaryAction = featureCards[0];

const recentReports = reactive([
  { title: '研究生论文章节 · 3 月 18 日', time: '2 小时前' },
  { title: '市场活动脚本 · 3 月 17 日', time: '5 小时前' },
  { title: '英文期刊投稿 · 3 月 16 日', time: '昨日' },
]);

const insightCards = [
  {
    title: '可溯源风险解释',
    description: '每个高风险段落都附带 AI 痕迹解释、句子级概率与可视化高亮，帮助快速定位问题。',
    badge: 'Explainable',
    icon: ShieldCheckIcon,
  },
  {
    title: '写作风格建议',
    description: '根据原文语境生成润色建议列表，提供学术、媒体、营销等不同写作风格模板。',
    badge: 'Styling',
    icon: SparklesIcon,
  },
  {
    title: '跨语言同步',
    description: '翻译与引用功能与检测结果互通，支持对照查看译文并保留风格设置。',
    badge: 'Multilingual',
    icon: GlobeAltIcon,
  },
];

const focusedFeature = computed(() => route.query.focus || 'scan');

const handleFeature = (feature) => {
  if (!authStore.isAuthenticated) {
    loginMessage.value = `登录后即可${feature.cta}并同步检测记录。`;
    showLoginModal.value = true;
    return;
  }

  if (['scan', 'polish', 'translate', 'citation'].includes(feature.action)) {
    router.push({
      name: 'scan',
      query: {
        mode: feature.action,
      },
    });
    return;
  }

  router.push({
    name: 'dashboard',
    query: {
      focus: feature.key,
    },
  });
};
</script>
