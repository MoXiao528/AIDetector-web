import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../store/auth';
import { showComingSoon, showToast } from '../utils/toast';

const HomePage = () => import('../pages/HomePage.vue');
const DashboardPage = () => import('../pages/ScanPage.vue');
const LoginPage = () => import('../pages/LoginPage.vue');
const RegisterPage = () => import('../pages/RegisterPage.vue');
const ContactPage = () => import('../pages/ContactPage.vue');
const QAPage = () => import('../pages/QAPage.vue');
const PricingPage = () => import('../pages/PricingPage.vue');
const AdminLayout = () => import('../layouts/AdminLayout.vue');
const AdminOverviewPage = () => import('../pages/admin/AdminOverviewPage.vue');
const AdminUsersPage = () => import('../pages/admin/AdminUsersPage.vue');
const AdminDetectionsPage = () => import('../pages/admin/AdminDetectionsPage.vue');

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardPage,
    },
    { path: '/scan', redirect: { name: 'dashboard' } },
    {
      path: '/multi-upload',
      redirect: { name: 'dashboard' },
    },
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/register', name: 'register', component: RegisterPage },
    { path: '/profile', redirect: { name: 'dashboard', query: { panel: 'profile' } } },
    { path: '/contact', name: 'contact', component: ContactPage },
    { path: '/qa', name: 'qa', component: QAPage },
    { path: '/pricing', name: 'pricing', component: PricingPage },
    {
      path: '/admin',
      component: AdminLayout,
      meta: {
        requiresAuth: true,
        requiresSysAdmin: true,
      },
      children: [
        {
          path: '',
          redirect: { name: 'admin-overview' },
        },
        {
          path: 'overview',
          name: 'admin-overview',
          component: AdminOverviewPage,
          meta: {
            title: '管理员概览',
            requiresAuth: true,
            requiresSysAdmin: true,
          },
        },
        {
          path: 'users',
          name: 'admin-users',
          component: AdminUsersPage,
          meta: {
            title: '用户管理',
            requiresAuth: true,
            requiresSysAdmin: true,
          },
        },
        {
          path: 'detections',
          name: 'admin-detections',
          component: AdminDetectionsPage,
          meta: {
            title: '检测记录',
            requiresAuth: true,
            requiresSysAdmin: true,
          },
        },
      ],
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }

    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth',
      };
    }

    return { top: 0 };
  },
});

const enabledRouteNames = new Set([
  'home',
  'dashboard',
  'login',
  'register',
  'admin-overview',
  'admin-users',
  'admin-detections',
]);

router.beforeEach(async (to, from) => {
  if (!to.name) return true;

  if (!enabledRouteNames.has(to.name)) {
    const isInitialNavigation = !from.name || from.matched.length === 0;
    showComingSoon(to.meta?.title || to.name);
    if (isInitialNavigation) {
      return { name: 'home' };
    }
    return false;
  }

  const authStore = useAuthStore();
  const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth);
  const requiresSysAdmin = to.matched.some((record) => record.meta?.requiresSysAdmin);
  const shouldRestoreSession = (requiresAuth || authStore.authToken) && !authStore.hasRestoredSession;

  if (shouldRestoreSession) {
    await authStore.restoreSession();
  }

  if (requiresAuth && !authStore.requireAuthentication()) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  if (requiresSysAdmin && !authStore.isSysAdmin) {
    showToast({
      title: '访问受限',
      message: '当前账号没有管理员权限。',
    });
    return { name: 'dashboard' };
  }

  return true;
});

export default router;
