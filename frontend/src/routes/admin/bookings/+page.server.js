import { env } from '$env/dynamic/public';

const backendBaseUrl = (env.PUBLIC_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');

/** @type {import('./$types').PageServerLoad} */
export async function load({ cookies, fetch, url }) {
	try {
		const search = url.searchParams.get('search') || '';
		const status = url.searchParams.get('status') || '';

		const cookieHeader = cookies
			.getAll()
			.map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
			.join('; ');

		const queryParams = new URLSearchParams();
		if (search) queryParams.set('search', search);
		if (status) queryParams.set('status', status);

		const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

		const res = await fetch(`${backendBaseUrl}/api/bookings${queryString}`, {
			method: 'GET',
			headers: cookieHeader ? { cookie: cookieHeader } : {}
		});
		const json = await res.json();
		return {
			bookings: json.data || []
		};
	} catch (error) {
		console.error('Load admin/bookings error:', error);
		return { bookings: [] };
	}
}
