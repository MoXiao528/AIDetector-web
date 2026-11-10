<template>
  <TransitionRoot as="template" :show="open" @after-leave="restoreTriggerFocus">
    <Dialog class="relative z-50" @close="$emit('close')">
      <TransitionChild as="template" enter="transition-opacity duration-150 motion-reduce:transition-none" enter-from="opacity-0" enter-to="opacity-100" leave="transition-opacity duration-150 motion-reduce:transition-none" leave-from="opacity-100" leave-to="opacity-0">
        <div class="fixed inset-0 bg-slate-900/35 backdrop-blur-sm" aria-hidden="true"></div>
      </TransitionChild>
      <div class="fixed inset-0 overflow-y-auto">
        <div class="flex min-h-full items-center justify-center p-4">
          <TransitionChild as="template" enter="transition-opacity duration-150 motion-reduce:transition-none" enter-from="opacity-0" enter-to="opacity-100" leave="transition-opacity duration-150 motion-reduce:transition-none" leave-from="opacity-100" leave-to="opacity-0">
            <DialogPanel class="public-theme login-prompt-panel max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 p-5 font-sans shadow-lg shadow-slate-900/10 sm:p-6" style="background: #fff">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <DialogTitle as="h3" class="text-lg font-semibold text-slate-900">{{ t('loginPrompt.title') }}</DialogTitle>
                  <DialogDescription class="mt-2 break-words text-sm leading-6 text-slate-600">
                    {{ displayMessage }}
                  </DialogDescription>
                </div>
                <button type="button" class="liquid-glass inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full" :aria-label="t('loginPrompt.close')" @click="$emit('close')">
                  <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div class="mt-6 space-y-3">
                <RouterLink
                  :to="loginTo"
                  class="liquid-glass primary-action flex w-full items-center justify-center rounded-full px-4 py-3 text-center text-sm font-semibold"
                  @click="closeForNavigation"
                >
                  {{ t('loginPrompt.login') }}
                </RouterLink>
                <RouterLink
                  :to="registerTo"
                  class="liquid-glass flex w-full items-center justify-center rounded-full px-4 py-3 text-center text-sm font-semibold"
                  @click="closeForNavigation"
                >
                  {{ t('loginPrompt.register') }}
                </RouterLink>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { computed, nextTick, toRefs, watch } from 'vue';
import { Dialog, DialogDescription, DialogPanel, DialogTitle, TransitionChild, TransitionRoot } from '@headlessui/vue';
import { useRoute } from 'vue-router';
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
  loginTo: {
    type: [String, Object],
    default: '/login',
  },
  registerTo: {
    type: [String, Object],
    default: '/register',
  },
});

const emit = defineEmits(['close']);

const { open, message, loginTo, registerTo } = toRefs(props);
const { t } = useI18n();
const route = useRoute();
let returnFocusTarget = null;
let openingRoute = '';

watch(open, (isOpen) => {
  if (!isOpen || typeof document === 'undefined') return;
  const active = document.activeElement;
  returnFocusTarget = active instanceof HTMLElement && active !== document.body ? active : null;
  openingRoute = route.fullPath;
}, { immediate: true });

const restoreTriggerFocus = async () => {
  const target = returnFocusTarget;
  const originalRoute = openingRoute;
  await nextTick();
  if (open.value || route.fullPath !== originalRoute || !target?.isConnected || target.matches(':disabled, [aria-disabled="true"]')) return;
  target.focus({ preventScroll: true });
};

const closeForNavigation = () => {
  returnFocusTarget = null;
  emit('close');
};

const displayMessage = computed(() => message.value || t('loginPrompt.default'));
</script>
