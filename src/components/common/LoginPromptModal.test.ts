import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { createI18n } from '../../i18n';
import LoginPromptModal from './LoginPromptModal.vue';

describe('LoginPromptModal', () => {
  it('Escape 关闭后回焦，跳转登录时保留目标且不抢回焦点', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: ['/dashboard', '/login', '/register'].map((path) => ({ path, component: { template: '<div />' } })),
    });
    await router.push('/dashboard?panel=document');
    await router.isReady();

    const Host = defineComponent({
      setup() {
        const open = ref(false);
        return () => h('div', [
          h('button', { onClick: () => { open.value = true; } }, 'Open'),
          h(LoginPromptModal, {
            open: open.value,
            message: '额度不足，请登录后继续。',
            loginTo: { path: '/login', query: { redirect: '/dashboard?panel=document' } },
            registerTo: '/register?from=quota',
            onClose: () => { open.value = false; },
          }),
        ]);
      },
    });
    const wrapper = mount(Host, { attachTo: document.body, global: { plugins: [router, createI18n()] } });
    try {
      const trigger = wrapper.get('button');
      (trigger.element as HTMLButtonElement).focus();
      await trigger.trigger('click');
      await flushPromises();

      const panel = document.querySelector('.login-prompt-panel');
      expect(panel?.textContent).toContain('额度不足，请登录后继续。');
      const links = panel?.querySelectorAll('a');
      expect(links?.[0].getAttribute('href')).toBe('/login?redirect=/dashboard?panel=document');
      expect(links?.[1].getAttribute('href')).toBe('/register?from=quota');
      await vi.waitFor(() => expect(panel?.contains(document.activeElement)).toBe(true));

      document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
      await vi.waitFor(() => expect(document.activeElement).toBe(trigger.element));
      expect(wrapper.findComponent(LoginPromptModal).emitted('close')).toHaveLength(1);

      await trigger.trigger('click');
      await flushPromises();
      (document.querySelector('.login-prompt-panel a') as HTMLAnchorElement).click();
      await flushPromises();
      expect(router.currentRoute.value.path).toBe('/login');
      expect(router.currentRoute.value.query.redirect).toBe('/dashboard?panel=document');
      expect(wrapper.findComponent(LoginPromptModal).emitted('close')).toHaveLength(2);
      await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
      expect(document.activeElement).not.toBe(trigger.element);
    } finally {
      wrapper.unmount();
    }
  });
});
