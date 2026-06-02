import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

const backendBaseUrl = (env.PUBLIC_BACKEND_URL || 'http://localhost:3000').replace(/\/$/, '');

/** @type {import('./$types').LayoutServerLoad} */

export async function load({ cookies, fetch, url }) {
	const cookieHeader = cookies
		.getAll()
		.map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
		.join('; ');

	const res = await fetch(`${backendBaseUrl}/api/auth/me`, {
		method: 'GET',
		headers: cookieHeader ? { cookie: cookieHeader } : {}
	});

	if (res.status === 401) {
		throw redirect(302, `/login?redirectTo=${url.pathname}`);
	}

	if (!res.ok) {
		throw redirect(302, '/');
	}

	const payload = await res.json().catch(() => ({}));
	const user = payload?.data;

	if (!user || user.role !== 'admin') {
		throw redirect(302, '/');
	}

	return { user };
}
