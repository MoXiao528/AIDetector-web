import { createRouter, createWebHistory } from 'vue-router';

const HomePage = () => import('../pages/HomePage.vue');
const DashboardPage = () => import('../pages/ScanPage.vue');
const MultiUploadPage = () => import('../pages/MultiUploadPage.vue');
const LoginPage = () => import('../pages/LoginPage.vue');
const RegisterPage = () => import('../pages/RegisterPage.vue');
const ContactPage = () => import('../pages/ContactPage.vue');
const QAPage = () => import('../pages/QAPage.vue');
const PricingPage = () => import('../pages/PricingPage.vue');
const ProfilePage = () => import('../pages/Profile.jsx');

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/dashboard', name: 'dashboard', component: DashboardPage },
    { path: '/scan', redirect: { name: 'dashboard' } },
    { path: '/multi-upload', name: 'multi-upload', component: MultiUploadPage },
    { path: '/login', name: 'login', component: LoginPage },
    { path: '/register', name: 'register', component: RegisterPage },
    { path: '/profile', name: 'profile', component: ProfilePage },
    { path: '/contact', name: 'contact', component: ContactPage },
    { path: '/qa', name: 'qa', component: QAPage },
    { path: '/pricing', name: 'pricing', component: PricingPage },
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

export default router;
