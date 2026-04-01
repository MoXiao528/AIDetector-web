<template>
  <Popover class="relative" v-slot="{ close }">
    <PopoverButton class="admin-date-button">
      <div class="min-w-0 text-left">
        <p v-if="label" class="mb-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{{ label }}</p>
        <p class="truncate text-sm font-semibold text-slate-100">{{ displayText }}</p>
      </div>
      <CalendarDaysIcon class="ml-3 h-4 w-4 shrink-0 text-slate-500" />
    </PopoverButton>

    <transition name="fade">
      <PopoverPanel class="admin-date-panel">
        <div class="flex items-center gap-2">
          <button type="button" class="nav-btn" @click="changeMonth(-1)">
            <ChevronLeftIcon class="h-4 w-4" />
          </button>

          <div class="grid min-w-0 flex-1 grid-cols-2 gap-2">
            <AdminSelect
              v-model="selectedYear"
              :options="yearOptions"
              placeholder="年份"
              aria-label="选择年份"
              button-class="min-h-11 rounded-2xl px-4 py-2"
              options-class="z-50 max-h-64"
              text-class="text-left"
            />

            <AdminSelect
              v-model="selectedMonth"
              :options="monthOptions"
              placeholder="月份"
              aria-label="选择月份"
              button-class="min-h-11 rounded-2xl px-4 py-2"
              options-class="z-50 max-h-64"
              text-class="text-left"
            />
          </div>

          <button type="button" class="nav-btn" @click="changeMonth(1)">
            <ChevronRightIcon class="h-4 w-4" />
          </button>
        </div>

        <div class="mt-4 grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          <span v-for="day in weekDays" :key="day">{{ day }}</span>
        </div>

        <div class="mt-3 grid grid-cols-7 gap-2">
          <button
            v-for="day in calendarDays"
            :key="day.key"
            type="button"
            :disabled="day.isPlaceholder || day.isDisabled"
            :class="[
              'flex h-10 items-center justify-center rounded-2xl text-sm font-medium transition',
              day.isSelected ? 'bg-amber-400 text-slate-950' : '',
              day.isToday && !day.isSelected ? 'border border-sky-300/40 text-sky-100' : '',
              day.isPlaceholder ? 'cursor-default text-slate-700' : '',
              day.isDisabled && !day.isPlaceholder ? 'cursor-not-allowed bg-white/[0.02] text-slate-600' : '',
              !day.isPlaceholder && !day.isDisabled && !day.isSelected && !day.isToday ? 'text-slate-200 hover:bg-white/10' : '',
            ]"
            @click="selectDate(day.value, close)"
          >
            {{ day.day }}
          </button>
        </div>

        <div class="mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <button type="button" class="footer-btn" @click="clearValue(close)">清空</button>
          <button type="button" class="footer-btn footer-btn--primary" @click="selectToday(close)">今天</button>
        </div>
      </PopoverPanel>
    </transition>
  </Popover>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline';
import AdminSelect from './AdminSelect.vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '选择日期',
  },
  minValue: {
    type: String,
    default: '',
  },
  maxValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const today = new Date();
const todayKey = formatDate(today);
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
const monthFormatter = new Intl.DateTimeFormat('zh-CN', { month: 'long' });
const displayFormatter = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });

const viewDate = ref(props.modelValue ? startOfMonth(parseDate(props.modelValue)) : startOfMonth(today));

watch(
  () => props.modelValue,
  (value) => {
    if (!value) return;
    const parsed = parseDate(value);
    if (parsed) {
      viewDate.value = startOfMonth(parsed);
    }
  }
);

const selectedYear = computed({
  get: () => viewDate.value.getFullYear(),
  set: (year) => {
    viewDate.value = new Date(Number(year), viewDate.value.getMonth(), 1);
  },
});

const selectedMonth = computed({
  get: () => viewDate.value.getMonth(),
  set: (month) => {
    viewDate.value = new Date(viewDate.value.getFullYear(), Number(month), 1);
  },
});

const monthOptions = computed(() =>
  Array.from({ length: 12 }, (_, index) => ({
    value: index,
    label: monthFormatter.format(new Date(2026, index, 1)),
  }))
);

const yearOptions = computed(() => {
  const minYear = props.minValue ? parseDate(props.minValue)?.getFullYear() ?? 2000 : 2000;
  const maxYear = props.maxValue ? parseDate(props.maxValue)?.getFullYear() ?? today.getFullYear() + 5 : today.getFullYear() + 5;
  const start = Math.min(minYear, viewDate.value.getFullYear() - 5);
  const end = Math.max(maxYear, viewDate.value.getFullYear() + 5);
  return Array.from({ length: end - start + 1 }, (_, index) => {
    const year = start + index;
    return {
      value: year,
      label: `${year} 年`,
    };
  });
});

const displayText = computed(() => {
  if (!props.modelValue) return props.placeholder;
  const parsed = parseDate(props.modelValue);
  return parsed ? displayFormatter.format(parsed) : props.placeholder;
});

const calendarDays = computed(() => {
  const year = viewDate.value.getFullYear();
  const month = viewDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const prefixCount = firstDay.getDay();
  const suffixCount = (7 - ((prefixCount + lastDay.getDate()) % 7 || 7)) % 7;
  const days = [];

  for (let index = 0; index < prefixCount; index += 1) {
    days.push({
      key: `prefix-${year}-${month}-${index}`,
      day: '',
      value: '',
      isPlaceholder: true,
      isSelected: false,
      isToday: false,
      isDisabled: true,
    });
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const date = new Date(year, month, day);
    const value = formatDate(date);
    days.push({
      key: value,
      day,
      value,
      isPlaceholder: false,
      isSelected: value === props.modelValue,
      isToday: value === todayKey,
      isDisabled: !isDateSelectable(value),
    });
  }

  for (let index = 0; index < suffixCount; index += 1) {
    days.push({
      key: `suffix-${year}-${month}-${index}`,
      day: '',
      value: '',
      isPlaceholder: true,
      isSelected: false,
      isToday: false,
      isDisabled: true,
    });
  }

  return days;
});

function changeMonth(delta) {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + delta, 1);
}

function clearValue(close) {
  emit('update:modelValue', '');
  close();
}

function selectToday(close) {
  const value = clampDate(todayKey);
  if (!value) return;
  viewDate.value = startOfMonth(parseDate(value));
  emit('update:modelValue', value);
  close();
}

function selectDate(value, close) {
  if (!value || !isDateSelectable(value)) return;
  emit('update:modelValue', value);
  close();
}

function isDateSelectable(value) {
  if (!value) return false;
  if (props.minValue && value < props.minValue) return false;
  if (props.maxValue && value > props.maxValue) return false;
  return true;
}

function clampDate(value) {
  if (!value) return '';
  if (props.minValue && value < props.minValue) return props.minValue;
  if (props.maxValue && value > props.maxValue) return props.maxValue;
  return value;
}

function parseDate(value) {
  if (!value) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
</script>

<style scoped>
.admin-date-button {
  @apply flex w-full items-center justify-between rounded-[22px] border border-white/10 bg-slate-950/70 px-4 py-3 text-left shadow-sm outline-none transition hover:border-white/20 hover:bg-slate-950 focus-visible:border-amber-300 focus-visible:ring-2 focus-visible:ring-amber-200/30;
}

.admin-date-panel {
  @apply absolute z-30 mt-2 w-[420px] max-w-[calc(100vw-1.5rem)] overflow-visible rounded-[24px] border border-white/10 bg-slate-900/95 p-4 shadow-2xl shadow-slate-950/50 backdrop-blur;
}

.nav-btn {
  @apply inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/20 hover:bg-white/10;
}

.footer-btn {
  @apply inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10;
}

.footer-btn--primary {
  @apply border-transparent bg-amber-400 text-slate-950 hover:bg-amber-300;
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
