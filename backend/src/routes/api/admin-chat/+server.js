import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { getAuthenticatedUser } from '$lib/server/auth';
import { query } from '$lib/server/db';

const OLLAMA_BASE_URL = (env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const OLLAMA_MODEL = env.OLLAMA_MODEL || 'mistral:7b';
const MAX_AGENT_STEPS = 5;
const TAX_RATE = 0.11;

const ADMIN_SYSTEM_PROMPT = `Anda adalah "Grand Maison Admin Assistant", asisten AI administratif untuk hotel mewah Grand Maison.

Kepribadian Anda:
- Profesional, efisien, dan fokus pada data
- Berbicara dalam Bahasa Indonesia yang formal
- Selalu memberikan data akurat dari database
- Membantu admin mengelola reservasi, kamar, dan operasional hotel

Kemampuan Anda:
- Lihat dan cari reservasi (by status, guest name, reference)
- Update status reservasi (pending → confirmed, cancelled, checked_in, checked_out)
- Lihat daftar kamar dan ketersediaannya
- Analisis data: revenue harian, occupancy rate, booking pending
- Hitung harga kamar dengan pajak 11%

Info Penting:
- Anda hanya bisa melayani user yang sudah login sebagai ADMIN
- Selalu konfirmasi sebelum mengubah data penting
- Format rupiah: Rp X.XXX.XXX
- Status valid: pending, confirmed, cancelled, checked_in, checked_out

Aturan respons:
- Hanya output JSON TANPA markdown/code block
- Format: {"action":"tool","tool":"<nama>","input":{...}} atau {"action":"respond","reply":"..."}
- Jika data cukup, balas dengan action=respond
- Jika butuh data, panggil tool dulu`;

const TOOL_INSTRUCTIONS = `
Tools yang tersedia:

1) list_bookings(input: { status?: string, limit?: number })
   - Lihat daftar reservasi
   - status: "pending", "confirmed", "cancelled", "checked_in", "checked_out" (optional)
   - limit: jumlah hasil (default 10)

2) search_booking(input: { query: string })
   - Cari reservasi by guest name, email, atau booking reference
   - query: kata kunci pencarian (required)

3) update_booking_status(input: { booking_id: number, new_status: string })
   - Ubah status reservasi
   - new_status: "pending", "confirmed", "cancelled", "checked_in", "checked_out"
   - Selalu konfirmasi perubahan ke user

4) list_rooms(input: { available_only?: boolean, limit?: number })
   - Lihat daftar kamar
   - available_only: hanya kamar tersedia (true/false)
   - limit: jumlah hasil (default 20)

5) get_analytics(input: { metric: string })
   - metric: "revenue_today", "occupancy_rate", "pending_bookings", "total_stats"

Contoh JSON yang benar:
{"action":"tool","tool":"list_bookings","input":{"status":"pending","limit":5}}
{"action":"respond","reply":"Daftar booking pending..."}`;

/**
 * @param {unknown} value
 */
function toText(value) {
	return typeof value === 'string' ? value.trim() : '';
}

/**
 * @param {unknown} value
 */
function toNumber(value) {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string' && value.trim() !== '') {
		const parsed = Number(value);
		if (Number.isFinite(parsed)) return parsed;
	}
	return NaN;
}

/**
 * @param {number} amount
 */
function formatRupiah(amount) {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		minimumFractionDigits: 0
	}).format(amount);
}

/**
 * @param {string} text
 */
function parseJsonObject(text) {
	const trimmed = toText(text);
	if (!trimmed) return null;

	try {
		const parsed = JSON.parse(trimmed);
		return parsed && typeof parsed === 'object' ? parsed : null;
	} catch {
		const firstBrace = trimmed.indexOf('{');
		const lastBrace = trimmed.lastIndexOf('}');
		if (firstBrace < 0 || lastBrace <= firstBrace) return null;

		try {
			const candidate = trimmed.slice(firstBrace, lastBrace + 1);
			const parsed = JSON.parse(candidate);
			return parsed && typeof parsed === 'object' ? parsed : null;
		} catch {
			return null;
		}
	}
}

async function listBookings(input) {
	const status = toText(input.status).toLowerCase();
	const limit = Math.min(Math.max(1, Math.trunc(toNumber(input.limit)) || 10), 100);

	let sql = `
		SELECT 
			b.id,
			b.booking_reference,
			b.first_name,
			b.last_name,
			b.email,
			b.phone,
			b.check_in,
			b.check_out,
			b.guests,
			b.status,
			b.total_price,
			b.created_at,
			r.name as room_name,
			r.code as room_code
		FROM bookings b
		JOIN rooms r ON b.room_id = r.id
	`;

	const params = [];
	if (status && ['pending', 'confirmed', 'cancelled', 'checked_in', 'checked_out'].includes(status)) {
		sql += ` WHERE b.status = $1`;
		params.push(status);
	}

	sql += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1}`;
	params.push(limit);

	try {
		const { rows } = await query(sql, params);
		return {
			count: rows.length,
			bookings: rows.map((b) => ({
				id: b.id,
				reference: b.booking_reference,
				guest: `${b.first_name} ${b.last_name}`,
				email: b.email,
				phone: b.phone,
				check_in: b.check_in,
				check_out: b.check_out,
				guests: b.guests,
				status: b.status,
				room: `${b.room_name} (${b.room_code})`,
				total_price: b.total_price,
				total_price_formatted: formatRupiah(b.total_price),
				created_at: b.created_at
			}))
		};
	} catch (error) {
		return { error: `Database error: ${error.message}` };
	}
}

async function searchBooking(input) {
	const queryText = toText(input.query);
	if (!queryText) {
		return { error: 'query wajib diisi.' };
	}

	const searchTerm = `%${queryText}%`;

	try {
		const { rows } = await query(
			`SELECT 
				b.id,
				b.booking_reference,
				b.first_name,
				b.last_name,
				b.email,
				b.phone,
				b.check_in,
				b.check_out,
				b.guests,
				b.status,
				b.total_price,
				b.created_at,
				r.name as room_name,
				r.code as room_code
			 FROM bookings b
			 JOIN rooms r ON b.room_id = r.id
			 WHERE 
				b.booking_reference ILIKE $1
				OR b.first_name ILIKE $1
				OR b.last_name ILIKE $1
				OR b.email ILIKE $1
			 ORDER BY b.created_at DESC
			 LIMIT 10`,
			[searchTerm]
		);

		if (rows.length === 0) {
			return { error: `Tidak ada booking yang cocok dengan "${queryText}".` };
		}

		return {
			count: rows.length,
			bookings: rows.map((b) => ({
				id: b.id,
				reference: b.booking_reference,
				guest: `${b.first_name} ${b.last_name}`,
				email: b.email,
				phone: b.phone,
				check_in: b.check_in,
				check_out: b.check_out,
				guests: b.guests,
				status: b.status,
				room: `${b.room_name} (${b.room_code})`,
				total_price: b.total_price,
				total_price_formatted: formatRupiah(b.total_price),
				created_at: b.created_at
			}))
		};
	} catch (error) {
		return { error: `Database error: ${error.message}` };
	}
}

async function updateBookingStatus(input) {
	const bookingId = Math.trunc(toNumber(input.booking_id));
	const newStatus = toText(input.new_status).toLowerCase();

	if (!Number.isFinite(bookingId) || bookingId < 1) {
		return { error: 'booking_id harus angka positif.' };
	}

	if (!['pending', 'confirmed', 'cancelled', 'checked_in', 'checked_out'].includes(newStatus)) {
		return {
			error: 'new_status harus salah satu: pending, confirmed, cancelled, checked_in, checked_out.'
		};
	}

	try {
		const { rows: existing } = await query(
			`SELECT id, booking_reference, status FROM bookings WHERE id = $1`,
			[bookingId]
		);

		if (existing.length === 0) {
			return { error: `Booking dengan ID ${bookingId} tidak ditemukan.` };
		}

		const oldStatus = existing[0].status;
		await query(`UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2`, [
			newStatus,
			bookingId
		]);

		return {
			success: true,
			message: `Status booking ${existing[0].booking_reference} berhasil diubah dari "${oldStatus}" ke "${newStatus}".`,
			booking_id: bookingId,
			old_status: oldStatus,
			new_status: newStatus
		};
	} catch (error) {
		return { error: `Database error: ${error.message}` };
	}
}

async function listRooms(input) {
	const availableOnly = input.available_only === true;
	const limit = Math.min(Math.max(1, Math.trunc(toNumber(input.limit)) || 20), 100);

	let sql = `
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
			is_available,
			created_at
		FROM rooms
	`;

	const params = [];
	if (availableOnly) {
		sql += ` WHERE is_available = TRUE`;
	}

	sql += ` ORDER BY price_per_night ASC LIMIT $${params.length + 1}`;
	params.push(limit);

	try {
		const { rows } = await query(sql, params);
		return {
			count: rows.length,
			rooms: rows.map((r) => ({
				id: r.id,
				code: r.code,
				name: r.name,
				category: r.category,
				price_per_night: r.price_per_night,
				price_per_night_formatted: formatRupiah(r.price_per_night),
				size_sqm: r.size_sqm,
				max_guests: r.max_guests,
				features: Array.isArray(r.features) ? r.features : [],
				is_available: r.is_available,
				created_at: r.created_at
			}))
		};
	} catch (error) {
		return { error: `Database error: ${error.message}` };
	}
}

async function getAnalytics(input) {
	const metric = toText(input.metric).toLowerCase();

	if (!['revenue_today', 'occupancy_rate', 'pending_bookings', 'total_stats'].includes(metric)) {
		return {
			error: 'metric harus salah satu: revenue_today, occupancy_rate, pending_bookings, total_stats.'
		};
	}

	try {
		if (metric === 'revenue_today') {
			const { rows } = await query(
				`SELECT COALESCE(SUM(total_price), 0) as total_revenue, COUNT(*) as booking_count
				 FROM bookings
				 WHERE DATE(check_in) = CURRENT_DATE
				 AND status IN ('confirmed', 'checked_in', 'checked_out')`
			);
			const revenue = rows[0].total_revenue || 0;
			return {
				metric: 'revenue_today',
				revenue: revenue,
				revenue_formatted: formatRupiah(revenue),
				booking_count: rows[0].booking_count
			};
		}

		if (metric === 'occupancy_rate') {
			const { rows: roomStats } = await query(`
				SELECT 
					COUNT(*) as total_rooms,
					SUM(CASE WHEN is_available = FALSE THEN 1 ELSE 0 END) as occupied_rooms
				FROM rooms
			`);
			const totalRooms = roomStats[0].total_rooms || 1;
			const occupiedRooms = roomStats[0].occupied_rooms || 0;
			const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

			return {
				metric: 'occupancy_rate',
				total_rooms: totalRooms,
				occupied_rooms: occupiedRooms,
				available_rooms: totalRooms - occupiedRooms,
				occupancy_percentage: occupancyRate
			};
		}

		if (metric === 'pending_bookings') {
			const { rows } = await query(
				`SELECT COUNT(*) as pending_count, COALESCE(SUM(total_price), 0) as pending_revenue
				 FROM bookings
				 WHERE status = 'pending'`
			);
			return {
				metric: 'pending_bookings',
				pending_count: rows[0].pending_count,
				pending_revenue: rows[0].pending_revenue,
				pending_revenue_formatted: formatRupiah(rows[0].pending_revenue)
			};
		}

		if (metric === 'total_stats') {
			const { rows: totalBookings } = await query(
				`SELECT COUNT(*) as total FROM bookings`
			);
			const { rows: totalRooms } = await query(`SELECT COUNT(*) as total FROM rooms`);
			const { rows: totalGuests } = await query(
				`SELECT COUNT(DISTINCT email) as total FROM bookings`
			);

			return {
				metric: 'total_stats',
				total_bookings: totalBookings[0].total,
				total_rooms: totalRooms[0].total,
				total_guests: totalGuests[0].total
			};
		}
	} catch (error) {
		return { error: `Database error: ${error.message}` };
	}
}

/**
 * @param {string} toolName
 * @param {unknown} rawInput
 */
async function runAdminTool(toolName, rawInput) {
	/** @type {any} */
	const input = rawInput && typeof rawInput === 'object' ? rawInput : {};

	switch (toolName) {
		case 'list_bookings':
			return await listBookings(input);
		case 'search_booking':
			return await searchBooking(input);
		case 'update_booking_status':
			return await updateBookingStatus(input);
		case 'list_rooms':
			return await listRooms(input);
		case 'get_analytics':
			return await getAnalytics(input);
		default:
			return { error: `Tool tidak ditemukan: ${toolName}` };
	}
}

/**
 * @param {{ role: 'assistant' | 'user'; content: string }[]} input
 */
function mapIncomingMessages(input) {
	return input
		.map((message) => ({
			/** @type {'assistant' | 'user'} */
			role: message?.role === 'assistant' ? 'assistant' : 'user',
			content: toText(message?.content)
		}))
		.filter((message) => message.content !== '');
}

/**
 * @param {unknown} error
 */
function isOllamaUnavailable(error) {
	const message =
		error && typeof error === 'object' && 'message' in error ? toText(error.message).toLowerCase() : '';

	return (
		message.startsWith('ollama_unavailable:') ||
		message.includes('connect') ||
		message.includes('econnrefused') ||
		message.includes('enotfound') ||
		message.includes('ehostunreach')
	);
}

/**
 * @param {{ role: 'system' | 'user' | 'assistant'; content: string }[]} messages
 */
async function callOllama(messages) {
	let response;
	try {
		response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: OLLAMA_MODEL,
				stream: false,
				messages
			})
		});
	} catch (error) {
		const message =
			error && typeof error === 'object' && 'message' in error
				? toText(error.message)
				: 'fetch error';
		throw new Error(`OLLAMA_UNAVAILABLE: ${message}`);
	}

	if (!response.ok) {
		const errText = await response.text();
		throw new Error(`Ollama request gagal: ${errText}`);
	}

	const data = await response.json();
	const content = toText(data?.message?.content);
	if (!content) {
		throw new Error('Ollama tidak mengembalikan konten respons.');
	}

	return content;
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
	// Verifikasi admin authorization
	const authUser = getAuthenticatedUser(cookies);
	if (!authUser || authUser.role !== 'admin') {
		return json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
	}

	/** @type {{ role: 'assistant' | 'user'; content: string }[]} */
	let messages = [];

	try {
		const body = await request.json().catch(() => ({}));
		messages = Array.isArray(body?.messages) ? mapIncomingMessages(body.messages) : [];

		const dynamicSystemPrompt = `${ADMIN_SYSTEM_PROMPT}

Admin yang login: ${authUser.email}

${TOOL_INSTRUCTIONS}`;

		/** @type {{ role: 'system' | 'user' | 'assistant'; content: string }[]} */
		const agentMessages = [{ role: 'system', content: dynamicSystemPrompt }, ...messages];

		for (let i = 0; i < MAX_AGENT_STEPS; i += 1) {
			let modelOutput;
			try {
				modelOutput = await callOllama(agentMessages);
			} catch (error) {
				if (isOllamaUnavailable(error)) {
					return json({
						reply: 'Maaf, Ollama AI belum terhubung. Silakan pastikan Ollama sudah running di http://127.0.0.1:11434'
					});
				}
				throw error;
			}

			const payload = parseJsonObject(modelOutput);

			if (!payload) {
				return json({
					reply: modelOutput || 'Maaf, sistem AI belum siap merespons.'
				});
			}

			const action = toText(payload.action).toLowerCase();
			if (action === 'respond') {
				const reply = toText(payload.reply);
				return json({
					reply: reply || 'Maaf, saya belum bisa memproses permintaan Anda saat ini.'
				});
			}

			if (action === 'tool') {
				const toolName = toText(payload.tool).toLowerCase();
				const toolResult = await runAdminTool(toolName, payload.input);

				agentMessages.push({
					role: 'assistant',
					content: JSON.stringify(payload)
				});
				agentMessages.push({
					role: 'user',
					content: `TOOL_RESULT ${toolName}: ${JSON.stringify(toolResult)}. Jika sudah cukup, balas dengan action=respond.`
				});
				continue;
			}

			return json({
				reply: 'Maaf, saya mengalami kendala memahami aksi internal. Silakan coba pertanyaan lain.'
			});
		}

		return json({
			reply: 'Maaf, sistem AI telah mencapai batas iterasi. Silakan coba pertanyaan yang lebih spesifik.'
		});
	} catch (error) {
		console.error('POST /api/admin-chat error:', error);
		return json(
			{ error: 'Gagal memproses permintaan AI admin.' },
			{ status: 500 }
		);
	}
}
