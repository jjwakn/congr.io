import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_DEV_BACKEND_URL || 'http://localhost:4000';
  const packageJsonRaw = readFileSync(
    resolve(process.cwd(), 'package.json'),
    'utf-8',
  );
  const packageJson = JSON.parse(packageJsonRaw) as { version?: string };
  const frontendVersion = packageJson.version ?? '0.0.0';

  return {
    define: {
      __FRONTEND_VERSION__: JSON.stringify(frontendVersion),
    },
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: false,

        pwaAssets: {
          disabled: true,
        },

        injectManifest: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        },

        devOptions: {
          enabled: false,
          navigateFallback: 'index.html',
          suppressWarnings: true,
          type: 'module',
        },
      }),
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.split('\\').join('/');
            if (!normalizedId.includes('/node_modules/')) return undefined;

            if (
              normalizedId.includes('/@mui/') ||
              normalizedId.includes('/@emotion/')
            ) {
              return 'vendor-mui';
            }

            if (
              normalizedId.includes('/i18next/') ||
              normalizedId.includes('/react-i18next/')
            ) {
              return 'vendor-i18n';
            }

            if (
              normalizedId.includes('/workbox-') ||
              normalizedId.includes('virtual:pwa-register')
            ) {
              return 'vendor-pwa';
            }

            return 'vendor';
          },
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
