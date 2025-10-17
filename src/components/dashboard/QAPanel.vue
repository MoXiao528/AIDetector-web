<template>
  <section class="rounded-3xl border border-slate-200 bg-white p-10 shadow-xl shadow-slate-200/60">
    <div class="flex flex-col gap-8">
      <header class="space-y-3">
        <p class="inline-flex items-center rounded-full bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
          Knowledge Base
        </p>
        <h1 class="text-2xl font-semibold text-slate-900">问答中心</h1>
        <p class="text-sm text-slate-500">
          汇总用户最关心的检测、润色、翻译与引用核查相关问题，帮助你快速掌握工作台的最佳实践。
        </p>
        <div class="relative">
          <input
            v-model="search"
            type="search"
            placeholder="搜索关键字，例如“扫描报告”或“批量上传”"
            class="w-full rounded-2xl border border-slate-200 px-4 py-2 pl-10 text-sm text-slate-700 focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
          <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 7.5a7.5 7.5 0 010 9.15z" />
          </svg>
        </div>
      </header>
      <div class="grid gap-4">
        <article
          v-for="item in filteredFaqs"
          :key="item.id"
          class="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-primary-200 hover:bg-white"
        >
          <h2 class="text-base font-semibold text-slate-900">{{ item.question }}</h2>
          <p class="mt-2 text-sm leading-relaxed text-slate-600">{{ item.answer }}</p>
          <div class="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span v-for="tag in item.tags" :key="tag" class="rounded-full bg-slate-200/60 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
              #{{ tag }}
            </span>
          </div>
        </article>
      </div>
      <footer class="rounded-2xl bg-slate-900/90 p-6 text-sm text-slate-100">
        <p class="font-semibold">还有其他问题？</p>
        <p class="mt-2 text-slate-200">
          可以在页面右上角点击 Contact Us，或发送邮件至
          <a href="mailto:help@veritascribe.dev" class="text-primary-200 underline decoration-dotted">help@veritascribe.dev</a>
          ，我们会在 2 个工作日内给出解答。
        </p>
      </footer>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';

const search = ref('');

const faqs = [
  {
    id: 'scan-report',
    question: '扫描完成后如何查看详细的 AI 检测报告？',
    answer:
      '在 Dashboard 中切换到 “标色预览” 或右侧的 Scan 结果标签，可以查看每一句话的概率、原因及颜色标注。点击润色、翻译等标签可快速切换查看不同结果。',
    tags: ['检测', '报告', '颜色标注'],
  },
  {
    id: 'multi-upload',
    question: '支持一次上传多个文档进行批量检测吗？',
    answer: '左侧导航选择 New → Multi File Upload，即可批量上传 TXT、DOCX、PDF 等文件，系统会自动串联进入编辑区。',
    tags: ['批量上传', '工作流'],
  },
  {
    id: 'login-required',
    question: '为什么需要登录才能启动扫描？',
    answer: '为了保护文档安全与生成历史记录，扫描、润色、翻译等操作都需要登录账户后执行。未登录时点击“开始扫描”会提示登录以继续。',
    tags: ['安全', '登录'],
  },
  {
    id: 'citation-check',
    question: '引用核查的结果来源是什么？',
    answer: '当前版本提供占位逻辑，用以展示引用核查的交互体验。后续版本将对接真实的权威数据库，实现自动比对引用来源。',
    tags: ['引用', '路线图'],
  },
  {
    id: 'editor-tools',
    question: '文档编辑器支持哪些排版操作？',
    answer: '编辑区底部的悬浮工具条提供加粗、斜体、对齐方式、列表、字体大小等基础编辑能力，并支持拖拽导入文档。',
    tags: ['编辑器', '操作指南'],
  },
];

const filteredFaqs = computed(() => {
  if (!search.value.trim()) return faqs;
  const term = search.value.trim().toLowerCase();
  return faqs.filter((item) => {
    const haystack = `${item.question} ${item.answer} ${item.tags.join(' ')}`.toLowerCase();
    return haystack.includes(term);
  });
});
</script>
