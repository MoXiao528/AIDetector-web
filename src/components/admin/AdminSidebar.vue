<template>
  <aside class="min-w-0 border-b border-slate-200/80 bg-white/75 lg:min-h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
    <div class="border-b border-slate-200/70 px-5 py-4 lg:py-5">
      <RouterLink :to="{ name: 'admin-overview' }" class="flex items-center gap-3">
        <BrandMark class="h-10 w-10 shrink-0 text-primary-600" />
        <div>
          <p class="text-xs font-medium text-slate-500">管理后台</p>
          <p class="text-base font-semibold text-slate-900">{{ title }}</p>
        </div>
      </RouterLink>
      <p class="mt-3 hidden text-sm leading-6 text-slate-500 lg:block">{{ subtitle }}</p>
    </div>

    <nav aria-label="管理导航" class="flex gap-2 overflow-x-auto px-3 py-3 lg:flex-col lg:overflow-visible lg:px-4 lg:py-5">
      <RouterLink
        v-for="item in normalizedItems"
        :key="item.key"
        :to="item.to"
        class="group inline-flex flex-1 items-center justify-center gap-3 rounded-full border px-4 py-2.5 text-sm font-semibold transition lg:w-full lg:flex-none lg:justify-start"
        :class="item.key === activeKey ? 'liquid-glass liquid-glass-selected' : 'border-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'"
        :aria-current="item.key === activeKey ? 'page' : undefined"
      >
        <component v-if="item.icon" :is="item.icon" class="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{{ item.label }}</span>
        <span v-if="item.badge" class="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700 lg:ml-auto">
          {{ item.badge }}
        </span>
      </RouterLink>
    </nav>

    <div class="hidden border-t border-slate-200/70 px-5 py-5 lg:block">
      <p class="text-xs font-medium text-slate-500">当前管理员</p>
      <p class="mt-2 truncate text-sm font-semibold text-slate-800">{{ userLabel }}</p>
      <p v-if="userMeta" class="mt-1 break-all text-xs text-slate-500">{{ userMeta }}</p>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import BrandMark from '../common/BrandMark.vue';

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: '管理后台',
  },
  subtitle: {
    type: String,
    default: '管理用户、检测记录和系统运营数据。',
  },
  userLabel: {
    type: String,
    default: '管理员',
  },
  userMeta: {
    type: String,
    default: '',
  },
});

const route = useRoute();

const normalizedItems = computed(() =>
  (props.items || []).map((item, index) => ({
    ...item,
    key: item.key || item.label || String(index),
  }))
);

const activeKey = computed(() => {
  const matchedByName = normalizedItems.value.find((item) => item.to?.name && item.to.name === route.name);
  if (matchedByName) return matchedByName.key;

  const currentPath = route.path;
  const matchedByPath = normalizedItems.value.find((item) => {
    const targetPath = typeof item.to === 'string' ? item.to : item.to?.path;
    return targetPath && currentPath.startsWith(targetPath);
  });
  return matchedByPath?.key || '';
});
</script>
