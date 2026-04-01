const DEFAULT_DURATION = 2500;

const buildToastStyles = () => ({
  container:
    'position:fixed;top:20px;right:20px;z-index:9999;max-width:320px;width:calc(100% - 40px);font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;',
  toast:
    'background:#111827;color:#fff;border-radius:14px;padding:12px 16px;box-shadow:0 10px 30px rgba(15,23,42,0.25);display:flex;flex-direction:column;gap:4px;opacity:0;transform:translateY(-6px);transition:opacity 0.2s ease,transform 0.2s ease;',
  title: 'font-size:13px;font-weight:600;',
  message: 'font-size:12px;line-height:1.4;color:#e2e8f0;white-space:pre-line;',
});

const getToastContainer = () => {
  if (typeof window === 'undefined') return null;
  const existing = document.getElementById('global-toast-container');
  if (existing) return existing;
  const container = document.createElement('div');
  container.id = 'global-toast-container';
  container.setAttribute('style', buildToastStyles().container);
  document.body.appendChild(container);
  return container;
};

export const showToast = ({ title = '', message = '', duration = DEFAULT_DURATION } = {}) => {
  if (typeof window === 'undefined') return;
  const container = getToastContainer();
  if (!container) return;
  const styles = buildToastStyles();
  const toast = document.createElement('div');
  toast.setAttribute('style', styles.toast);
  if (title) {
    const titleEl = document.createElement('div');
    titleEl.setAttribute('style', styles.title);
    titleEl.textContent = title;
    toast.appendChild(titleEl);
  }
  if (message) {
    const messageEl = document.createElement('div');
    messageEl.setAttribute('style', styles.message);
    messageEl.textContent = message;
    toast.appendChild(messageEl);
  }
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-6px)';
    setTimeout(() => {
      toast.remove();
    }, 200);
  }, duration);
};

export const showComingSoon = (featureName = '') => {
  const label = featureName ? `「${featureName}」将于后续版本上线，敬请期待` : '该功能将于后续版本上线，敬请期待';
  showToast({ title: 'Coming Soon', message: label });
};
