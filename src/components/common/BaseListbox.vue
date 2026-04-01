<template>
  <Listbox :model-value="modelValue" :disabled="disabled" @update:model-value="updateValue">
    <div class="relative">
      <ListboxButton
        :id="buttonId"
        :aria-label="ariaLabel"
        :class="[
          'flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
          disabled ? 'cursor-not-allowed bg-slate-50 text-slate-400' : '',
          buttonClass,
        ]"
      >
        <span :class="displayClass">{{ displayLabel }}</span>
        <ChevronUpDownIcon class="ml-2 h-4 w-4 text-slate-400" />
      </ListboxButton>
      <transition name="fade">
        <ListboxOptions
          class="absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-2 text-sm text-slate-600 shadow-xl focus:outline-none"
        >
          <ListboxOption
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            as="template"
            v-slot="{ active, selected }"
          >
            <li
              :class="[
                'cursor-pointer rounded-xl px-3 py-2 transition',
                active ? 'bg-slate-100 text-slate-900' : 'text-slate-600',
              ]"
            >
              <div class="flex items-center justify-between">
                <span class="font-semibold">{{ option.label }}</span>
                <CheckIcon v-if="selected" class="h-4 w-4 text-primary-500" />
              </div>
              <p v-if="option.description" class="mt-1 text-xs text-slate-500">{{ option.description }}</p>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>

<script setup>
import { computed } from 'vue';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/vue/24/outline';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/vue';

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
    default: '',
  },
  buttonId: {
    type: String,
    default: '',
  },
  ariaLabel: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  buttonClass: {
    type: String,
    default: '',
  },
  displayClass: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const selectedOption = computed(() => props.options.find((option) => option.value === props.modelValue));
const displayLabel = computed(() => selectedOption.value?.label || props.placeholder);

const updateValue = (value) => {
  emit('update:modelValue', value);
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
