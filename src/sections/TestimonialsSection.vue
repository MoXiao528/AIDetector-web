<template>
  <section class="bg-white py-24">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-3xl">
          <h2 class="section-title">行业声音与真实反馈</h2>
          <p class="section-subtitle">
            来自高校、媒体和企业的用户如何利用 Veritascribe 快速完成审核、润色与翻译工作流。
          </p>
        </div>
        <div class="flex items-center space-x-2 text-sm text-slate-500">
          <span class="flex h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>全部评价已通过真实性核验</span>
        </div>
      </div>
      <div class="mt-12 grid gap-6 lg:grid-cols-3">
        <article
          v-for="testimonial in testimonials"
          :key="testimonial.author"
          class="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div>
            <p class="text-sm text-slate-600">“{{ testimonial.quote }}”</p>
          </div>
          <div class="mt-8 flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-900">{{ testimonial.author }}</p>
              <p class="text-xs text-slate-500">{{ testimonial.role }}</p>
            </div>
            <div class="text-right text-xs text-primary-600">
              <p>{{ testimonial.metric }}</p>
              <p class="text-slate-400">{{ testimonial.context }}</p>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
const testimonials = [
  {
    quote: '段落级 AI 概率热力图让我们更快锁定可疑内容，团队审核效率提升了一倍。',
    author: '王静怡',
    role: '复旦大学新闻学院 · 教学秘书',
    metric: '审核效率 +102%',
    context: '自 2023 年使用'
  },
  {
    quote: '在媒体值班时可以同步润色与翻译，让稿件在发布前就保持统一风格。',
    author: 'Laura Chen',
    role: '南华早报 · 高级编辑',
    metric: '风格一致性 95%',
    context: '跨语种编辑部'
  },
  {
    quote: 'API 接入后，营销素材自动完成检测和报告归档，极大减轻了法务压力。',
    author: '刘宇辰',
    role: '蔚来汽车 · 品牌合规主管',
    metric: '合规风险 -58%',
    context: '覆盖 12 条业务线'
  }
];
</script>
