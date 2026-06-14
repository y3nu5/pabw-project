import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// Pakai Node.js runtime (bukan edge) karena backend pakai pg, bcryptjs, jwt
			runtime: 'nodejs22.x'
		}),
		csrf: false,
		alias: {
			'$lib': 'src/lib'
		}
	}
};

export default config;
