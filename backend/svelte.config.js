import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		csrf: {
			trustedOrigins: ['http://localhost:5173', 'http://localhost:3000']
		},
		alias: {
			'$lib': 'src/lib'
		}
	}
};

export default config;
