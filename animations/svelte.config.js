import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const getYamlSlugs = () => {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const srcDataDir = join(currentDir, 'src', 'lib', 'data');
  const ymlFiles = readdirSync(srcDataDir).filter((file) => file.endsWith('.yml'));
  return ymlFiles.map((file) => `/animation/${file.replace('.yml', '')}`);
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter(),
    prerender: {
      entries: ['/', ...getYamlSlugs()],
    },
    paths: {
      base: '/kenpo-notes'
    }
  }
};

export default config;
