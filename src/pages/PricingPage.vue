<template>
  <div :class="rootClasses">
    <AppHeader v-if="!embedded" mode="marketing" />
    <main :class="mainClasses">
      <section v-if="showStatusBanner" class="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-md backdrop-blur">
          <div class="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span>
              {{ t('pricingPage.statusBanner.onPlan') }}
              <button type="button" class="font-semibold text-primary-600" @click="scrollToPlans">
                {{ t('pricingPage.statusBanner.planName') }}
              </button>
            </span>
            <span class="text-slate-500">{{ t('pricingPage.statusBanner.limit') }}</span>
          </div>
          <button
            type="button"
            class="text-slate-400 transition hover:text-slate-600"
            @click="showStatusBanner = false"
            :aria-label="t('pricingPage.statusBanner.close')"
          >
            ×
          </button>
        </div>
      </section>

      <section ref="planSection" class="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{{ t('pricingPage.hero.badge') }}</p>
          <h1 class="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{{ t('pricingPage.hero.title') }}</h1>
          <p class="mt-4 text-base text-slate-600">{{ t('pricingPage.hero.subtitle') }}</p>
        </div>
        <div class="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <div class="inline-flex items-center rounded-full bg-slate-100 p-1 text-xs font-semibold text-slate-600 shadow-inner">
            <button
              v-for="option in billingOptions"
              :key="option.value"
              type="button"
              :class="[
                'rounded-full px-4 py-1.5 transition',
                billingCycle === option.value ? option.activeClass : option.inactiveClass,
              ]"
              @click="billingCycle = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <div class="mt-12 grid gap-6 lg:grid-cols-3">
          <article
            v-for="plan in displayedPlans.filter((item) => ['free', 'premium', 'professional'].includes(item.key))"
            :key="plan.key"
            :class="[
              'relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl',
              plan.key === 'premium' ? 'border-primary-500 shadow-primary-200/60 ring-1 ring-primary-500' : 'border-slate-200',
            ]"
          >
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-slate-900">
                {{ plan.displayName || plan.name }}
              </h2>
              <span v-if="plan.key === 'premium'" class="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                {{ t('pricingPage.badges.bestValue') }}
              </span>
            </div>
            <p class="mt-2 text-sm text-slate-500">{{ plan.description }}</p>
            <p class="mt-6 text-3xl font-semibold text-slate-900">
              {{ plan.price }}<span class="text-sm font-normal text-slate-500"> / {{ plan.period }}</span>
            </p>
            <p class="mt-2 text-xs uppercase tracking-wide text-slate-400">{{ plan.limit }}</p>
            <ul class="mt-6 flex-1 space-y-3 text-sm text-slate-600">
              <li v-for="feature in plan.features" :key="feature" class="flex items-start gap-3">
                <span class="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-semibold text-white">✓</span>
                <span class="leading-relaxed">{{ feature }}</span>
              </li>
            </ul>
            <button
              type="button"
              :class="[
                'mt-8 inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition',
                plan.key === 'premium'
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-200/60 hover:bg-primary-500'
                  : 'border border-slate-300 bg-white text-slate-700 hover:border-primary-300 hover:text-primary-600',
              ]"
              @click="openCheckout(plan)"
            >
              {{ t('pricingPage.actions.purchase') }}
            </button>
          </article>
        </div>
      </section>

      <section class="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="grid gap-6 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm lg:grid-cols-2">
          <div class="flex flex-col justify-between gap-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
            <div class="flex items-center gap-3">
              <h3 class="text-lg font-semibold text-slate-900">{{ t('pricingPage.cards.teams.title') }}</h3>
              <span class="rounded-full bg-primary-100 px-3 py-0.5 text-xs font-semibold text-primary-700">{{ t('pricingPage.cards.teams.badge') }}</span>
            </div>
            <p class="text-sm text-slate-600">{{ t('pricingPage.cards.teams.description') }}</p>
            <p class="text-base font-semibold text-slate-900">{{ t('pricingPage.cards.teams.price') }}</p>
            <div class="mt-4 flex flex-wrap gap-3">
              <button type="button" class="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
                {{ t('pricingPage.cards.teams.actions.schedule') }}
              </button>
              <button type="button" class="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700">
                {{ t('pricingPage.cards.teams.actions.open') }}
              </button>
            </div>
            <div class="rounded-2xl border border-primary-100 bg-white/80 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.2em] text-primary-500">{{ t('pricingPage.teamBlock.title') }}</p>
                  <p class="mt-1 text-sm text-slate-600">{{ t('pricingPage.teamBlock.subtitle') }}</p>
                </div>
                <span class="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">{{ t('pricingPage.teamBlock.badge') }}</span>
              </div>
              <div class="mt-3 flex flex-wrap gap-3">
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-full border border-primary-200 px-3 py-1.5 text-xs font-semibold text-primary-700 transition hover:bg-primary-50"
                  @click="copyTeamInviteLink"
                >
                  {{ t('pricingPage.teamBlock.copy') }}
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  @click="openSeatManager"
                >
                  {{ t('pricingPage.teamBlock.manage') }}
                </button>
              </div>
              <p v-if="teamActionStatus" class="mt-2 text-xs text-emerald-600">{{ teamActionStatus }}</p>
              <p v-else class="mt-2 text-xs text-slate-400">{{ t('pricingPage.teamBlock.hint') }}</p>
            </div>
          </div>
          <div class="flex flex-col justify-between gap-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
            <div class="flex items-center gap-3">
              <h3 class="text-lg font-semibold text-slate-900">{{ t('pricingPage.cards.api.title') }}</h3>
            </div>
            <p class="text-sm text-slate-600">{{ t('pricingPage.cards.api.description') }}</p>
            <div class="mt-4 flex flex-wrap gap-3">
              <button type="button" class="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
                {{ t('pricingPage.cards.api.actions.schedule') }}
              </button>
              <button type="button" class="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700">
                {{ t('pricingPage.cards.api.actions.open') }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="mx-auto mt-16 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 class="text-2xl font-semibold text-slate-900">{{ t('pricingPage.table.title') }}</h2>
              <p class="mt-2 text-sm text-slate-500">{{ t('pricingPage.table.subtitle') }}</p>
            </div>
          </div>
          <div class="mt-8 overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200 text-sm">
              <thead class="bg-slate-50 text-left">
                <tr>
                  <th class="px-4 py-3 font-semibold text-slate-600">{{ t('pricingPage.table.feature') }}</th>
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
              <p class="text-xs font-semibold uppercase tracking-[0.3em] text-primary-500">{{ t('pricingPage.checkout.badge') }}</p>
              <h3 class="mt-1 text-xl font-semibold text-slate-900">{{ selectedPlan?.name }} · {{ t('pricingPage.actions.purchase') }}</h3>
              <p class="text-sm text-slate-500">{{ t('pricingPage.checkout.subtitle') }}</p>
            </div>
            <button
              type="button"
              class="text-slate-400 transition hover:text-slate-600"
              :aria-label="t('pricingPage.checkout.close')"
              @click="closeCheckout"
            >
              ×
            </button>
          </div>

          <div class="mt-6 grid gap-6 md:grid-cols-2">
            <div class="space-y-4">
              <div>
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ t('pricingPage.checkout.billing') }}</p>
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
                <p class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{{ t('pricingPage.checkout.paymentMethod') }}</p>
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
                  <p class="text-xs uppercase tracking-[0.2em] text-slate-500">{{ t('pricingPage.checkout.summary') }}</p>
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
                <p class="font-semibold text-primary-700">{{ t('pricingPage.checkout.team.title') }}</p>
                <p class="mt-1 text-slate-500">{{ t('pricingPage.checkout.team.subtitle') }}</p>
              </div>

              <button
                type="button"
                class="flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="paymentStatus === 'creating' || paymentStatus === 'paying'"
                @click="handleSubmitPayment"
              >
                <span v-if="paymentStatus === 'creating'">{{ t('pricingPage.checkout.status.creating') }}</span>
                <span v-else-if="paymentStatus === 'paying'">{{ t('pricingPage.checkout.status.paying') }}</span>
                <span v-else>{{ t('pricingPage.checkout.confirm') }}</span>
              </button>

              <div class="text-xs text-slate-500">
                <p v-if="paymentStatus === 'success'" class="text-emerald-600">{{ t('pricingPage.checkout.status.success') }}</p>
                <p v-else-if="paymentStatus === 'failed'" class="text-rose-600">
                  {{ t('pricingPage.checkout.status.failed', { message: paymentMessage || t('pricingPage.checkout.status.failedFallback') }) }}
                </p>
                <p v-else-if="paymentStatus === 'canceled'" class="text-amber-600">{{ t('pricingPage.checkout.status.canceled') }}</p>
                <p v-else-if="paymentMessage">{{ paymentMessage }}</p>
                <p class="mt-1 text-slate-400">{{ t('pricingPage.checkout.note') }}</p>
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
import { useI18n } from '../i18n';
import { useAuthStore } from '../store/auth';
import { createOrder, fetchSubscriptionSnapshot, payOrder, planQuotaByKey } from '../api/modules/billing';

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
const { t } = useI18n();

const rootClasses = computed(() =>
  props.embedded ? 'min-h-full bg-transparent text-slate-800' : 'min-h-screen bg-slate-50 text-slate-800',
);

const mainClasses = computed(() => (props.embedded ? 'pb-16 pt-4' : 'pb-24'));

const billingOptions = computed(() => [
  {
    value: 'annual',
    label: t('pricingPage.billing.annual'),
    activeClass: 'bg-emerald-500 text-white shadow-sm',
    inactiveClass: 'text-emerald-600 hover:bg-emerald-50',
  },
  {
    value: 'monthly',
    label: t('pricingPage.billing.monthly'),
    activeClass: 'bg-emerald-500 text-white shadow-sm',
    inactiveClass: 'text-slate-500 hover:bg-slate-100',
  },
]);

const paymentMethods = computed(() => [
  { value: 'alipay', label: t('pricingPage.paymentMethods.alipay.label'), description: t('pricingPage.paymentMethods.alipay.description') },
  { value: 'wechat', label: t('pricingPage.paymentMethods.wechat.label'), description: t('pricingPage.paymentMethods.wechat.description') },
  { value: 'card', label: t('pricingPage.paymentMethods.card.label'), description: t('pricingPage.paymentMethods.card.description') },
]);

const authStore = useAuthStore();

const planDefinitions = computed(() => [
  {
    key: 'free',
    planCode: 'personal-free',
    name: t('pricingPage.plans.free.name'),
    displayName: t('pricingPage.plans.free.displayName'),
    price: { annual: t('pricingPage.plans.free.price.annual'), monthly: t('pricingPage.plans.free.price.monthly') },
    period: { annual: t('pricingPage.periods.month'), monthly: t('pricingPage.periods.month') },
    limit: t('pricingPage.plans.free.limit'),
    description: t('pricingPage.plans.free.description'),
    features: t('pricingPage.plans.free.features'),
  },
  {
    key: 'essential',
    planCode: 'personal-essential',
    name: t('pricingPage.plans.essential.name'),
    displayName: t('pricingPage.plans.essential.displayName'),
    price: { annual: t('pricingPage.plans.essential.price.annual'), monthly: t('pricingPage.plans.essential.price.monthly') },
    period: { annual: t('pricingPage.periods.year'), monthly: t('pricingPage.periods.month') },
    limit: t('pricingPage.plans.essential.limit'),
    description: t('pricingPage.plans.essential.description'),
    features: t('pricingPage.plans.essential.features'),
  },
  {
    key: 'premium',
    planCode: 'personal-premium',
    name: t('pricingPage.plans.premium.name'),
    displayName: t('pricingPage.plans.premium.displayName'),
    price: { annual: t('pricingPage.plans.premium.price.annual'), monthly: t('pricingPage.plans.premium.price.monthly') },
    period: { annual: t('pricingPage.periods.year'), monthly: t('pricingPage.periods.month') },
    limit: t('pricingPage.plans.premium.limit'),
    description: t('pricingPage.plans.premium.description'),
    badge: t('pricingPage.badges.bestValue'),
    highlight: true,
    features: t('pricingPage.plans.premium.features'),
  },
  {
    key: 'professional',
    planCode: 'personal-professional',
    name: t('pricingPage.plans.professional.name'),
    displayName: t('pricingPage.plans.professional.displayName'),
    price: { annual: t('pricingPage.plans.professional.price.annual'), monthly: t('pricingPage.plans.professional.price.monthly') },
    period: { annual: t('pricingPage.periods.year'), monthly: t('pricingPage.periods.month') },
    limit: t('pricingPage.plans.professional.limit'),
    description: t('pricingPage.plans.professional.description'),
    features: t('pricingPage.plans.professional.features'),
  },
]);

const displayedPlans = computed(() =>
  planDefinitions.value.map((plan) => ({
    ...plan,
    price: plan.price[billingCycle.value],
    period: plan.period[billingCycle.value],
    priceOptions: plan.price,
    periodOptions: plan.period,
  }))
);

const tablePlans = computed(() => t('pricingPage.table.plans'));

const comparison = computed(() => t('pricingPage.table.sections'));

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
  return quota?.label || t('pricingPage.checkout.quotaFallback');
});

const refreshSubscription = async () => {
  if (!selectedPlan.value) return;
  const snapshot = await fetchSubscriptionSnapshot(selectedPlan.value.key, selectedPlan.value.planCode);
  authStore.applySubscription(snapshot);
};

const handleSubmitPayment = async () => {
  if (!selectedPlan.value) return;
  paymentStatus.value = 'creating';
  paymentMessage.value = t('pricingPage.checkout.status.creating');
  try {
    const order = await createOrder({
      planKey: selectedPlan.value.key,
      planCode: selectedPlan.value.planCode,
      billingCycle: checkoutBillingCycle.value,
      paymentMethod: paymentMethod.value,
    });
    paymentStatus.value = 'paying';
    paymentMessage.value = t('pricingPage.checkout.messages.orderCreated');

    const paymentResult = await payOrder(order.id || order.orderId, { paymentMethod: paymentMethod.value });
    if (paymentResult.status === 'succeeded') {
      paymentStatus.value = 'success';
      paymentMessage.value = t('pricingPage.checkout.messages.refreshing');
      await refreshSubscription();
      paymentMessage.value = t('pricingPage.checkout.messages.updated');
    } else if (paymentResult.status === 'canceled') {
      paymentStatus.value = 'canceled';
      paymentMessage.value = paymentResult.message || t('pricingPage.checkout.messages.canceled');
    } else {
      paymentStatus.value = 'failed';
      paymentMessage.value = paymentResult.message || t('pricingPage.checkout.messages.failed');
    }
  } catch (error) {
    paymentStatus.value = 'failed';
    paymentMessage.value = error?.message || t('pricingPage.checkout.messages.error');
  }
};

const copyTeamInviteLink = async () => {
  const link = 'https://veritascribe.dev/invite/team';
  try {
    await navigator.clipboard?.writeText(link);
    teamActionStatus.value = t('pricingPage.teamBlock.toast.copied');
  } catch (error) {
    console.warn('Clipboard unavailable, showing link instead.', error);
    teamActionStatus.value = t('pricingPage.teamBlock.toast.link', { link });
  }
};

const openSeatManager = () => {
  teamActionStatus.value = t('pricingPage.teamBlock.toast.seat');
  if (!isCheckoutOpen.value) {
    scrollToPlans();
  }
};
</script>
