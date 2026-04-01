<template>
  <div class="space-y-6">
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
        <div>
          <label class="admin-kicker">套餐</label>
          <input v-model="filters.planTier" type="text" placeholder="personal-free / team" class="admin-field mt-2" />
        </div>
      </template>
    </AdminFilterBar>

    <div v-if="errorMessage" class="rounded-3xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
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
        <span class="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-semibold text-sky-100">{{ value }}</span>
      </template>
      <template #cell-planTier="{ value }">
        <span class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">{{ value }}</span>
      </template>
      <template #cell-isActive="{ value }">
        <span :class="['rounded-full px-3 py-1 text-xs font-semibold', value ? 'bg-emerald-400/15 text-emerald-100' : 'bg-slate-500/20 text-slate-300']">
          {{ value ? '启用' : '停用' }}
        </span>
      </template>
      <template #cell-creditsRemaining="{ value }">
        <span class="font-semibold text-white">{{ formatNumber(value) }}</span>
      </template>
      <template #cell-createdAt="{ value }">{{ formatDateTime(value) }}</template>
      <template #actions="{ row }">
        <button type="button" class="admin-secondary-btn" @click="openUser(row)">查看</button>
      </template>
    </AdminDataTable>

    <AdminPagination :page="page" :total-pages="totalPages" :total="total" :loading="loading" @change="changePage" />

    <div v-if="drawerOpen" class="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-sm" @click.self="closeDrawer">
      <div class="flex h-full w-full max-w-3xl flex-col border-l border-white/10 bg-slate-900">
        <div class="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <h2 class="text-lg font-semibold text-white">{{ selectedUser?.name || '用户详情' }}</h2>
            <p class="mt-1 text-sm text-slate-400">{{ selectedUser?.email || '-' }}</p>
          </div>
          <button type="button" class="admin-secondary-btn" @click="closeDrawer">关闭</button>
        </div>

        <div class="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div v-if="drawerError" class="rounded-3xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {{ drawerError }}
          </div>

          <section class="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div class="flex flex-wrap items-center gap-3">
              <span class="rounded-full bg-sky-400/15 px-3 py-1 text-xs font-semibold text-sky-100">{{ selectedUser?.systemRole || '-' }}</span>
              <span class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">{{ selectedUser?.planTier || '-' }}</span>
              <span :class="['rounded-full px-3 py-1 text-xs font-semibold', selectedUser?.isActive ? 'bg-emerald-400/15 text-emerald-100' : 'bg-slate-500/20 text-slate-300']">
                {{ selectedUser?.isActive ? '启用' : '停用' }}
              </span>
            </div>

            <div class="mt-4 grid gap-4 md:grid-cols-3">
              <div>
                <p class="admin-kicker">总额度</p>
                <p class="mt-2 text-2xl font-semibold text-white">{{ formatNumber(selectedUser?.creditsTotal) }}</p>
              </div>
              <div>
                <p class="admin-kicker">已使用</p>
                <p class="mt-2 text-2xl font-semibold text-white">{{ formatNumber(selectedUser?.creditsUsed) }}</p>
              </div>
              <div>
                <p class="admin-kicker">剩余额度</p>
                <p class="mt-2 text-2xl font-semibold text-white">{{ formatNumber(selectedUser?.creditsRemaining) }}</p>
              </div>
            </div>
          </section>

          <section class="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <form class="rounded-3xl border border-white/10 bg-white/5 p-5" @submit.prevent="saveUser">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-semibold text-white">编辑用户</h3>
                <span class="admin-kicker">Update</span>
              </div>

              <div class="mt-4 space-y-4">
                <AdminSelect v-model="editForm.systemRole" label="系统角色" :options="roleSelectOptions" placeholder="选择角色" />
                <div>
                  <label class="admin-kicker">套餐</label>
                  <input v-model="editForm.planTier" type="text" class="admin-field mt-2" />
                </div>
                <AdminSelect v-model="editForm.isActive" label="状态" :options="statusSelectOptions" placeholder="选择状态" />
              </div>

              <button type="submit" class="admin-primary-btn mt-5" :disabled="savingUser">
                {{ savingUser ? '保存中...' : '保存修改' }}
              </button>
            </form>

            <form class="rounded-3xl border border-white/10 bg-white/5 p-5" @submit.prevent="adjustCredits">
              <div class="flex items-center justify-between">
                <h3 class="text-base font-semibold text-white">额度调整</h3>
                <span class="admin-kicker">Credits</span>
              </div>

              <div class="mt-4 space-y-4">
                <div>
                  <label class="admin-kicker">增减值</label>
                  <input v-model.number="creditsForm.delta" type="number" class="admin-field mt-2" />
                </div>
                <div>
                  <label class="admin-kicker">原因</label>
                  <textarea v-model="creditsForm.reason" rows="4" class="admin-field mt-2"></textarea>
                </div>
              </div>

              <button type="submit" class="admin-warning-btn mt-5" :disabled="savingCredits">
                {{ savingCredits ? '提交中...' : '调整额度' }}
              </button>
            </form>
          </section>

          <section class="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-white">资料</h3>
              <span class="admin-kicker">Profile</span>
            </div>

            <dl class="mt-4 grid gap-4 md:grid-cols-2">
              <div><dt class="admin-kicker">名</dt><dd class="mt-1 text-sm text-slate-200">{{ selectedUser?.profile?.firstName || '-' }}</dd></div>
              <div><dt class="admin-kicker">姓</dt><dd class="mt-1 text-sm text-slate-200">{{ selectedUser?.profile?.surname || '-' }}</dd></div>
              <div><dt class="admin-kicker">组织</dt><dd class="mt-1 text-sm text-slate-200">{{ selectedUser?.profile?.organization || '-' }}</dd></div>
              <div><dt class="admin-kicker">职业</dt><dd class="mt-1 text-sm text-slate-200">{{ selectedUser?.profile?.jobRole || '-' }}</dd></div>
              <div><dt class="admin-kicker">行业</dt><dd class="mt-1 text-sm text-slate-200">{{ selectedUser?.profile?.industry || '-' }}</dd></div>
            </dl>
          </section>

          <section class="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-white">最近检测</h3>
              <span class="admin-kicker">Recent</span>
            </div>

            <div class="mt-4 space-y-3">
              <div v-for="item in selectedUser?.recentDetections || []" :key="item.id" class="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
                <div class="flex items-start justify-between gap-4">
                  <p class="font-semibold text-white">{{ String(item.label).toUpperCase() }}</p>
                  <span class="rounded-full bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-100">{{ formatScore(item.score) }}</span>
                </div>
                <div class="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>{{ formatNumber(item.charsUsed) }} chars</span>
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
  { key: 'email', label: 'Email' },
  { key: 'name', label: 'Name' },
  { key: 'systemRole', label: 'Role' },
  { key: 'planTier', label: 'Plan' },
  { key: 'isActive', label: 'Status' },
  { key: 'creditsRemaining', label: 'Remaining' },
  { key: 'createdAt', label: 'Created At' },
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
  @apply w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-200/40;
}

.admin-kicker {
  @apply block text-xs font-semibold uppercase tracking-[0.24em] text-slate-400;
}

.admin-primary-btn {
  @apply inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50;
}

.admin-warning-btn {
  @apply inline-flex items-center justify-center rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50;
}

.admin-secondary-btn {
  @apply inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50;
}
</style>
