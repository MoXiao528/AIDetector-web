<template>
  <Listbox :model-value="modelValue" :disabled="disabled" @update:model-value="emit('update:modelValue', $event)">
    <div class="relative">
      <ListboxButton :id="buttonId" :aria-label="ariaLabel" :class="['admin-select-button', buttonClass, disabled ? 'cursor-not-allowed opacity-60' : '']">
        <div class="min-w-0">
          <p v-if="label" class="mb-1 text-xs font-medium text-slate-500">{{ label }}</p>
          <p :class="['truncate text-sm font-semibold text-slate-800', textClass]">{{ selectedLabel || placeholder }}</p>
        </div>
        <ChevronUpDownIcon class="ml-3 h-4 w-4 shrink-0 text-slate-500" />
      </ListboxButton>

      <transition name="fade">
        <ListboxOptions :class="['admin-select-options', optionsClass]">
          <ListboxOption v-for="option in options" :key="String(option.value)" :value="option.value" as="template" v-slot="{ active, selected }">
            <li :class="['cursor-pointer rounded-lg px-3 py-2.5 transition', active || selected ? 'bg-primary-50 text-primary-700' : 'text-slate-700']">
              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold">{{ option.label }}</p>
                  <p v-if="option.description" class="mt-1 text-xs text-slate-500">{{ option.description }}</p>
                </div>
                <CheckIcon v-if="selected" class="h-4 w-4 shrink-0 text-primary-600" />
              </div>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>

<script setup>
import { computed } from 'vue';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/24/outline';

const props = defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: '请选择',
  },
  label: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  buttonId: {
    type: String,
    default: '',
  },
  ariaLabel: {
    type: String,
    default: '',
  },
  buttonClass: {
    type: String,
    default: '',
  },
  optionsClass: {
    type: String,
    default: '',
  },
  textClass: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const selectedLabel = computed(() => props.options.find((option) => option.value === props.modelValue)?.label || '');
</script>

<style scoped>
.admin-select-button {
  @apply flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left outline-none transition hover:border-primary-300 focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-100;
}

.admin-select-options {
  @apply absolute z-40 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 outline-none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
