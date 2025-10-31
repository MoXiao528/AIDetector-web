<template>
  <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)] xl:grid-cols-[minmax(0,1.2fr)_minmax(0,320px)]">
    <div class="space-y-8">
      <section>
        <div class="space-y-3">
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900">API Pricing</h1>
          <p class="text-sm text-slate-500">Integrate with the best AI Detector on the planet.</p>
        </div>
        <div class="mt-8">
          <div class="-mx-2 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 sm:mx-0 sm:flex-wrap sm:overflow-visible">
            <button
              v-for="plan in plans"
              :key="plan.id"
              type="button"
              :class="[
                'group relative flex min-w-[220px] flex-1 snap-start flex-col rounded-3xl border px-6 py-6 text-left transition shadow-sm hover:-translate-y-1 hover:shadow-lg sm:min-w-[240px]',
                plan.id === selectedPlan.id
                  ? 'border-primary-500 ring-2 ring-primary-500/40 bg-white'
                  : 'border-slate-200 bg-white/90',
              ]"
              @click="selectPlan(plan)"
            >
              <div class="flex items-center justify-between">
                <p class="text-sm font-semibold uppercase tracking-wide text-slate-500">{{ plan.label }}</p>
                <span
                  v-if="plan.id === selectedPlan.id"
                  class="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-semibold text-primary-600"
                >
                  Selected
                </span>
              </div>
              <p class="mt-4 text-2xl font-semibold text-slate-900">{{ plan.wordsLabel }}</p>
              <p class="mt-3 text-lg font-semibold text-slate-900">
                <span class="text-sm font-medium text-slate-500">$</span>{{ plan.price }}<span class="text-sm font-medium text-slate-500"> / month</span>
              </p>
              <p class="mt-2 text-xs leading-relaxed text-slate-500">{{ plan.description }}</p>
            </button>
          </div>
        </div>
      </section>

      <section class="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/50">
        <header class="space-y-1">
          <h2 class="text-lg font-semibold text-slate-900">Estimate cost after additional usage</h2>
          <p class="text-xs text-slate-500">输入预估字数，快速了解月度花费。</p>
        </header>
        <div class="mt-6 grid gap-6 lg:grid-cols-2">
          <label class="flex flex-col gap-2 text-sm">
            <span class="font-semibold text-slate-700">Total words</span>
            <input
              v-model="totalWordsInput"
              type="number"
              min="0"
              class="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              placeholder="例如 450000"
            />
            <span class="text-xs text-slate-400">包含计划内及额外使用的总字数。</span>
          </label>
          <div class="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
            <p>额外字数按 ${{ overageRate.toFixed(4) }} / 字收费。</p>
            <p class="mt-1">系统会自动扣除计划内额度再计算额外费用。</p>
          </div>
        </div>
        <div class="mt-6 grid gap-4 text-sm text-slate-600">
          <div class="flex items-center justify-between">
            <span>Additional words</span>
            <span class="font-semibold text-slate-900">{{ formattedNumber(additionalWords) }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span>Base plan cost</span>
            <span class="font-semibold text-slate-900">${{ selectedPlan.price.toFixed(2) }}/month</span>
          </div>
          <div class="flex items-center justify-between">
            <span>Additional usage cost</span>
            <span class="font-semibold text-slate-900">${{ additionalCost.toFixed(2) }}/month</span>
          </div>
          <div class="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
            <span>Estimated total monthly cost</span>
            <span>${{ estimatedTotal.toFixed(2) }}</span>
          </div>
        </div>
      </section>

      <section class="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/50">
        <h2 class="text-lg font-semibold text-slate-900">常见问题 FAQ</h2>
        <div class="mt-5 space-y-4">
          <details
            v-for="item in faqs"
            :key="item.question"
            class="group rounded-2xl border border-slate-200 bg-white/60 p-4 shadow-sm transition hover:border-primary-200"
          >
            <summary class="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-slate-700">
              <span>{{ item.question }}</span>
              <svg class="h-4 w-4 text-slate-400 transition group-open:rotate-180" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <p class="mt-3 text-xs leading-relaxed text-slate-500">{{ item.answer }}</p>
          </details>
        </div>
      </section>
    </div>

    <aside class="space-y-4">
      <div class="rounded-3xl bg-white p-6 shadow-xl shadow-slate-300/40">
        <h3 class="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Selected plan</h3>
        <p class="mt-4 text-3xl font-semibold tracking-tight text-slate-900">${{ selectedPlan.price.toFixed(2) }}<span class="text-base font-medium text-slate-500"> / month</span></p>
        <p class="mt-2 text-sm text-slate-500">{{ selectedPlan.wordsLabel }} 收录，支持批量检测与 RepreGuard 高级模型。</p>
        <ul class="mt-5 space-y-3 text-sm text-slate-600">
          <li v-for="feature in selectedPlan.features" :key="feature" class="flex items-start gap-2">
            <span class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span>{{ feature }}</span>
          </li>
        </ul>
        <button
          type="button"
          class="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
          @click="$emit('startCheckout', selectedPlan)"
        >
          Get started
        </button>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const plans = [
  {
    id: '300k',
    label: 'Starter',
    words: 300000,
    wordsLabel: '300k words',
    price: 45,
    description: '适合初创团队与试点项目，支持核心检测能力。',
    features: ['50 file batch uploads', '150k characters per doc', "Access to RepreGuard premium detection model"],
  },
  {
    id: '1m',
    label: 'Growth',
    words: 1000000,
    wordsLabel: '1m words',
    price: 135,
    description: '面向高频检测需求，包含更高配额与优先支持。',
    features: ['100 file batch uploads', 'Priority processing queue', 'Full RepreGuard analytics dashboards'],
  },
  {
    id: '2m',
    label: 'Scale',
    words: 2000000,
    wordsLabel: '2m words',
    price: 250,
    description: '跨部门协作使用，支持高级审计与导出。',
    features: ['Advanced audit trails', 'CSV export for results', 'Dedicated onboarding session'],
  },
  {
    id: '5m',
    label: 'Enterprise',
    words: 5000000,
    wordsLabel: '5m words',
    price: 550,
    description: '企业级集成，含多团队配额与 API 扩展。',
    features: ['200 file batch uploads', 'Role-based access controls', 'SLA-backed support'],
  },
  {
    id: '10m',
    label: 'Enterprise Plus',
    words: 10000000,
    wordsLabel: '10m words',
    price: 1000,
    description: '大规模内容生产团队，全面开放 API 功能。',
    features: ['Custom usage dashboards', 'Model experimentation sandboxes', 'Quarterly strategy reviews'],
  },
  {
    id: '20m',
    label: 'Global',
    words: 20000000,
    wordsLabel: '20m words',
    price: 1850,
    description: '全球化部署，支持多区域冗余与私有化需求。',
    features: ['Regional deployment options', 'Dedicated success manager', 'Private model fine-tuning windows'],
  },
];

const faqs = [
  {
    question: 'How do I view and use my API key?',
    answer: '在仪表盘的 API Key 页面即可查看或轮换密钥，集成后通过 Authorization 头部携带。',
  },
  {
    question: 'Do you have API discounts for educators?',
    answer: '教育机构可联系销售团队获取定制折扣与批量部署方案。',
  },
  {
    question: 'How do I interpret the results returned by the API request?',
    answer: 'API 会返回文档、段落与句子层级的概率、置信度与说明，可结合示例代码解析。',
  },
  {
    question: 'What is the rate limit?',
    answer: '基础频率限制为每分钟 60 次请求，高配额方案可申请提升。',
  },
  {
    question: 'What if I need more than 20 million words/month?',
    answer: '请联系我们的企业团队，我们可提供自定义高配额或私有化部署。',
  },
  {
    question: 'Do you offer on-premise deployment of the API?',
    answer: '支持。Enterprise Plus 及以上可申请在本地或私有云环境部署。',
  },
  {
    question: 'How do I view my current usage?',
    answer: '仪表盘统计面板会实时展示使用量，也可通过 API usage 端点查询。',
  },
  {
    question: 'How do I cancel my plan?',
    answer: '可在账单页面取消订阅，或联系 support@veritascribe.ai 协助处理。',
  },
  {
    question: 'How do I downgrade my plan?',
    answer: '在续费周期前调整套餐即可降级，系统会自动在下月生效。',
  },
];

const selectedPlan = ref(plans[0]);
const totalWordsInput = ref(String(selectedPlan.value.words));
const overageRate = 0.0002;

const additionalWords = computed(() => {
  const total = Number(totalWordsInput.value);
  if (Number.isNaN(total) || total <= selectedPlan.value.words) {
    return 0;
  }
  return Math.round(total - selectedPlan.value.words);
});

const additionalCost = computed(() => additionalWords.value * overageRate);
const estimatedTotal = computed(() => selectedPlan.value.price + additionalCost.value);

const selectPlan = (plan) => {
  selectedPlan.value = plan;
  totalWordsInput.value = String(plan.words);
};

const formattedNumber = (value) => Number(value || 0).toLocaleString();

const emit = defineEmits(['startCheckout']);
emit; // silence unused warning when not listening
</script>
