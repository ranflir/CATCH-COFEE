import path from 'path';
import { fileURLToPath } from 'url';
import type { StorybookConfig } from '@storybook/react-vite';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  staticDirs: ['../public'],
  viteFinal: async (config) => {
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(dirname, '../src'),
      '@/lib/auth-provider': path.resolve(
        dirname,
        '../src/stories/mocks/mock-auth-provider.tsx',
      ),
      'next/link': path.resolve(dirname, '../src/stories/mocks/next-link.tsx'),
      'next/navigation': path.resolve(dirname, '../src/stories/mocks/next-navigation.tsx'),
    };
    return config;
  },
};

export default config;
