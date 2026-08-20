export const GUEST_HISTORY_STORAGE_PREFIX = 'ai-detector-history-records';

export const purgePersistedGuestHistory = () => {
  if (typeof window === 'undefined') return;
  for (const storageName of ['localStorage', 'sessionStorage']) {
    try {
      const storage = window[storageName];
      const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
        (key) => typeof key === 'string' && key.startsWith(GUEST_HISTORY_STORAGE_PREFIX)
      );
      keys.forEach((key) => storage.removeItem(key));
    } catch {
      // Storage may be unavailable or blocked by the browser.
    }
  }
};
