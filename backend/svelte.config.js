import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		csrf: {
			trustedOrigins: [
				'http://localhost:5173',
				'http://localhost:3000',
				// Tambahkan URL Vercel kamu di sini setelah deploy frontend:
				// 'https://nama-project.vercel.app',
			]
		},
		alias: {
			'$lib': 'src/lib'
		}
	}
};

export default config;
