<template>
  <div class="space-y-6">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Accessing your API key! 💻</h1>
      <p class="mt-2 text-sm text-slate-500">安全地管理与轮换密钥，确保每次调用都在掌控之中。</p>
      <div class="mt-4 h-px w-full bg-slate-200"></div>
    </header>

    <section class="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200/60">
      <div class="space-y-4">
        <p class="text-sm font-medium text-slate-700">View or generate your API key below:</p>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          @click="handleViewKey"
        >
          View API Key
        </button>
        <p class="text-xs leading-relaxed text-slate-500">
          If you suspect your API key has been compromised or simply want to issue a new one, click below to rotate it. Your existing key will be revoked instantly.
        </p>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          @click="rotateKey"
        >
          Rotate API Key
        </button>
        <transition name="fade">
          <div
            v-if="showKey"
            class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono text-slate-700"
          >
            {{ maskedKey }}
          </div>
        </transition>
        <transition name="fade">
          <div
            v-if="showWarning"
            class="flex items-start gap-3 rounded-2xl bg-amber-100/80 px-4 py-3 text-sm text-amber-900"
          >
            <span class="text-lg">⚠️</span>
            <p>
              You must be on the API plan to access an API key! Please check out our API Subscription plans
              <button type="button" class="font-semibold text-primary-600 underline-offset-2 hover:underline" @click="$emit('openPlans')">here</button>.
            </p>
          </div>
        </transition>
      </div>
      <div class="mt-6 h-px w-full bg-slate-200"></div>
      <p class="mt-4 text-sm text-slate-600">
        To view starter code and the API schema documentation click
        <button type="button" class="font-semibold text-primary-600 underline-offset-2 hover:underline" @click="$emit('openDocs')">
          here
        </button>
        .
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  hasApiPlan: {
    type: Boolean,
    default: false,
  },
  apiKey: {
    type: String,
    default: 'vs_live_********************',
  },
});

const emit = defineEmits(['openPlans', 'openDocs', 'rotate', 'view']);

const viewAttempted = ref(false);

const showWarning = computed(() => viewAttempted.value && !props.hasApiPlan);
const showKey = computed(() => viewAttempted.value && props.hasApiPlan);

const maskedKey = computed(() => {
  if (!props.apiKey) return '未生成密钥';
  if (showKey.value) return props.apiKey;
  return props.apiKey.replace(/.(?=.{4})/g, '•');
});

const handleViewKey = () => {
  viewAttempted.value = true;
  emit('view');
};

const rotateKey = () => {
  emit('rotate', new Date());
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
