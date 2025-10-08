 import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const getYamlSlugs = () => {
  const srcDir = join(__dirname, 'src'); // Path relative to this config file
  const ymlFiles = readdirSync(srcDir).filter(file => file.endsWith('.yml'));
  return ymlFiles.map(file => `/animation/${file.replace('.yml', '')}`);
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
	base: '/kenpo-notes' // This is a build-time setting, can cause issues in dev
	}
}
};

export default config;