import { j as json } from './index-lhTMmBNn.js';
import { g as getAuthenticatedUser } from './auth-CKVeimI7.js';
import { q as query } from './db-CaMA-jZS.js';
import 'bcryptjs';
import 'jsonwebtoken';
import './shared-server-cF6ckHns.js';
import 'pg';

async function GET({ cookies }) {
  const authUser = getAuthenticatedUser(cookies);
  if (authUser?.role !== "admin") {
    return json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const { rows } = await query(
      `SELECT id, email, first_name, last_name, role, created_at
			 FROM users
			 ORDER BY created_at DESC`
    );
    return json({ data: rows });
  } catch (error) {
    console.error("GET /api/users error:", error);
    return json({ error: "Gagal mengambil data user." }, { status: 500 });
  }
}

export { GET };
//# sourceMappingURL=_server-kWd9vnQN.js.map
