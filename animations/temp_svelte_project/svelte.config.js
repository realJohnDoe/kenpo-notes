 import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
preprocess: vitePreprocess(),

kit: {
	adapter: adapter(),
	prerender: {
	entries: ['*']
	},
	paths: {
	base: '/kenpo-notes'
	}
}
};

export default config;