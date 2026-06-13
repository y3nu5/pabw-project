import { json } from "@sveltejs/kit";
import { g as getAuthenticatedUser } from "../../../../../chunks/auth.js";
import { q as query } from "../../../../../chunks/db.js";
async function GET({ cookies }) {
  const authUser = getAuthenticatedUser(cookies);
  if (!authUser?.id) {
    return json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const { rows } = await query(
      `SELECT id, email, role, first_name, last_name, phone, created_at
			 FROM users
			 WHERE id = $1
			 LIMIT 1`,
      [authUser.id]
    );
    if (rows.length === 0) {
      return json({ error: "User tidak ditemukan." }, { status: 404 });
    }
    return json({ data: rows[0] });
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return json({ error: "Gagal mengambil data user." }, { status: 500 });
  }
}
export {
  GET
};
