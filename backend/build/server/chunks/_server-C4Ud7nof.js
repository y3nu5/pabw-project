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
    const { rows: totalBookingsRes } = await query(
      `SELECT COUNT(*) as count FROM bookings`
    );
    const totalBookings = parseInt(totalBookingsRes[0]?.count || "0", 10);
    const { rows: monthlyRevenueRes } = await query(
      `SELECT COALESCE(SUM(grand_total), 0) as total 
			 FROM bookings 
			 WHERE status IN ('confirmed', 'checked_in', 'checked_out')
			 AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
			 AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`
    );
    const monthlyRevenue = parseInt(monthlyRevenueRes[0]?.total || "0", 10);
    const { rows: roomStatsRes } = await query(
      `SELECT 
				COUNT(*) as total,
				SUM(CASE WHEN is_available = FALSE THEN 1 ELSE 0 END) as occupied,
				SUM(CASE WHEN is_available = TRUE THEN 1 ELSE 0 END) as available
			 FROM rooms`
    );
    const totalRooms = parseInt(roomStatsRes[0]?.total || "0", 10);
    const occupiedRooms = parseInt(roomStatsRes[0]?.occupied || "0", 10);
    const availableRooms = parseInt(roomStatsRes[0]?.available || "0", 10);
    const { rows: activeGuestsRes } = await query(
      `SELECT COUNT(DISTINCT email) as count FROM bookings`
    );
    const activeGuests = parseInt(activeGuestsRes[0]?.count || "0", 10);
    const { rows: recentBookings } = await query(
      `SELECT 
				b.id,
				b.booking_reference,
				b.first_name,
				b.last_name,
				b.check_in,
				b.check_out,
				b.status,
				b.grand_total,
				r.name as room_name,
				r.code as room_code
			 FROM bookings b
			 JOIN rooms r ON b.room_id = r.id
			 ORDER BY b.created_at DESC
			 LIMIT 4`
    );
    return json({
      success: true,
      data: {
        stats: {
          totalBookings,
          monthlyRevenue,
          occupiedRooms,
          totalRooms,
          availableRooms,
          activeGuests
        },
        recentBookings,
        roomStats: {
          available: availableRooms,
          occupied: occupiedRooms,
          maintenance: 0
        }
      }
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return json({ error: "Gagal memuat statistik admin." }, { status: 500 });
  }
}

export { GET };
//# sourceMappingURL=_server-C4Ud7nof.js.map
