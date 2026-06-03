import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

const backendBaseUrl = (env.PUBLIC_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');

/** @type {import('./$types').RequestHandler} */
export async function GET({ cookies, fetch }) {
	try {
		const cookieHeader = cookies
			.getAll()
			.map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
			.join('; ');

		const res = await fetch(`${backendBaseUrl}/api/users`, {
			method: 'GET',
			headers: cookieHeader ? { cookie: cookieHeader } : {}
		});

		const body = await res.text();
		let payload = {};
		try {
			payload = body ? JSON.parse(body) : {};
		} catch {
			payload = { error: 'Respon backend tidak valid.' };
		}

		return json(payload, { status: res.status });
	} catch (error) {
		console.error('GET /api/users error:', error);
		return json({ error: 'Gagal mengambil data user.' }, { status: 500 });
	}
}
