import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { defineComponent, nextTick } from 'vue';
import { shallowMount } from '@vue/test-utils';
import HomePage from './HomePage.vue';
import { createI18n } from '../i18n';
import { useScanStore } from '../store/scan';

const mockState = vi.hoisted(() => ({
  routerPush: vi.fn(),
}));

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({ push: mockState.routerPush }),
  };
});

vi.mock('../api/modules/examples', () => ({
  fetchScanExamples: vi.fn(async () => ({})),
}));

vi.mock('../utils/toast', () => ({
  showToast: vi.fn(),
}));

const HeroSectionStub = defineComponent({
  name: 'HeroSection',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue', 'scan'],
  template: `
    <textarea
      data-testid="home-input"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  `,
});

const createGuestToken = (sid: string) => {
  const payload = window
    .btoa(
      JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + 3600,
        sid,
        sub: sid,
        sub_type: 'guest',
      })
    )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`;
};

const mountHomePage = () => {
  const pinia = createPinia();
  setActivePinia(pinia);
  const wrapper = shallowMount(HomePage, {
    global: {
      plugins: [pinia, createI18n()],
      mocks: {
        $router: { push: mockState.routerPush },
      },
      stubs: {
        AppFooter: true,
        AppHeader: true,
        CapabilitiesSection: true,
        HeroSection: HeroSectionStub,
        ShowcaseSection: true,
        UsageExamplesModal: true,
        WorkflowSection: true,
      },
    },
  });
  return { scanStore: useScanStore(), wrapper };
};

describe('HomePage guest scan boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('首页输入是 scanStore.inputText 的实时双向投影', async () => {
    const { scanStore, wrapper } = mountHomePage();
    const textarea = wrapper.get<HTMLTextAreaElement>('[data-testid="home-input"]');

    scanStore.setInputText('guest-a from store');
    await nextTick();
    expect(textarea.element.value).toBe('guest-a from store');

    await textarea.setValue('guest-a from textarea');
    expect(scanStore.inputText).toBe('guest-a from textarea');

    wrapper.unmount();
  });

  it('clearScanSessionData 后首页立即移除旧游客正文', async () => {
    const { scanStore, wrapper } = mountHomePage();
    const textarea = wrapper.get<HTMLTextAreaElement>('[data-testid="home-input"]');
    scanStore.setInputText('GUEST_A_SECRET_HOME');
    await nextTick();
    expect(textarea.element.value).toBe('GUEST_A_SECRET_HOME');

    scanStore.clearScanSessionData();
    await nextTick();

    expect(scanStore.inputText).toBe('');
    expect(textarea.element.value).toBe('');
    expect(wrapper.html()).not.toContain('GUEST_A_SECRET_HOME');

    wrapper.unmount();
  });

  it('跨标签 guest SID A 切到 B 时首页立即清除 A 正文', async () => {
    const { scanStore, wrapper } = mountHomePage();
    const textarea = wrapper.get<HTMLTextAreaElement>('[data-testid="home-input"]');
    scanStore.activateGuestSession('sid-a');
    scanStore.setInputText('GUEST_A_CROSS_TAB_SECRET');
    await nextTick();

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'guest_token',
        oldValue: createGuestToken('sid-a'),
        newValue: createGuestToken('sid-b'),
        storageArea: window.localStorage,
      })
    );
    await nextTick();

    expect(scanStore.inputText).toBe('');
    expect(textarea.element.value).toBe('');
    expect(wrapper.html()).not.toContain('GUEST_A_CROSS_TAB_SECRET');

    wrapper.unmount();
  });
});
