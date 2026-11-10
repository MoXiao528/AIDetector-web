<template>
  <div class="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white" :aria-busy="loading">
    <div v-if="loading" role="status" class="p-10 text-center text-sm text-slate-500">
      <div class="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary-600" aria-hidden="true"></div>
      正在加载数据...
    </div>

    <div v-else-if="!rows.length" class="p-10 text-center">
      <p class="text-sm font-semibold text-slate-800">{{ emptyTitle }}</p>
      <p class="mt-2 text-sm text-slate-500">{{ emptyDescription }}</p>
      <slot name="empty" />
    </div>

    <div v-else class="w-full overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="['whitespace-nowrap px-4 py-3 text-left text-xs font-semibold text-slate-600', column.headerClass || '']"
            >
              {{ column.label }}
            </th>
            <th v-if="$slots.actions" class="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold text-slate-600">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr
            v-for="row in rows"
            :key="getRowKey(row)"
            class="transition-colors hover:bg-primary-50/50"
            :class="rowClickable ? 'cursor-pointer' : ''"
            @click="rowClickable && emit('rowClick', row)"
          >
            <td v-for="column in columns" :key="column.key" :class="['px-4 py-3.5 text-sm text-slate-700', column.cellClass || '']">
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]" :column="column">
                <span v-if="row[column.key] === undefined || row[column.key] === null" class="text-slate-500">-</span>
                <span v-else>{{ row[column.key] }}</span>
              </slot>
            </td>
            <td v-if="$slots.actions" class="px-4 py-4 text-right">
              <div class="inline-flex items-center gap-2 whitespace-nowrap" @click.stop>
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
