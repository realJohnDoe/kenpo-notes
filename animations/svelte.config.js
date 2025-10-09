import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { readdirSync } from 'fs';
import { join } from 'path';

const getYamlSlugs = () => {
  const srcDir = join(process.cwd(), 'src'); // Assuming src is at the root of the project
  const ymlFiles = readdirSync(srcDir).filter((file) => file.endsWith('.yml'));
  return ymlFiles.map((file) => `/animation/${file.replace('.yml', '')}`);
};

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter(),
    prerender: {
      entries: ['/', ...getYamlSlugs()]
    },
    paths: {
      base: '/kenpo-notes'
    }
  }
};

export default config;
