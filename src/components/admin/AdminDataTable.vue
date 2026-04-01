<template>
  <div class="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-lg shadow-slate-950/20">
    <div v-if="loading" class="p-10 text-center text-sm text-slate-400">
      <div class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-amber-400"></div>
      正在加载数据...
    </div>

    <div v-else-if="!rows.length" class="p-10 text-center">
      <p class="text-sm font-semibold text-white">{{ emptyTitle }}</p>
      <p class="mt-2 text-sm text-slate-400">{{ emptyDescription }}</p>
      <slot name="empty" />
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-white/10">
        <thead class="bg-white/5">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="['px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-400', column.headerClass || '']"
            >
              {{ column.label }}
            </th>
            <th v-if="$slots.actions" class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr
            v-for="row in rows"
            :key="getRowKey(row)"
            class="transition hover:bg-white/[0.03]"
            :class="rowClickable ? 'cursor-pointer' : ''"
            @click="rowClickable && emit('rowClick', row)"
          >
            <td v-for="column in columns" :key="column.key" :class="['px-4 py-4 text-sm text-slate-200', column.cellClass || '']">
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]" :column="column">
                <span v-if="row[column.key] === undefined || row[column.key] === null" class="text-slate-500">-</span>
                <span v-else>{{ row[column.key] }}</span>
              </slot>
            </td>
            <td v-if="$slots.actions" class="px-4 py-4 text-right">
              <div class="inline-flex items-center gap-2" @click.stop>
                <slot name="actions" :row="row" />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  columns: {
    type: Array,
    default: () => [],
  },
  rows: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  emptyTitle: {
    type: String,
    default: '没有数据',
  },
  emptyDescription: {
    type: String,
    default: '当前筛选条件下没有结果。',
  },
  rowKey: {
    type: [String, Function],
    default: 'id',
  },
  rowClickable: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['rowClick']);

const getRowKey = (row) => {
  if (typeof props.rowKey === 'function') return props.rowKey(row);
  return row?.[props.rowKey];
};
</script>
