import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import svg from '@poppanator/sveltekit-svg';
import yaml from '@rollup/plugin-yaml';

export default defineConfig({
  plugins: [sveltekit(), svg(), yaml()]
});
