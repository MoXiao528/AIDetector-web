<template>
  <div :class="rootClasses">
    <AppHeader v-if="!embedded" mode="marketing" />
    <main :class="mainClasses">
      <section v-if="showStatusBanner" class="border-b border-slate-200 bg-slate-100/70">
        <div class="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3 text-sm sm:px-6 lg:px-0">
          <div class="flex flex-wrap items-center gap-2">
            <span>You’re on a <button type="button" class="font-semibold text-primary-600" @click="scrollToPlans">Free Plan</button>.</span>
            <span class="text-slate-500">You have access to 10,000 words a month.</span>
          </div>
          <button type="button" class="text-slate-400 transition hover:text-slate-600" @click="showStatusBanner = false" aria-label="关闭提示">
            ×
          </button>
        </div>
      </section>

      <section ref="planSection" class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <h1 class="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Words that matter start with the right plan.</h1>
          <p class="mt-4 text-base text-slate-600">Choose the AI detection workflow that matches your team size and compliance requirements.</p>
        </div>
        <div class="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <div class="inline-flex items-center rounded-full bg-white p-1 shadow-sm">
            <button
              v-for="option in billingOptions"
              :key="option.value"
              type="button"
              :class="[
                'rounded-full px-4 py-1.5 text-sm font-semibold transition',
                billingCycle === option.value ? option.activeClass : option.inactiveClass,
              ]"
              @click="billingCycle = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <article
            v-for="plan in displayedPlans"
            :key="plan.key"
            :class="[
              'flex flex-col rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl',
              plan.highlight ? 'border-emerald-500/60 shadow-emerald-200/50' : 'border-slate-200',
            ]"
          >
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-slate-900">{{ plan.name }}</h2>
              <span v-if="plan.badge" class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{{ plan.badge }}</span>
            </div>
            <p class="mt-2 text-sm text-slate-500">{{ plan.description }}</p>
            <p class="mt-6 text-3xl font-semibold text-slate-900">{{ plan.price }}<span class="text-sm font-normal text-slate-500"> / {{ plan.period }}</span></p>
            <p class="mt-2 text-xs uppercase tracking-wide text-emerald-600">{{ plan.limit }}</p>
            <ul class="mt-6 flex-1 space-y-3 text-sm text-slate-600">
              <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-2">
                <span class="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-semibold text-white">✓</span>
                <span>{{ feature }}</span>
              </li>
            </ul>
            <button
              type="button"
              class="mt-8 inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-600"
              @click="openCheckout(plan)"
            >
              立即购买 / 升级
            </button>
          </article>
        </div>
      </section>

      <section class="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="grid gap-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm lg:grid-cols-2">
          <div class="flex flex-col justify-between gap-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
            <div class="flex items-center gap-3">
              <h3 class="text-lg font-semibold text-slate-900">Teams Plans</h3>
              <span class="rounded-full bg-primary-100 px-3 py-0.5 text-xs font-semibold text-primary-700">BEST FOR SCHOOLS</span>
            </div>
            <p class="text-sm text-slate-600">Purchase multiple plans for your organization.</p>
            <p class="text-base font-semibold text-slate-900">Starting at $24.99 / user / month</p>
            <div class="mt-4 flex flex-wrap gap-3">
              <button type="button" class="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400">Schedule Demo</button>
              <button type="button" class="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700">Team Plans</button>
            </div>
            <div class="rounded-2xl border border-primary-100 bg-white/80 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary-500">团队协作</p>
                  <p class="mt-1 text-sm text-slate-600">直接在定价页添加成员并管理席位，快速开通团队版。</p>
                </div>
                <span class="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">TEAM</span>
              </div>
              <div class="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-full border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:bg-primary-50"
                  @click="copyTeamInviteLink"
                >
                  复制邀请链接
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  @click="openSeatManager"
                >
                  席位管理入口
                </button>
              </div>
              <p v-if="teamActionStatus" class="mt-2 text-xs text-emerald-600">{{ teamActionStatus }}</p>
              <p v-else class="mt-2 text-xs text-slate-400">可随时邀请成员或调整席位数量。</p>
            </div>
          </div>
          <div class="flex flex-col justify-between gap-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
            <div class="flex items-center gap-3">
              <h3 class="text-lg font-semibold text-slate-900">API Plans</h3>
            </div>
            <p class="text-sm text-slate-600">View our API plans, which allow you to integrate RepreGuard with your organization’s software.</p>
            <div class="mt-4 flex flex-wrap gap-3">
              <button type="button" class="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400">Schedule Demo</button>
              <button type="button" class="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700">API Plans</button>
            </div>
          </div>
        </div>
      </section>

      <section class="mx-auto mt-16 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 class="text-2xl font-semibold text-slate-900">Compare Plans</h2>
              <p class="mt-2 text-sm text-slate-500">See which RepreGuard-powered toolkit fits your workflow.</p>
            </div>
          </div>
          <div class="mt-8 overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50 text-left">
                <tr>
                  <th class="px-4 py-3 font-semibold text-slate-600">功能</th>
                  <th v-for="plan in tablePlans" :key="plan" class="px-4 py-3 text-center font-semibold text-slate-600">{{ plan }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <template v-for="section in comparison" :key="section.name">
                  <tr class="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500">
                    <td class="px-4 py-2" :colspan="tablePlans.length + 1">{{ section.name }}</td>
                  </tr>
                  <tr
                    v-for="row in section.rows"
                    :key="row.label"
                    class="bg-white text-slate-600"
                  >
                    <td class="px-4 py-3">{{ row.label }}</td>
                    <td
                      v-for="(value, index) in row.values"
                      :key="index"
                      class="px-4 py-3 text-center"
                    >
                      <span v-if="value === true" class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">✓</span>
                      <span v-else-if="value === false" class="text-slate-300">—</span>
                      <span v-else>{{ value }}</span>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
    <AppFooter v-if="!embedded" />

    <transition name="fade">
      <div
        v-if="isCheckoutOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm"
        @click="closeCheckout"
      >
        <div
          class="w-full max-w-2xl rounded-4xl bg-white p-6 shadow-2xl"
          @click.stop
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary-500">结算</p>
              <h3 class="mt-1 text-xl font-semibold text-slate-900">{{ selectedPlan?.name }} · 立即购买 / 升级</h3>
              <p class="text-sm text-slate-500">选择计费周期与支付方式，我们将创建订单并在成功后刷新额度。</p>
            </div>
            <button
              type="button"
              class="text-slate-400 transition hover:text-slate-600"
              aria-label="关闭支付弹窗"
              @click="closeCheckout"
            >
              ×
            </button>
          </div>

          <div class="mt-6 grid gap-6 md:grid-cols-2">
            <div class="space-y-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">计费周期</p>
                <div class="mt-2 inline-flex items-center rounded-full bg-slate-50 p-1 text-xs font-semibold text-slate-600">
                  <button
                    v-for="option in billingOptions"
                    :key="option.value"
                    type="button"
                    :class="[
                      'rounded-full px-3 py-1 transition',
                      checkoutBillingCycle === option.value ? option.activeClass : option.inactiveClass,
                    ]"
                    @click="checkoutBillingCycle = option.value"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>

              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">支付方式</p>
                <div class="mt-2 space-y-2">
                  <label v-for="method in paymentMethods" :key="method.value" class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-700 transition hover:border-emerald-200">
                    <input
                      v-model="paymentMethod"
                      type="radio"
                      :value="method.value"
                      class="h-4 w-4 border-slate-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <div>
                      <p class="font-semibold text-slate-900">{{ method.label }}</p>
                      <p class="text-xs text-slate-500">{{ method.description }}</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div class="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs uppercase tracking-[0.2em] text-slate-500">订单摘要</p>
                  <p class="text-lg font-semibold text-slate-900">{{ selectedPlan?.name }}</p>
                  <p class="text-xs text-emerald-600">{{ quotaLabel }}</p>
                </div>
                <div class="text-right">
                  <p class="text-3xl font-semibold text-slate-900">{{ selectedPlan?.priceOptions?.[checkoutBillingCycle] }}</p>
                  <p class="text-xs text-slate-400">/{{ selectedPlan?.periodOptions?.[checkoutBillingCycle] }}</p>
                </div>
              </div>

              <ul class="space-y-2 text-sm text-slate-600">
                <li v-for="feature in selectedPlan?.features || []" :key="feature" class="flex items-start gap-2">
                  <span class="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-semibold text-white">✓</span>
                  <span>{{ feature }}</span>
                </li>
              </ul>

              <div v-if="selectedPlan?.key === 'professional'" class="rounded-2xl border border-primary-100 bg-white/90 p-3 text-xs text-slate-700">
                <p class="font-semibold text-primary-700">团队版快速入口</p>
                <p class="mt-1 text-slate-500">完成支付后即可在团队仪表盘中邀请成员、分配席位，额度同步刷新。</p>
              </div>

              <button
                type="button"
                class="flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="paymentStatus === 'creating' || paymentStatus === 'paying'"
                @click="handleSubmitPayment"
              >
                <span v-if="paymentStatus === 'creating'">正在创建订单...</span>
                <span v-else-if="paymentStatus === 'paying'">等待支付确认...</span>
                <span v-else>确认支付</span>
              </button>

              <div class="text-xs text-slate-500">
                <p v-if="paymentStatus === 'success'" class="text-emerald-600">支付成功，额度已刷新。</p>
                <p v-else-if="paymentStatus === 'failed'" class="text-rose-600">支付失败：{{ paymentMessage || '请稍后再试。' }}</p>
                <p v-else-if="paymentStatus === 'canceled'" class="text-amber-600">已取消支付，可重新提交。</p>
                <p v-else-if="paymentMessage">{{ paymentMessage }}</p>
                <p class="mt-1 text-slate-400">如需企业采购，请联系我们的团队顾问。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import AppHeader from '../sections/AppHeader.vue';
import AppFooter from '../sections/AppFooter.vue';
import { useAuthStore } from '../store/auth';
import { createOrder, fetchSubscriptionSnapshot, payOrder, planQuotaByKey } from '../utils/billing';

const props = defineProps({
  embedded: {
    type: Boolean,
    default: false,
  },
});

const showStatusBanner = ref(true);
const billingCycle = ref('annual');
const planSection = ref(null);
const selectedPlan = ref(null);
const isCheckoutOpen = ref(false);
const checkoutBillingCycle = ref('annual');
const paymentMethod = ref('alipay');
const paymentStatus = ref('idle');
const paymentMessage = ref('');
const teamActionStatus = ref('');

const rootClasses = computed(() =>
  props.embedded ? 'min-h-full bg-transparent text-slate-800' : 'min-h-screen bg-[#FAFAF7] text-slate-800',
);

const mainClasses = computed(() => (props.embedded ? 'pb-16 pt-4' : 'pb-24'));

const billingOptions = [
  { value: 'annual', label: 'Annual (Save 45%)', activeClass: 'bg-emerald-500 text-white shadow-sm', inactiveClass: 'text-emerald-600 hover:bg-emerald-50' },
  { value: 'monthly', label: 'Monthly', activeClass: 'bg-emerald-500 text-white shadow-sm', inactiveClass: 'text-slate-500 hover:bg-slate-100' },
];

const paymentMethods = [
  { value: 'alipay', label: '支付宝', description: '适用于国内企业与个人账户，实时到账。' },
  { value: 'wechat', label: '微信支付', description: '微信扫码或内置支付，适合移动端快捷支付。' },
  { value: 'card', label: '信用卡 / PayPal', description: '使用国际信用卡或 PayPal 进行结算。' },
];

const authStore = useAuthStore();

const planDefinitions = [
  {
    key: 'free',
    planCode: 'personal-free',
    name: 'FREE',
    price: { annual: '$0.00', monthly: '$0.00' },
    period: { annual: 'month', monthly: 'month' },
    limit: '10,000 words per month',
    description: 'Essential RepreGuard safeguards for individuals testing AI content.',
    features: ['Basic AI Scan', '5 Free Advanced Scans'],
  },
  {
    key: 'essential',
    planCode: 'personal-essential',
    name: 'ESSENTIAL',
    price: { annual: '$99.96', monthly: '$9.99' },
    period: { annual: 'year', monthly: 'month' },
    limit: '150,000 words per month',
    description: 'Expanded detection muscle with RepreGuard mixed-model comparisons.',
    features: [
      'Basic AI Scan',
      'Up to 150,000 words per month',
      'Premium AI detection models',
      'Plagiarism scanning',
      'Advanced Grammar and Writing feedback',
    ],
  },
  {
    key: 'premium',
    planCode: 'personal-premium',
    name: 'PREMIUM',
    price: { annual: '$155.88', monthly: '$15.99' },
    period: { annual: 'year', monthly: 'month' },
    limit: '300,000 words per month',
    description: 'Our most popular toolkit powered by RepreGuard deep scan layers.',
    badge: 'MOST POPULAR',
    highlight: true,
    features: [
      'Everything in Essential',
      'Up to 300,000 words per month',
      'Advanced AI Deep Scan',
      'Multilingual AI detection',
      'Download AI reports',
    ],
  },
  {
    key: 'professional',
    planCode: 'personal-professional',
    name: 'PROFESSIONAL',
    price: { annual: '$299.88', monthly: '$29.99' },
    period: { annual: 'year', monthly: 'month' },
    limit: '500,000 words per month',
    description: 'Scale your compliance team with enterprise-grade workflows.',
    features: [
      'All of Premium',
      'Up to 10 million words overage',
      'Scan up to 250 files at once',
      'Page by page scanning',
      'Enterprise-grade security LMS Integration',
    ],
  },
];

const displayedPlans = computed(() =>
  planDefinitions.map((plan) => ({
    ...plan,
    price: plan.price[billingCycle.value],
    period: plan.period[billingCycle.value],
    priceOptions: plan.price,
    periodOptions: plan.period,
  }))
);

const tablePlans = ['FREE', 'ESSENTIAL', 'PREMIUM', 'PROFESSIONAL'];

const comparison = [
  {
    name: 'Detection features',
    rows: [
      { label: 'Words per month', values: ['10,000', '150,000', '300,000', '500,000'] },
      { label: 'Character limit per scan', values: ['10,000', '50,000', '50,000', '150,000'] },
      { label: 'Multi-model AI detection (Gemini, Claude, LLaMA, etc.)', values: [true, true, true, true] },
      { label: 'Mixed AI and human text detection', values: [true, true, true, true] },
      { label: 'Sentence-level AI highlighting', values: [true, true, true, true] },
      { label: 'AI Vocabulary Scan', values: [false, false, true, true] },
      { label: 'Paraphraser and AI bypasser detection', values: [false, false, true, true] },
      { label: 'Batch upload file limit', values: ['3', '3', '50', '250'] },
      { label: 'Advanced AI scan', values: ['5 Free', '5 Free', true, true] },
      { label: 'Downloadable AI report', values: [false, false, true, true] },
      { label: 'Plagiarism checker', values: [false, true, true, true] },
      { label: 'Page by page scanning', values: [false, false, false, true] },
    ],
  },
  {
    name: 'Writing features',
    rows: [
      { label: 'Grammar Check', values: [true, true, true, true] },
      { label: 'Writing feedback', values: [false, true, true, true] },
      { label: 'Find Sources and Auto-Generate Citations', values: [false, false, true, true] },
    ],
  },
  {
    name: 'Collaboration features',
    rows: [
      { label: 'Enterprise Grade Security and Privacy', values: [false, true, true, true] },
      { label: 'Roles, Accounts Provisioning, Shared Billing Across Teams', values: [false, false, false, true] },
      { label: 'Custom LMS Integration (Canvas, Google Classroom, Moodle)', values: [false, false, false, true] },
    ],
  },
];

const scrollToPlans = () => {
  planSection.value?.scrollIntoView({ behavior: 'smooth' });
};

const openCheckout = (plan) => {
  selectedPlan.value = plan;
  checkoutBillingCycle.value = billingCycle.value;
  paymentStatus.value = 'idle';
  paymentMessage.value = '';
  isCheckoutOpen.value = true;
};

const closeCheckout = () => {
  isCheckoutOpen.value = false;
};

const quotaLabel = computed(() => {
  if (!selectedPlan.value) return '';
  const quota = planQuotaByKey[selectedPlan.value.key];
  return quota?.label || '按需计费额度';
});

const refreshSubscription = async () => {
  if (!selectedPlan.value) return;
  const snapshot = await fetchSubscriptionSnapshot(selectedPlan.value.key, selectedPlan.value.planCode);
  authStore.applySubscription(snapshot);
};

const handleSubmitPayment = async () => {
  if (!selectedPlan.value) return;
  paymentStatus.value = 'creating';
  paymentMessage.value = '正在创建订单...';
  try {
    const order = await createOrder({
      planKey: selectedPlan.value.key,
      planCode: selectedPlan.value.planCode,
      billingCycle: checkoutBillingCycle.value,
      paymentMethod: paymentMethod.value,
    });
    paymentStatus.value = 'paying';
    paymentMessage.value = '订单已创建，等待支付结果...';

    const paymentResult = await payOrder(order.id || order.orderId, { paymentMethod: paymentMethod.value });
    if (paymentResult.status === 'succeeded') {
      paymentStatus.value = 'success';
      paymentMessage.value = '支付成功，正在刷新套餐...';
      await refreshSubscription();
      paymentMessage.value = '套餐与额度已更新。';
    } else if (paymentResult.status === 'canceled') {
      paymentStatus.value = 'canceled';
      paymentMessage.value = paymentResult.message || '支付已取消。';
    } else {
      paymentStatus.value = 'failed';
      paymentMessage.value = paymentResult.message || '支付失败，请稍后重试。';
    }
  } catch (error) {
    paymentStatus.value = 'failed';
    paymentMessage.value = error?.message || '支付异常，请稍后再试。';
  }
};

const copyTeamInviteLink = async () => {
  const link = 'https://veritascribe.dev/invite/team';
  try {
    await navigator.clipboard?.writeText(link);
    teamActionStatus.value = '邀请链接已复制，可直接发送给团队成员。';
  } catch (error) {
    console.warn('Clipboard unavailable, showing link instead.', error);
    teamActionStatus.value = `邀请链接：${link}`;
  }
};

const openSeatManager = () => {
  teamActionStatus.value = '席位管理入口已开启，我们会在后台为团队预留席位。';
  if (!isCheckoutOpen.value) {
    scrollToPlans();
  }
};
</script>
