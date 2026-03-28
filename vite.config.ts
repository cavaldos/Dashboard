import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import path from 'path';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig(async ({ mode }) => {
  const isAppMode = mode === 'app';

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
      port: 5173,
    },
  };
});
