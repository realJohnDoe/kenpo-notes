import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const getYamlSlugs = (): `/${string}`[] => {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const srcFormsDir = join(currentDir, 'static', 'forms');
  const ymlFiles = readdirSync(srcFormsDir).filter((file) =>
    file.endsWith('.yml')
  );
  return ymlFiles.map(
    (file): `/${string}` => `/animation/${file.replace('.yml', '')}`
  );
};

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      preprocess: vitePreprocess(),
      adapter: adapter(),
      prerender: {
        entries: ['/', ...getYamlSlugs()]
      },
      paths: {
        base: '/kenpo-notes'
      }
    })
  ]
});
