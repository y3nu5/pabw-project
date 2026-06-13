import { env } from '$env/dynamic/private';

// Daftar origin yang diizinkan
const ALLOWED_ORIGINS = [
	'http://localhost:5173',
	'http://localhost:4173',
	'http://localhost:3000',
	// URL frontend production (dari env variable)
	...(env.FRONTEND_URL ? [env.FRONTEND_URL.trim().replace(/\/$/, '')] : []),
];

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const origin = event.request.headers.get('origin') || '';
	const isAllowed = ALLOWED_ORIGINS.includes(origin);
	const corsOrigin = isAllowed ? origin : ALLOWED_ORIGINS[0];

	// Menangani request OPTIONS (preflight)
	if (event.request.method === 'OPTIONS') {
		return new Response(null, {
			headers: {
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
				'Access-Control-Allow-Origin': corsOrigin,
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				'Access-Control-Allow-Credentials': 'true'
			}
		});
	}

	const response = await resolve(event);

	// Menambahkan header CORS ke semua response
	response.headers.set('Access-Control-Allow-Origin', corsOrigin);
	response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	response.headers.set('Access-Control-Allow-Credentials', 'true');

	return response;
}
