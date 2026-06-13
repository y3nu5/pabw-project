import { env } from '$env/dynamic/public';

const backendBaseUrl = (env.PUBLIC_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies, fetch }) {
	try {
		const cookieHeader = cookies
			.getAll()
			.map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
			.join('; ');

		const res = await fetch(`${backendBaseUrl}/api/admin/stats`, {
			method: 'GET',
			headers: cookieHeader ? { cookie: cookieHeader } : {}
		});
		
		if (!res.ok) {
			console.error(`Failed to fetch stats: ${res.status}`);
			return { statsData: null };
		}

		const json = await res.json();
		return {
			statsData: json.data || null
		};
	} catch (error) {
		console.error('Load admin/stats error:', error);
		return { statsData: null };
	}
}
