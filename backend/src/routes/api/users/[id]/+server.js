import { json } from '@sveltejs/kit';
import { getAuthenticatedUser } from '$lib/server/auth';
import { query } from '$lib/server/db';
import { toNonEmptyString } from '$lib/server/validation';

/** @type {import('./$types').RequestHandler} */
export async function PATCH({ params, request, cookies }) {
	const authUser = getAuthenticatedUser(cookies);
	if (authUser?.role !== 'admin') {
		return json({ error: 'Unauthorized.' }, { status: 401 });
	}

	const id = parseInt(params.id, 10);
	if (isNaN(id)) {
		return json({ error: 'ID user tidak valid.' }, { status: 400 });
	}

	try {
		const body = await request.json().catch(() => ({}));
		const { role } = body;

		if (!role) {
			return json({ error: 'Role wajib diisi.' }, { status: 400 });
		}

		if (role !== 'admin' && role !== 'guest') {
			return json({ error: 'Role tidak valid. Harus admin atau guest.' }, { status: 400 });
		}

		if (id === authUser.id && role !== 'admin') {
			return json({ error: 'Anda tidak dapat mengubah role Anda sendiri.' }, { status: 400 });
		}

		const { rows } = await query(
			`UPDATE users
			 SET role = $1, updated_at = NOW()
			 WHERE id = $2
			 RETURNING id, email, first_name, last_name, role, created_at`,
			[role, id]
		);

		if (rows.length === 0) {
			return json({ error: 'User tidak ditemukan.' }, { status: 404 });
		}

		return json({ message: 'Role user berhasil diperbarui.', data: rows[0] });
	} catch (error) {
		console.error('PATCH /api/users/:id error:', error);
		return json({ error: 'Gagal memperbarui user.' }, { status: 500 });
	}
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params, cookies }) {
	const authUser = getAuthenticatedUser(cookies);
	if (authUser?.role !== 'admin') {
		return json({ error: 'Unauthorized.' }, { status: 401 });
	}

	const id = parseInt(params.id, 10);
	if (isNaN(id)) {
		return json({ error: 'ID user tidak valid.' }, { status: 400 });
	}

	if (id === authUser.id) {
		return json({ error: 'Anda tidak dapat menghapus akun Anda sendiri.' }, { status: 400 });
	}

	try {
		const { rowCount } = await query(
			`DELETE FROM users WHERE id = $1`,
			[id]
		);

		if (rowCount === 0) {
			return json({ error: 'User tidak ditemukan.' }, { status: 404 });
		}

		return json({ message: 'Akun user berhasil dihapus.' });
	} catch (error) {
		console.error('DELETE /api/users/:id error:', error);
		return json({ error: 'Gagal menghapus user.' }, { status: 500 });
	}
}
