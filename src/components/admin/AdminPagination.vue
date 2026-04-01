<template>
  <div class="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4">
    <p class="text-sm text-slate-400">第 {{ page }} / {{ totalPages }} 页，共 {{ formatNumber(total) }} 条</p>

    <div class="flex flex-wrap items-center gap-2">
      <button type="button" class="admin-page-btn" :disabled="loading || page <= 1" @click="changeTo(1)">首页</button>
      <button type="button" class="admin-page-btn" :disabled="loading || page <= 1" @click="changeTo(page - 1)">上一页</button>

      <div class="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/60 px-3 py-2">
        <span class="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">跳页</span>
        <input
          v-model="draftPage"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          class="admin-page-input"
          @input="sanitizeDraft"
          @keydown.enter.prevent="submitJump"
        />
        <span class="text-sm text-slate-500">/ {{ totalPages }}</span>
      </div>

      <button type="button" class="admin-page-btn" :disabled="loading" @click="submitJump">前往</button>
      <button type="button" class="admin-page-btn" :disabled="loading || page >= totalPages" @click="changeTo(page + 1)">下一页</button>
      <button type="button" class="admin-page-btn" :disabled="loading || page >= totalPages" @click="changeTo(totalPages)">末页</button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  page: {
    type: Number,
    default: 1,
  },
  totalPages: {
    type: Number,
    default: 1,
  },
  total: {
    type: Number,
    default: 0,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['change']);
const draftPage = ref(String(props.page || 1));

watch(
  () => props.page,
  (value) => {
    draftPage.value = String(value || 1);
  }
);

function sanitizeDraft() {
  draftPage.value = draftPage.value.replace(/\D+/g, '');
}

function changeTo(nextPage) {
  const safePage = clamp(nextPage);
  draftPage.value = String(safePage);
  if (safePage !== props.page) {
    emit('change', safePage);
  }
}

function submitJump() {
  const value = draftPage.value ? Number(draftPage.value) : props.page;
  changeTo(value);
}

function clamp(value) {
  return Math.min(Math.max(1, Number(value) || 1), Math.max(1, props.totalPages));
}

function formatNumber(value) {
  return new Intl.NumberFormat('zh-CN').format(Number(value) || 0);
}
</script>

<style scoped>
.admin-page-btn {
  @apply inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50;
}

.admin-page-input {
  @apply w-16 border-0 bg-transparent p-0 text-center text-sm font-semibold text-white outline-none ring-0;
}

.admin-page-input::-webkit-outer-spin-button,
.admin-page-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
</style>
