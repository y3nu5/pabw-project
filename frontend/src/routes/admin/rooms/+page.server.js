import { env } from '$env/dynamic/public';

const backendBaseUrl = (env.PUBLIC_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies, fetch }) {
	try {
		const cookieHeader = cookies
			.getAll()
			.map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
			.join('; ');

		const res = await fetch(`${backendBaseUrl}/api/rooms`, {
			method: 'GET',
			headers: cookieHeader ? { cookie: cookieHeader } : {}
		});
		const json = await res.json();
		return {
			rooms: json.data || []
		};
	} catch (error) {
		console.error('Load admin/rooms error:', error);
		return { rooms: [] };
	}
}
