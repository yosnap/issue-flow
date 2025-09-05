import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter()
	},

	package: {
		dir: 'dist',
		emitTypes: true,
		exports: (filepath) => {
			// Export all files except test files
			return !filepath.includes('.test.') && !filepath.includes('.spec.');
		},
		files: (filepath) => {
			// Include all source files except tests and stories
			return !filepath.includes('.test.') && 
			       !filepath.includes('.spec.') && 
			       !filepath.includes('.stories.');
		}
	}
};

export default config;