import { env } from '$env/dynamic/private';

// Origin yang selalu diizinkan
const STATIC_ALLOWED = [
	'http://localhost:5173',
	'http://localhost:4173',
	'http://localhost:3000',
];

/**
 * Cek apakah origin diizinkan
 * @param {string} origin
 */
function isOriginAllowed(origin) {
	if (!origin) return false;

	// Selalu izinkan localhost
	if (STATIC_ALLOWED.includes(origin)) return true;

	// Izinkan FRONTEND_URL yang di-set via env
	if (env.FRONTEND_URL) {
		const frontendUrl = env.FRONTEND_URL.trim().replace(/\/$/, '');
		if (origin === frontendUrl) return true;
	}

	// Izinkan semua subdomain vercel.app (untuk preview deployments)
	if (origin.endsWith('.vercel.app')) return true;

	return false;
}

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
	const origin = event.request.headers.get('origin') || '';
	const allowed = isOriginAllowed(origin);
	const corsOrigin = allowed ? origin : 'null';

	// Tangani preflight OPTIONS
	if (event.request.method === 'OPTIONS') {
		return new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': corsOrigin,
				'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type, Authorization',
				'Access-Control-Allow-Credentials': 'true',
				'Access-Control-Max-Age': '86400',
			}
		});
	}

	const response = await resolve(event);

	response.headers.set('Access-Control-Allow-Origin', corsOrigin);
	response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
	response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	response.headers.set('Access-Control-Allow-Credentials', 'true');

	return response;
}
