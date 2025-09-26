import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list. If your environment is not supported, or you disable adapter-auto, the following line should be kept.
		// You can also create your own adapter if you don't like the ones provided by SvelteKit.
		adapter: adapter(),
		prerender: {
			entries: ['*']
		}
	}
};

export default config;
