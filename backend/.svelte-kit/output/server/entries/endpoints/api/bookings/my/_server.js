import { json } from "@sveltejs/kit";
import { g as getAuthenticatedUser } from "../../../../../chunks/auth.js";
import { q as query } from "../../../../../chunks/db.js";
async function GET({ cookies }) {
  const authUser = getAuthenticatedUser(cookies);
  if (!authUser) {
    return json({ error: "Unauthorized. Silakan login terlebih dahulu." }, { status: 401 });
  }
  try {
    const { rows } = await query(
      `SELECT 
				b.*,
				r.name as room_name,
				r.code as room_code
			 FROM bookings b
			 JOIN rooms r ON b.room_id = r.id
			 WHERE b.user_id = $1 OR b.email = $2
			 ORDER BY b.created_at DESC`,
      [authUser.id, authUser.email]
    );
    return json({ success: true, data: rows });
  } catch (error) {
    console.error("GET /api/bookings/my error:", error);
    return json({ error: "Gagal mengambil riwayat booking." }, { status: 500 });
  }
}
export {
  GET
};
