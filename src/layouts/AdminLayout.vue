<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.14),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.18),_transparent_32%)]"></div>
    <div class="relative mx-auto flex min-h-screen w-full max-w-[1800px] flex-col lg:flex-row">
      <AdminSidebar :items="navItems" />

      <div class="flex min-h-screen flex-1 flex-col">
        <AdminTopbar
          :title="pageContent.title"
          :description="pageContent.description"
          :actions="topbarActions"
          @action="handleTopbarAction"
        />

        <main class="flex-1 px-4 pb-6 pt-2 sm:px-6 lg:px-8 lg:pb-8">
          <div class="min-h-full rounded-[28px] border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur sm:p-6">
            <RouterView />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RouterView, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import AdminSidebar from '../components/admin/AdminSidebar.vue';
import AdminTopbar from '../components/admin/AdminTopbar.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const navItems = [
  {
    to: { name: 'admin-overview' },
    label: '概览',
  },
  {
    to: { name: 'admin-users' },
    label: '用户',
  },
  {
    to: { name: 'admin-detections' },
    label: '检测',
  },
];

const pageMap = {
  'admin-overview': {
    title: '管理员概览',
    description: '查看用户、检测量、字符消耗和最近活动，按当前周期查看整体走势。',
  },
  'admin-users': {
    title: '用户管理',
    description: '按角色、套餐和状态筛选用户，支持详情查看、状态修改和额度调整。',
  },
  'admin-detections': {
    title: '检测记录',
    description: '按用户、标签、时间和功能筛选全站检测记录，支持详情查看和删除。',
  },
};

const pageContent = computed(() => pageMap[route.name] || pageMap['admin-overview']);

const topbarActions = computed(() => [
  {
    key: 'to-dashboard',
    label: '回到工作台',
    to: { name: 'dashboard' },
    variant: 'secondary',
  },
  {
    key: 'logout',
    label: '退出登录',
    action: 'logout',
    variant: 'ghost',
  },
]);

const handleTopbarAction = async (action) => {
  if (!action || typeof action !== 'object') return;

  if (action.action === 'logout') {
    await authStore.logout();
    return;
  }

  if (action.to) {
    router.push(action.to);
  }
};
</script>
