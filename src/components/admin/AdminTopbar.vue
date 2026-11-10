<template>
  <header class="border-b border-slate-200/80 bg-white/65 px-4 py-5 backdrop-blur-md sm:px-6 lg:px-8">
    <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div class="min-w-0 space-y-2">
        <p v-if="eyebrow" class="text-xs font-semibold text-primary-600">{{ eyebrow }}</p>
        <h1 class="text-2xl font-semibold tracking-tight text-slate-900">{{ title }}</h1>
        <p v-if="description" class="max-w-3xl text-sm leading-6 text-slate-500">{{ description }}</p>
      </div>

      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <button
          v-for="action in actions"
          :key="action.key || action.label"
          type="button"
          :class="resolveActionClass(action)"
          @click="emit('action', action)"
        >
          {{ action.label }}
        </button>
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<script setup>
const props = defineProps({
  eyebrow: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  actions: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['action']);

const resolveActionClass = (action) => {
  if (action.class) return action.class;
  if (action.variant === 'ghost') {
    return 'liquid-glass rounded-full px-4 py-2 text-sm font-semibold';
  }
  if (action.variant === 'secondary') {
    return 'liquid-glass liquid-glass-selected rounded-full px-4 py-2 text-sm font-semibold';
  }
  return 'liquid-glass primary-action rounded-full px-4 py-2 text-sm font-semibold';
};
</script>
