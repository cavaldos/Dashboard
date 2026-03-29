import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import path from 'path';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig(async ({ mode }) => {
  const isAppMode = mode === 'app';
  const port = Number(process.env.PORT) || 5173;

  const plugins: PluginOption[] = [
    react(),
    tailwindcss(),
  ];

  if (isAppMode) {
    const electron = (await import('vite-plugin-electron')).default;
    const renderer = (await import('vite-plugin-electron-renderer')).default;

    plugins.push(
      electron([
        {
          entry: 'electron/main.ts',
        },
        {
          entry: 'electron/preload.ts',
          onstart(options) {
            options.reload();
          },
        },
      ]),
      renderer(),
    );
  }

  return {
    plugins,
    resolve: {
      alias: [
        { find: /^~\//, replacement: srcDir + '/' },
        { find: '~', replacement: srcDir },
        { find: '@components', replacement: path.resolve(__dirname, 'src/components') },
        { find: '@pages', replacement: path.resolve(__dirname, 'src/pages') },
        { find: '@routes', replacement: path.resolve(__dirname, 'src/routes') },
        { find: '@types', replacement: path.resolve(__dirname, 'src/types') },
        { find: '@assets', replacement: path.resolve(__dirname, 'src/assets') },
      ],
    },
    clearScreen: false,
    server: {
      port,
      strictPort: true,
      host: true,
      proxy: {
        '/api/gmgn': {
          target: 'https://gmgn.ai',
          changeOrigin: true,
          rewrite: (p: string) => p.replace(/^\/api\/gmgn/, ''),
          headers: {
            'Accept': 'application/json',
            'Accept-Language': 'en-US,en;q=0.9',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': 'https://gmgn.ai/?chain=sol',
          },
        },
      },
    },
    preview: {
      port,
      strictPort: true,
      host: true,
    },
  };
});
