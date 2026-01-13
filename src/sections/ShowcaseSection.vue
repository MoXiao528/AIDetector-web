<template>
  <section id="showcase" class="py-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-3xl">
          <h2 class="section-title">为真实场景打造的 AI 内容管控方案</h2>
          <p class="section-subtitle">
            无论你是高校教师、媒体编辑还是企业法务，Veritascribe 都能提供开箱即用的模板与报告，降低审核成本并提升写作效率。
          </p>
        </div>
        <a href="#" class="inline-flex items-center text-sm font-semibold text-primary-600 transition hover:text-primary-500">
          下载方案手册
          <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
      <div class="mt-14 grid gap-6 lg:grid-cols-3">
        <article
          v-for="useCase in useCases"
          :key="useCase.title"
          class="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
        >
          <div class="absolute -right-10 top-10 h-32 w-32 rounded-full bg-primary-200/40 blur-2xl transition group-hover:bg-primary-300/50"></div>
          <div class="relative flex h-full flex-col">
            <div class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
              {{ useCase.tag }}
            </div>
            <h3 class="mt-6 text-2xl font-semibold text-slate-900">{{ useCase.title }}</h3>
            <p class="mt-4 text-sm text-slate-600">{{ useCase.description }}</p>
            <ul class="mt-6 space-y-2 text-xs text-slate-500">
              <li v-for="point in useCase.points" :key="point" class="flex items-start space-x-2">
                <svg class="mt-1 h-3.5 w-3.5 flex-none text-primary-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>{{ point }}</span>
              </li>
            </ul>
            <div class="mt-8 flex items-center justify-between text-sm text-primary-600">
              <span>关键指标 · {{ useCase.metric }}</span>
              <span class="inline-flex items-center text-slate-500">
                了解更多
                <svg class="ml-1 h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
const useCases = [
  {
    title: '高校学术诚信审查',
    description: '在提交论文前完成自动检测与润色，一键导出可追溯检测报告并生成人工修改建议。',
    tag: 'Higher Education',
    metric: '已覆盖 420 所高校',
    points: ['Turnitin/RepreGuard 双引擎对比', '批量上传毕业论文与作业', '可共享的 PDF 审核报告']
  },
  {
    title: '媒体编辑部校对',
    description: '实时检测稿件是否包含 AI 段落，并为编辑提供人工风格改写建议，保障品牌声音一致。',
    tag: 'Newsroom',
    metric: '稿件发布效率提升 38%',
    points: ['新闻写作风格模板', '可疑段落自动标注', '对接 CMS 工作流']
  },
  {
    title: '企业合规与品牌保护',
    description: '审查营销物料与对外声明，确保 AI 生成内容符合品牌语言与合规规范。',
    tag: 'Enterprise',
    metric: '合规风险降低 62%',
    points: ['自定义敏感词库', '多角色审批流', '行为审计与导出']
  }
];
</script>
