<template>
  <form class="rounded-2xl border border-slate-200 bg-white p-4" @submit.prevent="emit('search')">
    <div class="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
      <div v-if="showSearch" class="order-1 min-w-0">
        <label class="mb-2 block text-xs font-medium text-slate-600">{{ searchLabel }}</label>
        <input
          :value="searchValue"
          type="search"
          :placeholder="searchPlaceholder"
          class="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          :aria-label="searchLabel"
          @input="emit('update:searchValue', $event.target.value)"
        />
      </div>

      <div class="order-2 grid min-w-0 gap-4 md:order-3 md:col-span-2 md:grid-cols-2 xl:grid-cols-3">
        <slot name="filters" />
      </div>

      <div class="order-3 flex flex-wrap items-center justify-end gap-2 md:order-2">
        <slot name="actions" />
        <button
          v-if="showReset"
          type="button"
          class="liquid-glass rounded-full px-4 py-2.5 text-sm font-semibold"
          @click="emit('reset')"
        >
          {{ resetLabel }}
        </button>
        <button type="submit" class="liquid-glass primary-action rounded-full px-5 py-2.5 text-sm font-semibold">
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
