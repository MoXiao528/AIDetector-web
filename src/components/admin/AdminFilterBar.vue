<template>
  <form class="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/20" @submit.prevent="emit('search')">
    <div class="flex flex-col gap-4 xl:flex-row xl:items-end">
      <div v-if="showSearch" class="flex-1">
        <label class="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">{{ searchLabel }}</label>
        <input
          :value="searchValue"
          type="search"
          :placeholder="searchPlaceholder"
          class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 shadow-sm outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200/40"
          @input="emit('update:searchValue', $event.target.value)"
        />
      </div>

      <div class="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <slot name="filters" />
      </div>

      <div class="flex flex-wrap items-center gap-3 xl:justify-end">
        <slot name="actions" />
        <button
          v-if="showReset"
          type="button"
          class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10"
          @click="emit('reset')"
        >
          {{ resetLabel }}
        </button>
        <button type="submit" class="rounded-2xl bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300">
          {{ submitLabel }}
        </button>
      </div>
    </div>
  </form>
</template>

<script setup>
defineProps({
  searchValue: {
    type: String,
    default: '',
  },
  searchLabel: {
    type: String,
    default: '搜索',
  },
  searchPlaceholder: {
    type: String,
    default: '输入关键词',
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
  showReset: {
    type: Boolean,
    default: true,
  },
  resetLabel: {
    type: String,
    default: '重置',
  },
  submitLabel: {
    type: String,
    default: '查询',
  },
});

const emit = defineEmits(['update:searchValue', 'search', 'reset']);
</script>
