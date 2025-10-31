<template>
  <div class="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)]">
    <nav class="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
      <p class="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">API Suite</p>
      <div class="mt-4 space-y-2">
        <button
          type="button"
          :class="navClass('subscription')"
          @click="setTab('subscription')"
        >
          API Subscription Plans
        </button>
        <button
          type="button"
          :class="navClass('key')"
          @click="setTab('key')"
        >
          View API Key
        </button>
        <button
          type="button"
          :class="navClass('docs')"
          @click="openDocs"
        >
          API Docs
        </button>
      </div>
    </nav>
    <div class="min-h-[560px] rounded-3xl bg-transparent">
      <ApiSubscriptionPanel
        v-if="activeTab === 'subscription'"
        @startCheckout="emit('startCheckout', $event)"
      />
      <ApiKeyPanel
        v-else-if="activeTab === 'key'"
        :has-api-plan="hasApiPlan"
        :api-key="apiKey"
        @open-plans="setTab('subscription')"
        @open-docs="openDocs"
        @rotate="emit('rotateKey', $event)"
        @view="emit('viewKey')"
      />
      <div v-else class="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/70 text-sm text-slate-500">
        请选择左侧的功能以继续。
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import ApiKeyPanel from './ApiKeyPanel.vue';
import ApiSubscriptionPanel from './ApiSubscriptionPanel.vue';

const props = defineProps({
  tab: {
    type: String,
    default: 'subscription',
  },
  hasApiPlan: {
    type: Boolean,
    default: false,
  },
  apiKey: {
    type: String,
    default: 'vs_live_********************',
  },
});

const emit = defineEmits(['startCheckout', 'rotateKey', 'viewKey', 'update:tab']);

const router = useRouter();
const activeTab = ref(props.tab);

watch(
  () => props.tab,
  (next) => {
    if (next && next !== activeTab.value) {
      activeTab.value = next;
    }
  }
);

const setTab = (tab) => {
  if (tab === 'docs') {
    openDocs();
    return;
  }
  activeTab.value = tab;
  emit('update:tab', tab);
};

const openDocs = () => {
  const { href } = router.resolve({ name: 'api-docs' });
  if (typeof window !== 'undefined') {
    window.open(href, '_blank', 'noopener');
  }
};

const navClass = computed(() => (tab) => {
  const isActive = activeTab.value === tab;
  return [
    'w-full rounded-2xl px-4 py-2 text-left text-sm font-semibold transition',
    isActive
      ? 'bg-slate-900 text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ];
});
</script>
