<template>
  <section id="pricing" class="bg-slate-950 py-24 text-white">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div class="max-w-3xl">
        <h2 class="section-title text-primary-100 drop-shadow-[0_4px_16px_rgba(15,23,42,0.45)]">灵活定价，适配不同团队规模</h2>
        <p class="section-subtitle !text-slate-200">
          从个人创作者到企业合规团队，Veritascribe 提供透明的按需计费模式。所有套餐均包含 RepreGuard 级别检测能力与全文润色服务。
        </p>
      </div>
      <div class="mt-16 grid gap-6 lg:grid-cols-3">
        <article
          v-for="plan in plans"
          :key="plan.name"
          class="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-primary-300/60 hover:bg-white/10"
          :class="plan.popular ? 'shadow-[0_30px_70px_-25px_rgba(37,99,235,0.7)]' : 'shadow-[0_25px_60px_-30px_rgba(15,23,42,0.6)]'"
        >
          <div v-if="plan.popular" class="absolute right-6 top-6 rounded-full bg-primary-500 px-3 py-1 text-xs font-semibold text-white">
            最受欢迎
          </div>
          <div class="relative flex h-full flex-col justify-between">
            <div>
              <h3 class="text-xl font-semibold">{{ plan.name }}</h3>
              <p class="mt-3 text-sm text-white/70">{{ plan.description }}</p>
              <p class="mt-6 text-3xl font-bold text-white">{{ plan.price }}<span class="text-base font-medium text-white/60"> / 月</span></p>
              <ul class="mt-6 space-y-3 text-sm text-white/70">
                <li v-for="feature in plan.features" :key="feature" class="flex items-start space-x-2">
                  <svg class="mt-1 h-4 w-4 flex-none text-primary-200" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{{ feature }}</span>
                </li>
              </ul>
            </div>
            <RouterLink
              to="/pricing"
              class="mt-8 inline-flex items-center justify-center rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white"
            >
              查看完整方案
            </RouterLink>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
const plans = [
  {
    name: '创作者',
    description: '适合个人创作者与自由撰稿人，提供基础检测和润色能力。',
    price: '¥129',
    popular: false,
    features: ['每月 20 万字检测额度', '实时润色与翻译', '导出 PDF 报告']
  },
  {
    name: '专业团队',
    description: '小型团队的最佳选择，包含协作功能与 API 接入。',
    price: '¥429',
    popular: true,
    features: ['每月 80 万字额度', '团队成员 10 人', 'API 与 Webhook 集成', '风格库与术语库管理']
  },
  {
    name: '企业旗舰',
    description: '大中型企业与高校的合规套件，提供专属部署与专家支持。',
    price: '定制',
    popular: false,
    features: ['无限检测额度', '专属私有化部署', 'SAML 单点登录', '客户成功顾问 7x24 支持']
  }
];
</script>
