<template>
  <div class="space-y-5">
    <AdminFilterBar
      v-model:searchValue="filters.search"
      search-label="用户搜索"
      search-placeholder="按邮箱或用户名搜索"
      @search="handleSearch"
      @reset="resetFilters"
    >
      <template #filters>
        <AdminSelect v-model="filters.systemRole" label="系统角色" :options="roleFilterOptions" placeholder="全部角色" />
        <AdminSelect v-model="filters.isActive" label="状态" :options="activeFilterOptions" placeholder="全部状态" />
        <div class="min-w-0">
          <label for="users-plan-filter" class="admin-kicker">套餐</label>
          <input id="users-plan-filter" v-model="filters.planTier" type="text" placeholder="personal-free / team" class="admin-field mt-2" />
        </div>
      </template>
    </AdminFilterBar>

    <div v-if="errorMessage" role="alert" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ errorMessage }}
    </div>

    <AdminDataTable
      :columns="columns"
      :rows="items"
      :loading="loading"
      empty-title="没有符合条件的用户"
      empty-description="调整筛选条件后再试。"
      row-clickable
      @rowClick="openUser"
    >
      <template #cell-systemRole="{ value }">
        <span class="rounded-md bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700">{{ value }}</span>
      </template>
      <template #cell-planTier="{ value }">
        <span class="text-sm text-slate-600">{{ value }}</span>
      </template>
      <template #cell-isActive="{ value }">
        <span :class="['rounded-md px-2.5 py-1 text-xs font-semibold', value ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600']">
          {{ value ? '启用' : '停用' }}
        </span>
      </template>
      <template #cell-creditsRemaining="{ value }">
        <span class="font-semibold tabular-nums text-slate-900">{{ formatNumber(value) }}</span>
      </template>
      <template #cell-createdAt="{ value }">{{ formatDateTime(value) }}</template>
      <template #actions="{ row }">
        <button type="button" class="admin-secondary-btn liquid-glass" @click="openUser(row)">查看</button>
      </template>
    </AdminDataTable>

    <AdminPagination :page="page" :total-pages="totalPages" :total="total" :loading="loading" @change="changePage" />

    <div v-if="drawerOpen" class="fixed inset-0 z-50 !mt-0 flex justify-end bg-slate-900/35 backdrop-blur-sm" @click.self="closeDrawer">
      <div class="flex h-full min-h-0 w-full max-w-3xl flex-col border-l border-slate-200 bg-white shadow-xl [overflow-wrap:anywhere]">
        <div class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-6">
          <div class="min-w-0">
            <h2 class="text-lg font-semibold text-slate-900">{{ selectedUser?.name || '用户详情' }}</h2>
            <p class="mt-1 break-all text-sm text-slate-600">{{ selectedUser?.email || '-' }}</p>
          </div>
          <button type="button" class="admin-secondary-btn liquid-glass shrink-0" @click="closeDrawer">关闭</button>
        </div>

        <div class="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          <div v-if="drawerError" role="alert" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {{ drawerError }}
          </div>

          <section class="rounded-xl border border-primary-100 bg-primary-50/70 p-4 sm:p-5">
            <div class="flex flex-wrap items-center gap-3">
              <span class="text-xs font-semibold text-primary-700">{{ selectedUser?.systemRole || '-' }}</span>
              <span class="text-xs text-slate-600">{{ selectedUser?.planTier || '-' }}</span>
              <span :class="['rounded-md px-2.5 py-1 text-xs font-semibold', selectedUser?.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600']">
                {{ selectedUser?.isActive ? '启用' : '停用' }}
              </span>
            </div>

            <div class="mt-5 grid grid-cols-3 gap-3 sm:gap-5">
              <div class="min-w-0">
                <p class="admin-kicker">总额度</p>
                <p class="mt-2 text-xl font-semibold tabular-nums text-slate-900 sm:text-2xl">{{ formatNumber(selectedUser?.creditsTotal) }}</p>
              </div>
              <div class="min-w-0">
                <p class="admin-kicker">已使用</p>
                <p class="mt-2 text-xl font-semibold tabular-nums text-slate-900 sm:text-2xl">{{ formatNumber(selectedUser?.creditsUsed) }}</p>
              </div>
              <div class="min-w-0">
                <p class="admin-kicker">剩余额度</p>
                <p class="mt-2 text-xl font-semibold tabular-nums text-primary-700 sm:text-2xl">{{ formatNumber(selectedUser?.creditsRemaining) }}</p>
              </div>
            </div>
          </section>

          <section class="grid gap-6 border-b border-slate-200 pb-6 sm:grid-cols-2">
            <form class="min-w-0" @submit.prevent="saveUser">
              <h3 class="text-base font-semibold text-slate-900">编辑用户</h3>

              <div class="mt-4 space-y-4">
                <AdminSelect v-model="editForm.systemRole" label="系统角色" :options="roleSelectOptions" placeholder="选择角色" />
                <div>
                  <label for="user-edit-plan" class="admin-kicker">套餐</label>
                  <input id="user-edit-plan" v-model="editForm.planTier" type="text" class="admin-field mt-2" />
                </div>
                <AdminSelect v-model="editForm.isActive" label="状态" :options="statusSelectOptions" placeholder="选择状态" />
              </div>

              <button type="submit" class="admin-primary-btn liquid-glass primary-action mt-5" :disabled="savingUser" :aria-busy="savingUser">
                {{ savingUser ? '保存中...' : '保存修改' }}
              </button>
            </form>

            <form class="min-w-0 border-t border-slate-200 pt-6 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0" @submit.prevent="adjustCredits">
              <h3 class="text-base font-semibold text-slate-900">额度调整</h3>

              <div class="mt-4 space-y-4">
                <div>
                  <label for="user-credit-delta" class="admin-kicker">增减值</label>
                  <input id="user-credit-delta" v-model.number="creditsForm.delta" type="number" class="admin-field mt-2" />
                </div>
                <div>
                  <label for="user-credit-reason" class="admin-kicker">原因</label>
                  <textarea id="user-credit-reason" v-model="creditsForm.reason" rows="4" class="admin-field mt-2"></textarea>
                </div>
              </div>

              <button type="submit" class="admin-primary-btn liquid-glass primary-action mt-5" :disabled="savingCredits" :aria-busy="savingCredits">
                {{ savingCredits ? '提交中...' : '调整额度' }}
              </button>
            </form>
          </section>

          <section class="border-b border-slate-200 pb-6">
            <h3 class="text-base font-semibold text-slate-900">资料</h3>

            <dl class="mt-4 grid gap-4 md:grid-cols-2">
              <div><dt class="admin-kicker">名</dt><dd class="mt-1 text-sm text-slate-700">{{ selectedUser?.profile?.firstName || '-' }}</dd></div>
              <div><dt class="admin-kicker">姓</dt><dd class="mt-1 text-sm text-slate-700">{{ selectedUser?.profile?.surname || '-' }}</dd></div>
              <div><dt class="admin-kicker">组织</dt><dd class="mt-1 text-sm text-slate-700">{{ selectedUser?.profile?.organization || '-' }}</dd></div>
              <div><dt class="admin-kicker">职业</dt><dd class="mt-1 text-sm text-slate-700">{{ selectedUser?.profile?.jobRole || '-' }}</dd></div>
              <div><dt class="admin-kicker">行业</dt><dd class="mt-1 text-sm text-slate-700">{{ selectedUser?.profile?.industry || '-' }}</dd></div>
            </dl>
          </section>

          <section>
            <h3 class="text-base font-semibold text-slate-900">最近检测</h3>

            <div class="mt-2 divide-y divide-slate-200">
              <div v-for="item in selectedUser?.recentDetections || []" :key="item.id" class="py-4">
                <div class="flex items-start justify-between gap-4">
                  <p class="font-semibold" :class="item.label === 'ai' ? 'text-blue-700' : item.label === 'human' ? 'text-cyan-800' : 'text-slate-700'">{{ String(item.label).toUpperCase() }}</p>
                  <span class="text-xs text-slate-500">AI 概率 <strong class="font-semibold tabular-nums text-slate-900">{{ formatScore(item.score) }}</strong></span>
                </div>
                <div class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{{ formatNumber(item.charsUsed) }} 字符</span>
                  <span>{{ formatDateTime(item.createdAt) }}</span>
                </div>
              </div>
              <p v-if="!(selectedUser?.recentDetections || []).length" class="py-8 text-center text-sm text-slate-500">暂无记录</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import AdminDataTable from '../../components/admin/AdminDataTable.vue';
import AdminFilterBar from '../../components/admin/AdminFilterBar.vue';
import AdminPagination from '../../components/admin/AdminPagination.vue';
import AdminSelect from '../../components/admin/AdminSelect.vue';
import { adjustAdminUserCredits, fetchAdminUser, fetchAdminUsers, updateAdminUser } from '../../api/modules/admin';
import { showToast } from '../../utils/toast';

const roleFilterOptions = [
  { value: '', label: '全部角色' },
  { value: 'INDIVIDUAL', label: 'INDIVIDUAL' },
  { value: 'TEAM_ADMIN', label: 'TEAM_ADMIN' },
  { value: 'SYS_ADMIN', label: 'SYS_ADMIN' },
];

const activeFilterOptions = [
  { value: '', label: '全部状态' },
  { value: true, label: '启用' },
  { value: false, label: '停用' },
];

const roleSelectOptions = roleFilterOptions.filter((option) => option.value);
const statusSelectOptions = [
  { value: true, label: '启用' },
  { value: false, label: '停用' },
];

const columns = [
  { key: 'email', label: '邮箱' },
  { key: 'name', label: '用户名' },
  { key: 'systemRole', label: '系统角色' },
  { key: 'planTier', label: '套餐' },
  { key: 'isActive', label: '状态' },
  { key: 'creditsRemaining', label: '剩余额度' },
  { key: 'createdAt', label: '创建时间' },
];

const loading = ref(false);
const errorMessage = ref('');
const items = ref([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);

const filters = reactive({
  search: '',
  systemRole: '',
  isActive: '',
  planTier: '',
});

const drawerOpen = ref(false);
const drawerError = ref('');
const selectedUser = ref(null);
const savingUser = ref(false);
const savingCredits = ref(false);

const editForm = reactive({
  systemRole: 'INDIVIDUAL',
  planTier: '',
  isActive: true,
});

const creditsForm = reactive({
  delta: 0,
  reason: '',
});

const totalPages = computed(() => Math.max(1, Math.ceil((Number(total.value) || 0) / pageSize.value)));

async function loadUsers() {
  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await fetchAdminUsers({
      page: page.value,
      pageSize: pageSize.value,
      search: filters.search,
      systemRole: filters.systemRole || '',
      isActive: filters.isActive === '' ? '' : filters.isActive,
      planTier: filters.planTier,
    });
    items.value = response.items;
    total.value = response.total;
    page.value = response.page;
    pageSize.value = response.pageSize;
  } catch (error) {
    errorMessage.value = error?.message || '用户列表加载失败';
    showToast({ title: '用户管理', message: errorMessage.value });
  } finally {
    loading.value = false;
  }
}

async function handleSearch() {
  page.value = 1;
  await loadUsers();
}

async function resetFilters() {
  filters.search = '';
  filters.systemRole = '';
  filters.isActive = '';
  filters.planTier = '';
  page.value = 1;
  await loadUsers();
}

async function changePage(nextPage) {
  const safePage = Math.min(Math.max(1, nextPage), totalPages.value);
  if (safePage === page.value) return;
  page.value = safePage;
  await loadUsers();
}

function syncFormFromUser(user) {
  if (!user) return;
  editForm.systemRole = user.systemRole || 'INDIVIDUAL';
  editForm.planTier = user.planTier || '';
  editForm.isActive = Boolean(user.isActive);
  creditsForm.delta = 0;
  creditsForm.reason = '';
}

async function openUser(row) {
  if (!row?.id) return;
  drawerOpen.value = true;
  drawerError.value = '';
  selectedUser.value = null;

  try {
    const detail = await fetchAdminUser(row.id);
    selectedUser.value = detail;
    syncFormFromUser(detail);
  } catch (error) {
    drawerError.value = error?.message || '用户详情加载失败';
    showToast({ title: '用户详情', message: drawerError.value });
  }
}

async function refreshSelectedUser() {
  if (!selectedUser.value?.id) return;
  const detail = await fetchAdminUser(selectedUser.value.id);
  selectedUser.value = detail;
  syncFormFromUser(detail);
}

function closeDrawer() {
  drawerOpen.value = false;
  drawerError.value = '';
  selectedUser.value = null;
}

async function saveUser() {
  if (!selectedUser.value?.id) return;
  savingUser.value = true;
  drawerError.value = '';

  try {
    const updated = await updateAdminUser(selectedUser.value.id, {
      systemRole: editForm.systemRole,
      planTier: editForm.planTier,
      isActive: editForm.isActive,
    });
    selectedUser.value = updated;
    syncFormFromUser(updated);
    await loadUsers();
    showToast({ title: '用户管理', message: '用户信息已更新' });
  } catch (error) {
    drawerError.value = error?.message || '保存失败';
    showToast({ title: '用户管理', message: drawerError.value });
  } finally {
    savingUser.value = false;
  }
}

async function adjustCredits() {
  if (!selectedUser.value?.id) return;
  savingCredits.value = true;
  drawerError.value = '';

  try {
    await adjustAdminUserCredits(selectedUser.value.id, {
      delta: Number(creditsForm.delta) || 0,
      reason: creditsForm.reason || 'Manual adjustment',
    });
    await refreshSelectedUser();
    await loadUsers();
    showToast({ title: '额度调整', message: '用户额度已更新' });
  } catch (error) {
    drawerError.value = error?.message || '额度调整失败';
    showToast({ title: '额度调整', message: drawerError.value });
  } finally {
    savingCredits.value = false;
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat('zh-CN').format(Number(value) || 0);
}

function formatDateTime(value) {
  return value
    ? new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
    : '-';
}

function formatScore(value) {
  return `${Math.round((Number(value) || 0) * 100)}%`;
}

onMounted(loadUsers);
</script>

<style scoped>
.admin-field {
  @apply min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100;
}

.admin-kicker {
  @apply block text-sm font-medium text-slate-600;
}

.admin-primary-btn {
  @apply inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed;
}

.admin-primary-btn.liquid-glass:disabled {
  color: #fff;
  background: #526ca4;
  box-shadow: none;
}

.admin-secondary-btn {
  @apply inline-flex min-h-10 items-center justify-center rounded-full px-3.5 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50;
}
</style>
