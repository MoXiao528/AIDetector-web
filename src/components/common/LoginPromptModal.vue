<template>
  <transition name="fade">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">{{ t('loginPrompt.title') }}</h3>
            <p class="mt-2 text-sm text-slate-600">
              {{ displayMessage }}
            </p>
          </div>
          <button type="button" class="rounded-full p-1 text-slate-400 hover:text-slate-600" @click="$emit('close')">
            <span class="sr-only">{{ t('loginPrompt.close') }}</span>
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="mt-6 space-y-3">
          <RouterLink
            to="/login"
            class="flex w-full items-center justify-center rounded-2xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white hover:bg-primary-500"
            @click="$emit('close')"
          >
            {{ t('loginPrompt.login') }}
          </RouterLink>
          <RouterLink
            to="/register"
            class="flex w-full items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-primary-300 hover:text-primary-600"
            @click="$emit('close')"
          >
            {{ t('loginPrompt.register') }}
          </RouterLink>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, toRefs } from 'vue';
import { useI18n } from '../../i18n';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: '',
  },
});

defineEmits(['close']);

const { open, message } = toRefs(props);
const { t } = useI18n();

const displayMessage = computed(() => message.value || t('loginPrompt.default'));
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
