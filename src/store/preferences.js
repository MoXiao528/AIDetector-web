import { computed, reactive, ref, watch } from 'vue';
import { defineStore } from 'pinia';

const STORAGE_KEY = 'ai-detector-preferences';

const defaultPreferences = {
  name: '',
  organization: '',
  industry: '',
  language: 'zh-CN',
  notificationChannel: 'email',
  avatarDataUrl: '',
  theme: 'system',
};

export const usePreferencesStore = defineStore('preferences', () => {
  const preferences = reactive({ ...defaultPreferences });
  const systemPrefersDark = ref(false);
  const initialized = ref(false);
  let mediaQuery;

  const effectiveTheme = computed(() => {
    if (preferences.theme === 'system') {
      return systemPrefersDark.value ? 'dark' : 'light';
    }
    return preferences.theme === 'dark' ? 'dark' : 'light';
  });

  const applyTheme = () => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const resolved = effectiveTheme.value;
    root.dataset.theme = resolved;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
  };

  const persist = () => {
    if (typeof window === 'undefined') return;
    try {
      const payload = { ...preferences };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to persist preferences', error);
    }
  };

  const load = () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        Object.assign(preferences, { ...defaultPreferences, ...parsed });
      }
    } catch (error) {
      console.error('Failed to restore preferences', error);
    }
  };

  const resetPreferences = () => {
    Object.assign(preferences, { ...defaultPreferences });
    persist();
    applyTheme();
  };

  const setupSystemThemeListener = () => {
    if (typeof window === 'undefined') return;
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemPrefersDark.value = mediaQuery.matches;
    const handleChange = (event) => {
      systemPrefersDark.value = event.matches;
      applyTheme();
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }
  };

  const updatePreferences = (payload) => {
    Object.assign(preferences, payload);
  };

  const initialize = () => {
    if (initialized.value) return;
    initialized.value = true;
    setupSystemThemeListener();
    load();
    applyTheme();
    watch(
      preferences,
      () => {
        persist();
        applyTheme();
      },
      { deep: true }
    );
    watch(
      effectiveTheme,
      () => {
        applyTheme();
      },
      { immediate: true }
    );
  };

  return {
    preferences,
    effectiveTheme,
    initialize,
    updatePreferences,
    resetPreferences,
  };
});
