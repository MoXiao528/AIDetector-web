<template>
  <header class="border-b border-white/10 bg-slate-900/80 px-4 py-5 backdrop-blur sm:px-6 lg:px-8">
    <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div class="space-y-2">
        <p v-if="eyebrow" class="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">{{ eyebrow }}</p>
        <h1 class="text-2xl font-semibold tracking-tight text-white">{{ title }}</h1>
        <p v-if="description" class="max-w-3xl text-sm leading-6 text-slate-400">{{ description }}</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
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
    return 'rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10';
  }
  if (action.variant === 'secondary') {
    return 'rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:border-sky-300/50 hover:bg-sky-400/20';
  }
  return 'rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300';
};
</script>
