import { computed, inject, reactive } from 'vue';
import enUS from './en-US';
import zhCN from './zh-CN';

const STORAGE_KEY = 'locale';
const I18N_SYMBOL = Symbol('i18n');

const messages = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

const getNestedValue = (obj, path) => {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};

export const createI18n = () => {
  const initialLocale = (() => {
    if (typeof window === 'undefined') return 'zh-CN';
    return localStorage.getItem(STORAGE_KEY) || 'zh-CN';
  })();

  const state = reactive({
    locale: initialLocale,
  });

  const t = (key, values = {}) => {
    const target = messages[state.locale] || messages['zh-CN'];
    const fallback = messages['en-US'];
    const raw = getNestedValue(target, key) ?? getNestedValue(fallback, key) ?? key;
    if (typeof raw !== 'string') return raw;
    return raw.replace(/\{([^}]+)\}/g, (_, match) => values[match] ?? `{${match}}`);
  };

  const setLocale = (nextLocale) => {
    if (!messages[nextLocale]) return;
    state.locale = nextLocale;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, nextLocale);
    }
  };

  return {
    install(app) {
      app.provide(I18N_SYMBOL, {
        t,
        locale: computed(() => state.locale),
        setLocale,
        availableLocales: Object.keys(messages),
      });
      app.config.globalProperties.$t = t;
    },
  };
};

export const useI18n = () => {
  const context = inject(I18N_SYMBOL);
  if (!context) {
    throw new Error('i18n context is not provided');
  }
  return context;
};
