import { j as json } from './index-lhTMmBNn.js';
import { q as query } from './db-CaMA-jZS.js';
import { n as normalizeRoomLookup, t as toNonEmptyString, a as toInteger } from './validation-BP4I7G9F.js';
import { g as getAuthenticatedUser } from './auth-CKVeimI7.js';
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
async function GET({ params }) {
  const lookup = normalizeRoomLookup(params.id);
  if (!lookup) {
    return json({ error: "Parameter room id tidak valid." }, { status: 400 });
  }
  try {
    const whereClause = lookup.kind === "id" ? "id = $1" : "LOWER(code) = $1";
    const { rows } = await query(`${ROOM_SELECT} WHERE ${whereClause} LIMIT 1`, [lookup.value]);
    if (rows.length === 0) {
      return json({ error: "Kamar tidak ditemukan." }, { status: 404 });
    }
    return json({ data: rows[0] });
  } catch (error) {
    console.error("GET /api/rooms/:id error:", error);
    return json({ error: "Gagal mengambil data kamar." }, { status: 500 });
  }
}
async function PATCH({ params, request, cookies }) {
  const authUser = getAuthenticatedUser(cookies);
  if (authUser?.role !== "admin") {
    return json({ error: "Unauthorized." }, { status: 401 });
  }
  const lookup = normalizeRoomLookup(params.id);
  if (!lookup || lookup.kind !== "id") {
    return json({ error: "Parameter room id tidak valid." }, { status: 400 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const fieldsToUpdate = [];
    const values = [];
    let paramIdx = 1;
    if (body.code !== void 0) {
      const code = toNonEmptyString(body.code);
      if (!code) return json({ error: "Kode kamar tidak boleh kosong." }, { status: 400 });
      fieldsToUpdate.push(`code = $${paramIdx++}`);
      values.push(code);
    }
    if (body.name !== void 0) {
      const name = toNonEmptyString(body.name);
      if (!name) return json({ error: "Nama kamar tidak boleh kosong." }, { status: 400 });
      fieldsToUpdate.push(`name = $${paramIdx++}`);
      values.push(name);
    }
    if (body.category !== void 0) {
      const category = toNonEmptyString(body.category);
      if (!category) return json({ error: "Kategori kamar tidak boleh kosong." }, { status: 400 });
      fieldsToUpdate.push(`category = $${paramIdx++}`);
      values.push(category);
    }
    if (body.description !== void 0) {
      const description = toNonEmptyString(body.description);
      fieldsToUpdate.push(`description = $${paramIdx++}`);
      values.push(description);
    }
    if (body.price_per_night !== void 0) {
      const price = toInteger(body.price_per_night);
      if (isNaN(price) || price <= 0) return json({ error: "Harga kamar harus > 0." }, { status: 400 });
      fieldsToUpdate.push(`price_per_night = $${paramIdx++}`);
      values.push(price);
    }
    if (body.size_sqm !== void 0) {
      const size = parseFloat(body.size_sqm);
      if (isNaN(size) || size <= 0) return json({ error: "Ukuran kamar harus > 0." }, { status: 400 });
      fieldsToUpdate.push(`size_sqm = $${paramIdx++}`);
      values.push(size);
    }
    if (body.max_guests !== void 0) {
      const maxGuests = toInteger(body.max_guests);
      if (isNaN(maxGuests) || maxGuests <= 0) return json({ error: "Maksimal tamu harus > 0." }, { status: 400 });
      fieldsToUpdate.push(`max_guests = $${paramIdx++}`);
      values.push(maxGuests);
    }
    if (body.features !== void 0) {
      const features = Array.isArray(body.features) ? body.features : [];
      fieldsToUpdate.push(`features = $${paramIdx++}`);
      values.push(JSON.stringify(features));
    }
    if (body.is_available !== void 0) {
      const isAvailable = body.is_available === true || body.is_available === "true";
      fieldsToUpdate.push(`is_available = $${paramIdx++}`);
      values.push(isAvailable);
    }
    if (fieldsToUpdate.length === 0) {
      return json({ error: "Tidak ada field untuk diperbarui." }, { status: 400 });
    }
    values.push(lookup.value);
    const whereClauseIdx = paramIdx;
    const { rows } = await query(
      `UPDATE rooms
			 SET ${fieldsToUpdate.join(", ")}, updated_at = NOW()
			 WHERE id = $${whereClauseIdx}
			 RETURNING *`,
      values
    );
    if (rows.length === 0) {
      return json({ error: "Kamar tidak ditemukan." }, { status: 404 });
    }
    return json({ message: "Kamar berhasil diperbarui.", data: rows[0] });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return json({ error: "Kode kamar sudah terdaftar." }, { status: 409 });
    }
    console.error("PATCH /api/rooms/:id error:", error);
    return json({ error: "Gagal memperbarui kamar." }, { status: 500 });
  }
}

export { GET, PATCH };
//# sourceMappingURL=_server-rXelgTn1.js.map
