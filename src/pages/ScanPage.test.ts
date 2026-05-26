import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { reactive, nextTick } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import ScanPage from './ScanPage.vue';
import { createI18n } from '../i18n';
import { useScanStore } from '../store/scan';

const route = reactive({
  name: 'dashboard',
  fullPath: '/dashboard?panel=home',
  query: { panel: 'home' as string | undefined },
});

const routerReplace = vi.fn(async ({ query = {} }) => {
  route.query = { ...query };
  const panel = typeof query.panel === 'string' ? `?panel=${query.panel}` : '';
  route.fullPath = `/dashboard${panel}`;
});

const routerPush = vi.fn(async ({ query = {} }) => {
  route.query = { ...query };
  const panel = typeof query.panel === 'string' ? `?panel=${query.panel}` : '';
  route.fullPath = `/dashboard${panel}`;
});

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({
      replace: routerReplace,
      push: routerPush,
    }),
    useRoute: () => route,
  };
});

vi.mock('../api/modules/auth', () => ({
  clearGuestToken: vi.fn(),
  ensureGuestToken: vi.fn(async () => 'guest-token'),
}));

vi.mock('../api/modules/quota', () => ({
  fetchQuota: vi.fn(async () => ({
    limit: 5000,
    remaining: 5000,
    used_today: 0,
  })),
}));

vi.mock('../api/modules/reports', () => ({
  exportPdfReport: vi.fn(),
}));

vi.mock('../api/modules/examples', () => ({
  fetchScanExamples: vi.fn(async () => []),
}));

vi.mock('../api/modules/scan', () => ({
  detectText: vi.fn(),
}));

vi.mock('../api/modules/history', () => ({
  getHistoryList: vi.fn(async () => []),
  getHistoryRecord: vi.fn(),
  createHistoryRecord: vi.fn(),
  updateHistoryRecord: vi.fn(),
  deleteHistoryRecord: vi.fn(),
  batchDeleteHistoryRecords: vi.fn(),
  clearAllHistory: vi.fn(),
  claimGuestHistory: vi.fn(),
}));

vi.mock('../utils/toast', () => ({
  showComingSoon: vi.fn(),
  showToast: vi.fn(),
}));

describe('ScanPage panel switching', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    route.name = 'dashboard';
    route.query = { panel: 'home' };
    route.fullPath = '/dashboard?panel=home';
    window.localStorage.setItem('locale', 'en-US');
  });

  it('从 home 点击 Document 后应切换到 document 面板', async () => {
    const wrapper = mount(ScanPage, {
      global: {
        plugins: [createI18n()],
        stubs: {
          AppHeader: { template: '<div />' },
          LoginPromptModal: { template: '<div />' },
          BaseListbox: { template: '<div />' },
          ProfilePanel: { template: '<div />' },
          QAPanel: { template: '<div />' },
          OnboardingStepsBar: { template: '<div />' },
          UsageExamplesModal: { template: '<div />' },
          PricingPage: { template: '<div />' },
        },
      },
    });

    await flushPromises();

    const navButtons = wrapper.findAll('aside nav > button');
    expect(navButtons).toHaveLength(3);

    await navButtons[1].trigger('click');
    await nextTick();
    await flushPromises();

    expect(route.query.panel).toBe('document');
    expect(wrapper.find('.editor-surface').exists()).toBe(true);
    expect(wrapper.find('.preview-surface').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Workspace overview');
  });

  it('clears stale upload errors after valid editor input', async () => {
    const wrapper = mount(ScanPage, {
      global: {
        plugins: [createI18n()],
        stubs: {
          AppHeader: { template: '<div />' },
          LoginPromptModal: { template: '<div />' },
          BaseListbox: { template: '<div />' },
          ProfilePanel: { template: '<div />' },
          QAPanel: { template: '<div />' },
          OnboardingStepsBar: { template: '<div />' },
          UsageExamplesModal: { template: '<div />' },
          PricingPage: { template: '<div />' },
        },
      },
    });

    await flushPromises();

    const scanStore = useScanStore();
    scanStore.uploadError = 'This file is too long';

    const navButtons = wrapper.findAll('aside nav > button');
    await navButtons[1].trigger('click');
    await nextTick();
    await flushPromises();

    const editor = wrapper.find('.editor-surface');
    editor.element.innerHTML = '<p>Valid text</p>';
    await editor.trigger('input');

    expect(scanStore.uploadError).toBe('');
  });
});
