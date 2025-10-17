import { createRouter, createWebHistory } from 'vue-router';

const HomePage = () => import('../pages/HomePage.vue');
const DashboardPage = () => import('../pages/ScanPage.vue');
const LoginPage = () => import('../pages/LoginPage.vue');
const RegisterPage = () => import('../pages/RegisterPage.vue');

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/dashboard', name: 'dashboard', component: DashboardPage },
    { path: '/scan', redirect: { name: 'dashboard' } },
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/register', name: 'register', component: RegisterPage },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
