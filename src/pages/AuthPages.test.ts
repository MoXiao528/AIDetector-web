import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, type Component } from 'vue';
import { enableAutoUnmount, flushPromises, shallowMount } from '@vue/test-utils';
import LoginPage from './LoginPage.vue';
import RegisterPage from './RegisterPage.vue';
import { createI18n, useI18n } from '../i18n';
import { showToast } from '../utils/toast';

const mockState = vi.hoisted(() => ({
  authStore: {
    login: vi.fn(),
    register: vi.fn(),
    isSysAdmin: false,
  },
  routerPush: vi.fn(),
  query: {} as { redirect?: string },
}));

vi.mock('../store/auth', () => ({
  useAuthStore: () => mockState.authStore,
}));

vi.mock('../utils/toast', () => ({
  showToast: vi.fn(),
}));

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>();
  return {
    ...actual,
    useRouter: () => ({ push: mockState.routerPush }),
    useRoute: () => ({ query: mockState.query }),
  };
});

type AuthPageKind = 'login' | 'register';

const pageCases = {
  login: {
    component: LoginPage,
    fields: { identifier: 'reader@example.com', password: 'test-password-123' },
    payload: { identifier: 'reader@example.com', password: 'test-password-123' },
    errorCode: 'AUTH_INVALID_CREDENTIALS',
    errorMessage: '账号或密码错误，请重新输入。',
  },
  register: {
    component: RegisterPage,
    fields: {
      name: '  测试用户  ',
      email: 'reader@example.com',
      password: 'test-password-123',
      confirm: 'test-password-123',
    },
    payload: { name: '测试用户', email: 'reader@example.com', password: 'test-password-123' },
    errorCode: 'AUTH_EMAIL_EXISTS',
    errorMessage: '该邮箱已注册，请直接登录。',
  },
};

const mountAuthPage = async (kind: AuthPageKind, locale = 'zh-CN') => {
  const component: Component = pageCases[kind].component;
  const wrapper = shallowMount(component, {
    global: {
      plugins: [createI18n()],
      stubs: {
        AppHeader: defineComponent({
          setup() {
            useI18n().setLocale(locale);
          },
          template: '<div />',
        }),
        RouterLink: true,
      },
    },
  });
  for (const [id, value] of Object.entries(pageCases[kind].fields)) {
    await wrapper.get<HTMLInputElement>(`#${id}`).setValue(value);
  }
  return wrapper;
};

const deferredRequest = () => {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

enableAutoUnmount(afterEach);

describe('登录与注册提交状态', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockState.authStore.isSysAdmin = false;
    mockState.query = {};
    window.localStorage.clear();
  });

  it.each<AuthPageKind>(['login', 'register'])('%s 在请求期间阻止重复提交，失败后保留输入并允许重试', async (kind) => {
    const request = deferredRequest();
    const submit = mockState.authStore[kind];
    submit.mockReturnValueOnce(request.promise);
    const wrapper = await mountAuthPage(kind);
    const form = wrapper.get('form');
    const button = wrapper.get<HTMLButtonElement>('button[type="submit"]');
    const idleLabel = button.text();

    await Promise.all([form.trigger('submit'), form.trigger('submit')]);

    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit).toHaveBeenCalledWith(pageCases[kind].payload);
    expect(button.element.disabled).toBe(true);
    expect(button.attributes('aria-busy')).toBe('true');
    expect(button.text()).not.toBe(idleLabel);
    expect(mockState.routerPush).not.toHaveBeenCalled();

    request.reject({ code: pageCases[kind].errorCode, message: 'Backend error' });
    await flushPromises();

    expect(button.element.disabled).toBe(false);
    expect(button.attributes('aria-busy')).toBe('false');
    expect(button.text()).toBe(idleLabel);
    expect(wrapper.text()).toContain(pageCases[kind].errorMessage);
    for (const [id, value] of Object.entries(pageCases[kind].fields)) {
      expect(wrapper.get<HTMLInputElement>(`#${id}`).element.value).toBe(value);
    }
    expect(mockState.routerPush).not.toHaveBeenCalled();

    const retry = deferredRequest();
    submit.mockReturnValueOnce(retry.promise);
    await form.trigger('submit');
    expect(submit).toHaveBeenCalledTimes(2);
    expect(button.element.disabled).toBe(true);
    expect(wrapper.text()).not.toContain(pageCases[kind].errorMessage);
    retry.resolve();
    await flushPromises();
  });

  it.each([
    { kind: 'login', admin: false, redirect: undefined, destination: '/dashboard' },
    { kind: 'login', admin: true, redirect: '/dashboard?panel=document', destination: '/admin/overview' },
    { kind: 'login', admin: true, redirect: '/admin/users', destination: '/admin/users' },
    { kind: 'register', admin: false, redirect: undefined, destination: '/dashboard?panel=document' },
    { kind: 'register', admin: false, redirect: '/dashboard?panel=home', destination: '/dashboard?panel=home' },
  ] as const)('$kind 成功后保留跳转规则：$destination（admin=$admin，redirect=$redirect）', async ({ kind, admin, redirect, destination }) => {
    mockState.authStore.isSysAdmin = admin;
    mockState.query = { redirect };
    mockState.authStore[kind].mockResolvedValueOnce(undefined);
    const wrapper = await mountAuthPage(kind);

    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(mockState.authStore[kind]).toHaveBeenCalledWith(pageCases[kind].payload);
    expect(mockState.routerPush).toHaveBeenCalledExactlyOnceWith(destination);
    expect(wrapper.get<HTMLButtonElement>('button[type="submit"]').element.disabled).toBe(false);
  });

  it.each([
    { kind: 'login', locale: 'zh-CN', password: '1234567', message: '密码至少需要 8 个字符。' },
    { kind: 'register', locale: 'zh-CN', password: '😀'.repeat(7), message: '密码至少需要 8 个字符。' },
    { kind: 'login', locale: 'en-US', password: '😀'.repeat(7), message: 'Password must be at least 8 characters.' },
    { kind: 'register', locale: 'en-US', password: '1234567', message: 'Password must be at least 8 characters.' },
  ] as const)('$kind 在 $locale 下拦截不足 8 个字符的密码，不发送请求', async ({ kind, locale, password, message }) => {
    const wrapper = await mountAuthPage(kind, locale);
    await wrapper.get('#password').setValue(password);
    if (kind === 'register') await wrapper.get('#confirm').setValue(password);

    await wrapper.get('form').trigger('submit');

    expect(wrapper.get('[role="alert"]').text()).toBe(message);
    expect(mockState.authStore[kind]).not.toHaveBeenCalled();
    expect(mockState.routerPush).not.toHaveBeenCalled();
    expect(wrapper.get<HTMLButtonElement>('button[type="submit"]').element.disabled).toBe(false);
  });

  it.each([
    { locale: 'zh-CN', message: '账号已创建，请登录。' },
    { locale: 'en-US', message: 'Your account has been created. Please sign in.' },
  ])('注册成功但自动登录失败时，在 $locale 下保留跨页面提示', async ({ locale, message }) => {
    mockState.authStore.register.mockRejectedValueOnce({ code: 'LOGIN_FAILED', message: 'Backend sign-in failure' });
    const wrapper = await mountAuthPage('register', locale);

    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(showToast).toHaveBeenCalledExactlyOnceWith({ message, duration: 6000 });
    expect(mockState.routerPush).toHaveBeenCalledExactlyOnceWith('/login');
    expect(wrapper.text()).not.toContain('Backend sign-in failure');
  });

  it.each([
    { locale: 'zh-CN', message: '账号已创建，但账号信息加载失败，请刷新后重试。' },
    { locale: 'en-US', message: 'Your account has been created, but account details could not be loaded. Refresh the page and try again.' },
  ])('注册成功但资料加载失败时，在 $locale 下明确状态并阻止重复注册', async ({ locale, message }) => {
    mockState.authStore.register.mockRejectedValueOnce({ code: 'ME_FAILED', message: 'Backend profile failure' });
    const wrapper = await mountAuthPage('register', locale);

    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toBe(message);
    expect(wrapper.get<HTMLButtonElement>('button[type="submit"]').element.disabled).toBe(true);
    expect(mockState.routerPush).not.toHaveBeenCalled();
    await wrapper.get('form').trigger('submit');
    expect(mockState.authStore.register).toHaveBeenCalledTimes(1);
    expect(wrapper.get('[role="alert"]').text()).toBe(message);
  });

  it.each([
    { kind: 'login', locale: 'zh-CN', message: '登录失败，请稍后再试。' },
    { kind: 'register', locale: 'zh-CN', message: '注册失败，请重试。' },
    { kind: 'login', locale: 'en-US', message: 'Login failed. Please try again later.' },
    { kind: 'register', locale: 'en-US', message: 'Registration failed, please try again.' },
  ] as const)('$kind 未识别的错误在 $locale 下使用本地化提示', async ({ kind, locale, message }) => {
    mockState.authStore[kind].mockRejectedValueOnce({ code: 'UNKNOWN', message: 'Internal backend detail' });
    const wrapper = await mountAuthPage(kind, locale);

    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toBe(message);
    expect(wrapper.text()).not.toContain('Internal backend detail');
    expect(wrapper.get<HTMLButtonElement>('button[type="submit"]').element.disabled).toBe(false);
  });

  it('用户名仍可留空，注册时只提交邮箱和密码', async () => {
    mockState.authStore.register.mockResolvedValueOnce(undefined);
    const wrapper = await mountAuthPage('register');
    await wrapper.get('#name').setValue('   ');

    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(mockState.authStore.register).toHaveBeenCalledExactlyOnceWith({
      email: 'reader@example.com',
      password: 'test-password-123',
    });
    expect(mockState.routerPush).toHaveBeenCalledExactlyOnceWith('/dashboard?panel=document');
  });
});
