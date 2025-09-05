import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Preprocess configuration
	preprocess: vitePreprocess(),
	
	// Compiler options
	compilerOptions: {
		dev: process.env.NODE_ENV === 'development',
	},

	// Package configuration for building library
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