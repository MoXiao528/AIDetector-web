<template>
  <aside class="border-b border-white/10 bg-slate-950/95 lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
    <div class="border-b border-white/10 px-5 py-5">
      <RouterLink :to="{ name: 'admin-overview' }" class="flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-lg font-black text-slate-950 shadow-lg shadow-amber-500/20">
          A
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">Admin</p>
          <p class="text-base font-semibold text-white">{{ title }}</p>
        </div>
      </RouterLink>
      <p class="mt-3 text-sm leading-6 text-slate-400">{{ subtitle }}</p>
    </div>

    <nav class="flex gap-2 overflow-x-auto px-3 py-3 lg:flex-col lg:overflow-visible lg:px-4 lg:py-5">
      <RouterLink
        v-for="item in normalizedItems"
        :key="item.key"
        :to="item.to"
        class="group inline-flex min-w-max items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition lg:w-full"
        :class="item.key === activeKey ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:bg-white/5 hover:text-white'"
      >
        <component v-if="item.icon" :is="item.icon" class="h-5 w-5 shrink-0" aria-hidden="true" />
        <span>{{ item.label }}</span>
        <span v-if="item.badge" class="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-200 lg:ml-auto">
          {{ item.badge }}
        </span>
      </RouterLink>
    </nav>

    <div class="hidden border-t border-white/10 px-5 py-5 lg:block">
      <div class="rounded-3xl border border-white/10 bg-white/5 p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Current User</p>
        <p class="mt-2 truncate text-sm font-semibold text-white">{{ userLabel }}</p>
        <p class="mt-1 text-xs text-slate-400">{{ userMeta }}</p>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  title: {
    type: String,
    default: 'Control Tower',
  },
  subtitle: {
    type: String,
    default: '管理用户、检测记录和系统运营数据。',
  },
  userLabel: {
    type: String,
    default: 'sys_admin',
  },
  userMeta: {
    type: String,
    default: 'SYS_ADMIN',
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
