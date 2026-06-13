import { json } from "@sveltejs/kit";
import { v as verifyPassword, c as createAccessToken, s as setAuthCookie } from "../../../../../chunks/auth.js";
import { q as query } from "../../../../../chunks/db.js";
import { t as toNonEmptyString, i as isValidEmail } from "../../../../../chunks/validation.js";
async function POST({ request, cookies }) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = toNonEmptyString(body.email).toLowerCase();
    const password = toNonEmptyString(body.password);
    if (!email || !password) {
      return json({ error: "Field wajib: email, password." }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return json({ error: "Format email tidak valid." }, { status: 400 });
    }
    const { rows } = await query(
      `SELECT id, email, role, password_hash, first_name, last_name, phone, created_at
			 FROM users
			 WHERE email = $1
			 LIMIT 1`,
      [email]
    );
    const user = rows[0];
    if (!user) {
      return json({ error: "Email atau password tidak valid." }, { status: 401 });
    }
    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      return json({ error: "Email atau password tidak valid." }, { status: 401 });
    }
    const token = createAccessToken({
      id: user.id,
      email: user.email,
      role: user.role
    });
    setAuthCookie(cookies, token);
    const { password_hash, ...safeUser } = user;
    return json({
      message: "Login berhasil.",
      data: {
        user: safeUser,
        token
      }
    });
  } catch (error) {
    console.error("POST /api/auth/login error:", error);
    return json({ error: "Gagal melakukan login." }, { status: 500 });
  }
}
export {
  POST
};
