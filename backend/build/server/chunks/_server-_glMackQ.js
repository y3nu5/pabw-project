import { j as json } from './index-lhTMmBNn.js';
import { g as getAuthenticatedUser } from './auth-CKVeimI7.js';
import { q as query } from './db-CaMA-jZS.js';
import 'bcryptjs';
import 'jsonwebtoken';
import './shared-server-cF6ckHns.js';
import 'pg';

const BOOKING_SELECT = `
	SELECT 
		b.*,
		r.name as room_name,
		r.code as room_code
	 FROM bookings b
	 JOIN rooms r ON b.room_id = r.id
`;
async function GET({ params, cookies }) {
  const authUser = getAuthenticatedUser(cookies);
  if (authUser?.role !== "admin") {
    return json({ error: "Unauthorized." }, { status: 401 });
  }
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return json({ error: "ID booking tidak valid." }, { status: 400 });
  }
  try {
    const { rows } = await query(
      `${BOOKING_SELECT} WHERE b.id = $1 LIMIT 1`,
      [id]
    );
    if (rows.length === 0) {
      return json({ error: "Booking tidak ditemukan." }, { status: 404 });
    }
    return json({ data: rows[0] });
  } catch (error) {
    console.error("GET /api/bookings/:id error:", error);
    return json({ error: "Gagal mengambil data booking." }, { status: 500 });
  }
}
async function PATCH({ params, request, cookies }) {
  const authUser = getAuthenticatedUser(cookies);
  if (authUser?.role !== "admin") {
    return json({ error: "Unauthorized." }, { status: 401 });
  }
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return json({ error: "ID booking tidak valid." }, { status: 400 });
  }
  try {
    const body = await request.json().catch(() => ({}));
    const { status } = body;
    if (!status) {
      return json({ error: "Status wajib diisi." }, { status: 400 });
    }
    const validStatuses = /* @__PURE__ */ new Set(["pending", "confirmed", "cancelled", "checked_in", "checked_out"]);
    if (!validStatuses.has(status)) {
      return json({ error: "Status tidak valid." }, { status: 400 });
    }
    const { rows } = await query(
      `UPDATE bookings 
			 SET status = $1, updated_at = NOW() 
			 WHERE id = $2 
			 RETURNING *`,
      [status, id]
    );
    if (rows.length === 0) {
      return json({ error: "Booking tidak ditemukan." }, { status: 404 });
    }
    return json({
      message: "Status booking berhasil diperbarui.",
      data: rows[0]
    });
  } catch (error) {
    console.error("PATCH /api/bookings/:id error:", error);
    return json({ error: "Gagal memperbarui status booking." }, { status: 500 });
  }
}

export { GET, PATCH };
//# sourceMappingURL=_server-_glMackQ.js.map
