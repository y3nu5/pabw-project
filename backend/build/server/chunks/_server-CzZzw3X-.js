import { j as json } from './index-lhTMmBNn.js';
import { q as query } from './db-CaMA-jZS.js';
import { g as getAuthenticatedUser } from './auth-CKVeimI7.js';
import { t as toNonEmptyString, a as toInteger } from './validation-BP4I7G9F.js';
import './shared-server-cF6ckHns.js';
import 'pg';
import 'bcryptjs';
import 'jsonwebtoken';

const ROOM_SELECT = `
	SELECT
		id,
		code,
		name,
		category,
		description,
		price_per_night,
		size_sqm,
		max_guests,
		features,
		is_available
	FROM rooms
`;
async function GET({ url }) {
  try {
    const availableParam = url.searchParams.get("available");
    const availableOnly = availableParam === "true" || availableParam === "1";
    const { rows } = await query(
      `${ROOM_SELECT}
			${availableOnly ? "WHERE is_available = TRUE" : ""}
			ORDER BY price_per_night ASC, id ASC`
    );
    return json({ data: rows });
  } catch (error) {
    console.error("GET /api/rooms error:", error);
    return json({ error: "Gagal mengambil data kamar." }, { status: 500 });
  }
}
async function POST({ request, cookies }) {
  const authUser = getAuthenticatedUser(cookies);
  if (authUser?.role !== "admin") {
    return json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const code = toNonEmptyString(body.code);
    const name = toNonEmptyString(body.name);
    const category = toNonEmptyString(body.category);
    const description = toNonEmptyString(body.description);
    const price_per_night = toInteger(body.price_per_night);
    const size_sqm = parseFloat(body.size_sqm);
    const max_guests = toInteger(body.max_guests);
    const features = Array.isArray(body.features) ? body.features : [];
    const is_available = body.is_available !== false;
    if (!code || !name || !category || !description || isNaN(price_per_night) || isNaN(size_sqm) || isNaN(max_guests)) {
      return json({ error: "Semua field wajib diisi dengan format valid." }, { status: 400 });
    }
    if (price_per_night <= 0 || size_sqm <= 0 || max_guests <= 0) {
      return json({ error: "Harga, ukuran, dan kapasitas harus lebih besar dari 0." }, { status: 400 });
    }
    const { rows } = await query(
      `INSERT INTO rooms (
				code, name, category, description, price_per_night, size_sqm, max_guests, features, is_available
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			RETURNING *`,
      [code, name, category, description, price_per_night, size_sqm, max_guests, JSON.stringify(features), is_available]
    );
    return json({ message: "Kamar berhasil dibuat.", data: rows[0] }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return json({ error: "Kode kamar sudah terdaftar." }, { status: 409 });
    }
    console.error("POST /api/rooms error:", error);
    return json({ error: "Gagal membuat kamar baru." }, { status: 500 });
  }
}

export { GET, POST };
//# sourceMappingURL=_server-CzZzw3X-.js.map
