import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

const LOCAL_API_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

const normalizeApiBaseUrl = (mode, rawValue) => {
  const baseUrl = String(rawValue || '').trim();
  if (!baseUrl) return '';

  if (baseUrl.startsWith('/')) {
    throw new Error('VITE_API_BASE_URL 仅支持 API 源站地址；如需同域 /api 反代，请留空。');
  }

  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch (error) {
    throw new Error(`无效的 VITE_API_BASE_URL: ${baseUrl}`);
  }

  if ((parsed.pathname || '/').replace(/\/$/, '') !== '') {
    throw new Error('VITE_API_BASE_URL 不应包含路径；请仅填写协议 + 域名，例如 https://api.example.com');
  }

  if (mode !== 'development' && LOCAL_API_HOSTS.has(parsed.hostname)) {
    throw new Error(`禁止在 ${mode} 模式下使用本地 API 地址: ${baseUrl}`);
  }

  return parsed.origin;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  normalizeApiBaseUrl(mode, env.VITE_API_BASE_URL);

  return {
    plugins: [vue()],
    test: {
      environment: 'happy-dom',
      setupFiles: './src/test/setup.ts',
      restoreMocks: true,
      clearMocks: true,
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': {
          target: env.VITE_DEV_PROXY_TARGET || 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  };
});
