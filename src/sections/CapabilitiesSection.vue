<template>
  <section id="capabilities" class="relative bg-slate-950 py-24 text-white">
    <div class="absolute inset-x-0 -top-20 -z-10 h-40 bg-gradient-to-b from-primary-200/20 to-transparent"></div>
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl">
        <span class="inline-flex items-center rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/70">全栈能力矩阵</span>
        <h2 class="section-title mt-6 !text-primary-100 drop-shadow-[0_4px_16px_rgba(15,23,42,0.45)]">
          检测、润色、翻译，一站式智能写作中枢
        </h2>
        <p class="section-subtitle !text-slate-200">
          结合语义模型、文体评估与跨语言对齐，Veritascribe 为不同角色提供从文本创作到审阅的完整工具链，帮助团队快速迭代高可信内容。
        </p>
      </div>
      <div class="mt-16 grid gap-6 lg:grid-cols-3">
        <article
          v-for="capability in capabilities"
          :key="capability.title"
          class="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_45px_-15px_rgba(15,23,42,0.65)] transition hover:-translate-y-1 hover:border-primary-300/60 hover:bg-white/10"
        >
          <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary-500/10 blur-xl transition group-hover:bg-primary-400/20"></div>
          <div class="relative flex h-full flex-col">
            <div class="flex items-center justify-between">
              <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-primary-200">
                <component :is="capability.icon" class="h-6 w-6" />
              </div>
              <span class="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70">{{ capability.tag }}</span>
            </div>
            <h3 class="mt-6 text-xl font-semibold text-white">{{ capability.title }}</h3>
            <p class="mt-3 text-sm text-white/70">{{ capability.description }}</p>
            <ul class="mt-6 space-y-2 text-xs text-white/60">
              <li v-for="item in capability.points" :key="item" class="flex items-start space-x-2">
                <svg class="mt-1 h-3.5 w-3.5 flex-none text-primary-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{{ item }}</span>
              </li>
            </ul>
            <a
              href="#trial"
              class="mt-8 inline-flex items-center text-sm font-semibold text-primary-200 transition hover:text-primary-100"
            >
              了解工作流程
              <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { AcademicCapIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/vue/24/outline';

const capabilities = [
  {
    title: '深度 AI 文本检测',
    description: '基于 RepreGuard 模型比对算法，快速识别段落级别的 AI 痕迹并生成解释说明。',
    tag: 'Detection',
    icon: ShieldCheckIcon,
    points: ['词法、句法、语义三层证据链', 'AI 概率热力图与逐句报告', '上传 PDF、DOCX、Markdown 多格式']
  },
  {
    title: '智能文本润色',
    description: '结合上下文语境与风格库，给出精准润色建议，让文本更自然可信。',
    tag: 'Polish',
    icon: SparklesIcon,
    points: ['三档润色强度随时切换', '保留专业术语与引用格式', '一键生成人工风格替换稿']
  },
  {
    title: '跨语言协同翻译',
    description: '支持 20+ 种语言互译，自动标注 AI 可疑片段并建议人工改写。',
    tag: 'Translate',
    icon: AcademicCapIcon,
    points: ['术语库同步与词汇记忆', '双语对照稿即时导出', '团队共享翻译记忆库']
  }
];
</script>
