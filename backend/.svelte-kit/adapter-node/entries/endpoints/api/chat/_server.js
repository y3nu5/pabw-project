import { b as private_env } from "../../../../chunks/shared-server.js";
import { json } from "@sveltejs/kit";
import { q as query } from "../../../../chunks/db.js";
import { g as getAuthenticatedUser } from "../../../../chunks/auth.js";
const OLLAMA_BASE_URL = (private_env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/$/, "");
const OLLAMA_MODEL = private_env.OLLAMA_MODEL || "qwen2.5:3b";
const IS_GROQ = OLLAMA_BASE_URL.includes("api.groq.com");
const IS_OPENAI_COMPAT = IS_GROQ || [
  "api.siliconflow.cn",
  "openrouter.ai",
  "api.openai.com",
  "api.together.xyz"
].some((host) => OLLAMA_BASE_URL.includes(host));
const IS_OLLAMA_CLOUD = OLLAMA_BASE_URL.includes("ollama.com");
const MAX_AGENT_STEPS = 6;
const TAX_RATE = 0.11;
const BASE_SYSTEM_PROMPT = `Anda adalah "Isabelle", Concierge AI eksklusif dari Grand Maison, hotel mewah bergaya Victorian dan Baroque berdiri sejak 1887 di Jakarta.

Kepribadian Anda:
- Elegan, sopan, dan profesional namun hangat
- Berbicara dengan Bahasa Indonesia yang indah dan formal
- Sesekali menyapa tamu dengan "Tuan" atau "Nyonya" jika konteksnya sesuai
- Tidak pernah membicarakan hal di luar konteks hotel dan perhotelan

Fasilitas Hotel:
- Grand Dining (restoran fine dining Perancis-Jawa)
- Royal Spa (perawatan tradisional & modern)
- Ballroom Baroque (kapasitas 500 tamu)
- Perpustakaan dengan koleksi buku antik
- Kolam Renang Victoria (outdoor, marmer klasik)
- Concierge 24/7

Info Penting:
- Alamat: Jl. Merdeka Raya No. 1, Jakarta Pusat 10110
- Telepon: +62 21 1234 5678
- Check-in: 14.00 WIB | Check-out: 12.00 WIB
- Early check-in & late check-out tersedia (surcharge berlaku)

Tugas utama Anda:
1. Sambut tamu dengan hangat dan jawab pertanyaan seputar hotel
2. Bantu pilih kamar sesuai kebutuhan, jumlah tamu, dan anggaran
3. Jelaskan fasilitas secara detail jika ditanya
4. Hitung total harga (harga kamar x jumlah malam + pajak 11%)
5. Buat reservasi LANGSUNG jika tamu meminta dan sudah memberikan semua data yang diperlukan
6. Jika tamu belum login, minta mereka login dulu sebelum booking otomatis

Untuk membuat reservasi otomatis, kumpulkan dari tamu:
- Pilihan kamar (kode/nama)
- Tanggal check-in (format YYYY-MM-DD)
- Tanggal check-out (format YYYY-MM-DD)
- Jumlah tamu
- Nama depan & belakang
- Email
- Nomor telepon
- Metode pembayaran (transfer/card/cash)

Jika tamu sudah login, gunakan data profil mereka untuk mengisi nama dan email secara otomatis.
Selalu konfirmasi detail sebelum membuat reservasi.`;
const TOOL_INSTRUCTIONS = `
Tools yang tersedia:

1) list_rooms(input: { available_only?: boolean })
   - Mengembalikan daftar kamar dari database
   - available_only: true untuk hanya kamar tersedia

2) get_room_detail(input: { room_type: string })
   - Detail lengkap kamar (deskripsi, fasilitas, harga, ukuran)
   - room_type: kode kamar atau id

3) calculate_price(input: { room_type: string, nights: number, guests?: number })
   - Hitung subtotal, pajak 11%, dan grand total
   - nights: jumlah malam (wajib)

4) create_booking(input: { room_code: string, first_name: string, last_name: string, email: string, phone: string, check_in: string, check_out: string, guests: number, payment_method?: string, special_request?: string })
   - BUAT RESERVASI NYATA di database
   - check_in & check_out: format YYYY-MM-DD
   - payment_method: "transfer", "card", atau "cash" (default: transfer)
   - Gunakan ini HANYA setelah tamu konfirmasi semua detail
   - Jika tamu sudah login, gunakan data profil mereka

5) create_booking_link(input: { room_type: string, check_in?: string, check_out?: string, guests?: number })
   - Alternatif: buat link ke halaman booking manual
   - Gunakan jika tamu lebih suka isi form sendiri

Aturan respons agent:
- Output HANYA JSON valid TANPA markdown/code block.
- Format: {"action":"tool","tool":"<nama>","input":{...}} atau {"action":"respond","reply":"<jawaban>","booking_result":{...}}
- Jika data sudah cukup, balas dengan action=respond.
- Jika butuh data, panggil tool dulu.
- Untuk booking sukses, sertakan booking_result dalam action=respond.
`;
function toText(value) {
  return typeof value === "string" ? value.trim() : "";
}
function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return NaN;
}
function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(amount);
}
function parseJsonObject(text) {
  const trimmed = toText(text);
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace < 0 || lastBrace <= firstBrace) return null;
    try {
      const candidate = trimmed.slice(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(candidate);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }
}
async function getRoomsFromDatabase() {
  const { rows } = await query(
    `SELECT id, code, name, category, description, price_per_night, size_sqm, max_guests, features, is_available
		 FROM rooms
		 ORDER BY price_per_night ASC, id ASC`
  );
  return rows;
}
function buildRoomsSummary(rooms) {
  if (rooms.length === 0) return "- Tidak ada data kamar tersedia saat ini.";
  return rooms.map(
    (r) => `- ${r.name} (code: ${r.code}, id: ${r.id}) | ${formatRupiah(r.price_per_night)}/malam | maks ${r.max_guests} tamu | tersedia: ${r.is_available ? "ya" : "tidak"}`
  ).join("\n");
}
function findRoom(rooms, lookup) {
  const normalized = toText(lookup).toLowerCase();
  if (!normalized) return null;
  if (/^\d+$/.test(normalized)) {
    const id = Number(normalized);
    return rooms.find((r) => Number(r.id) === id) || null;
  }
  return rooms.find((r) => String(r.code).toLowerCase() === normalized) || null;
}
function createBookingLink(rawInput) {
  const input = rawInput && typeof rawInput === "object" ? rawInput : {};
  const roomType = toText(input.room_type);
  if (!roomType) return { error: "room_type wajib diisi." };
  const params = new URLSearchParams();
  params.set("roomType", roomType);
  const checkIn = toText(input.check_in);
  const checkOut = toText(input.check_out);
  const guests = toNumber(input.guests);
  if (checkIn) params.set("checkIn", checkIn);
  if (checkOut) params.set("checkOut", checkOut);
  if (Number.isFinite(guests) && guests > 0) params.set("guests", String(Math.trunc(guests)));
  return { booking_url: `/booking?${params.toString()}`, message: "Link booking berhasil dibuat." };
}
async function createBookingDirect(rawInput, rooms, authUser) {
  const input = rawInput && typeof rawInput === "object" ? rawInput : {};
  const room_code = toText(input.room_code).toUpperCase();
  const first_name = toText(input.first_name);
  const last_name = toText(input.last_name);
  const email = toText(input.email);
  const phone = toText(input.phone);
  const check_in = toText(input.check_in);
  const check_out = toText(input.check_out);
  const guests = Math.trunc(toNumber(input.guests));
  const payment_method = toText(input.payment_method) || "transfer";
  const special_request = toText(input.special_request);
  if (!room_code || !first_name || !last_name || !email || !check_in || !check_out || isNaN(guests)) {
    return { error: "Data tidak lengkap. Diperlukan: room_code, first_name, last_name, email, phone, check_in, check_out, guests." };
  }
  if (!["transfer", "card", "cash"].includes(payment_method)) {
    return { error: "payment_method harus: transfer, card, atau cash." };
  }
  const room = findRoom(rooms, room_code);
  if (!room) return { error: `Kamar dengan kode ${room_code} tidak ditemukan.` };
  if (!room.is_available) return { error: `Kamar ${room.name} sedang tidak tersedia.` };
  const checkInDate = new Date(check_in);
  const checkOutDate = new Date(check_out);
  const diffTime = checkOutDate.getTime() - checkInDate.getTime();
  const nights = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
  if (nights <= 0) return { error: "Check-out harus setelah check-in." };
  if (guests > room.max_guests) return { error: `Jumlah tamu melebihi kapasitas kamar (maksimum ${room.max_guests}).` };
  const subtotal = room.price_per_night * nights;
  const tax = Math.round(subtotal * TAX_RATE);
  const grandTotal = subtotal + tax;
  const ref = "GM" + Math.random().toString(36).substring(2, 9).toUpperCase();
  const userId = authUser?.id || null;
  try {
    const { rows } = await query(
      `INSERT INTO bookings (
				booking_reference, room_id, user_id, check_in, check_out, guests,
				first_name, last_name, email, phone, nationality, special_request,
				payment_method, subtotal, tax_amount, grand_total, status
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ID', $11, $12, $13, $14, $15, 'confirmed')
			RETURNING id, booking_reference, status`,
      [ref, room.id, userId, check_in, check_out, guests, first_name, last_name, email, phone, special_request, payment_method, subtotal, tax, grandTotal]
    );
    return {
      success: true,
      booking_reference: ref,
      booking_id: rows[0].id,
      room: room.name,
      room_code: room.code,
      check_in,
      check_out,
      nights,
      guests,
      guest_name: `${first_name} ${last_name}`,
      email,
      payment_method,
      subtotal_formatted: formatRupiah(subtotal),
      tax_formatted: formatRupiah(tax),
      grand_total_formatted: formatRupiah(grandTotal),
      grand_total: grandTotal,
      status: "confirmed",
      message: `Reservasi berhasil dibuat dengan referensi ${ref}.`
    };
  } catch (error) {
    return { error: `Database error: ${/** @type {any} */
    error?.message}` };
  }
}
async function runTool(toolName, rawInput, rooms, authUser) {
  const input = rawInput && typeof rawInput === "object" ? rawInput : {};
  if (toolName === "list_rooms") {
    const availableOnly = input.available_only === true;
    const filtered = availableOnly ? rooms.filter((r) => r.is_available) : rooms;
    return {
      count: filtered.length,
      rooms: filtered.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        category: r.category,
        price_per_night: r.price_per_night,
        price_formatted: formatRupiah(r.price_per_night),
        max_guests: r.max_guests,
        is_available: r.is_available
      }))
    };
  }
  if (toolName === "get_room_detail") {
    const room = findRoom(rooms, toText(input.room_type));
    if (!room) return { error: "Kamar tidak ditemukan." };
    return {
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
        category: room.category,
        description: room.description,
        price_per_night: room.price_per_night,
        price_formatted: formatRupiah(room.price_per_night),
        size_sqm: room.size_sqm,
        max_guests: room.max_guests,
        features: Array.isArray(room.features) ? room.features : [],
        is_available: room.is_available
      }
    };
  }
  if (toolName === "calculate_price") {
    const room = findRoom(rooms, toText(input.room_type));
    if (!room) return { error: "Kamar tidak ditemukan." };
    const nights = Math.trunc(toNumber(input.nights));
    if (!Number.isFinite(nights) || nights < 1) return { error: "nights harus >= 1." };
    const guests = Math.trunc(toNumber(input.guests));
    if (Number.isFinite(guests) && guests > room.max_guests) {
      return { error: `Jumlah tamu melebihi kapasitas (maks ${room.max_guests}).` };
    }
    const subtotal = room.price_per_night * nights;
    const tax = Math.round(subtotal * TAX_RATE);
    const total = subtotal + tax;
    return {
      room: room.name,
      room_code: room.code,
      nights,
      price_per_night: room.price_per_night,
      subtotal,
      tax_11pct: tax,
      grand_total: total,
      formatted: {
        price_per_night: formatRupiah(room.price_per_night),
        subtotal: formatRupiah(subtotal),
        tax_11pct: formatRupiah(tax),
        grand_total: formatRupiah(total)
      }
    };
  }
  if (toolName === "create_booking") {
    return await createBookingDirect(input, rooms, authUser);
  }
  if (toolName === "create_booking_link") {
    return createBookingLink(input);
  }
  return { error: `Tool tidak ditemukan: ${toolName}` };
}
function mapIncomingMessages(input) {
  return input.map((m) => ({
    /** @type {'assistant' | 'user'} */
    role: m?.role === "assistant" ? "assistant" : "user",
    content: toText(m?.content)
  })).filter((m) => m.content !== "");
}
function isAIUnavailable(error) {
  const msg = error && typeof error === "object" && "message" in error ? toText(
    /** @type {any} */
    error.message
  ).toLowerCase() : "";
  return msg.startsWith("ollama_unavailable:") || msg.includes("connect") || msg.includes("econnrefused") || msg.includes("enotfound") || msg.includes("ehostunreach");
}
async function callOllama(messages) {
  let response;
  let url;
  let body;
  if (IS_OPENAI_COMPAT) {
    const base = OLLAMA_BASE_URL.replace(/\/(openai\/)?v1\/?$/, "");
    const apiPath = IS_GROQ ? "/openai/v1/chat/completions" : "/v1/chat/completions";
    url = `${base}${apiPath}`;
    body = JSON.stringify({ model: OLLAMA_MODEL, stream: false, messages });
  } else {
    const base = IS_OLLAMA_CLOUD ? "https://ollama.com" : OLLAMA_BASE_URL;
    url = `${base}/api/chat`;
    body = JSON.stringify({ model: OLLAMA_MODEL, stream: false, messages });
  }
  console.log("[Guest Chat] URL:", url, "| Model:", OLLAMA_MODEL);
  const headers = (
    /** @type {Record<string,string>} */
    { "Content-Type": "application/json" }
  );
  if (private_env.OLLAMA_API_KEY) headers["Authorization"] = `Bearer ${private_env.OLLAMA_API_KEY.trim()}`;
  try {
    response = await fetch(url, { method: "POST", headers, body });
  } catch (error) {
    const msg = error && typeof error === "object" && "message" in error ? toText(
      /** @type {any} */
      error.message
    ) : "fetch error";
    throw new Error(`OLLAMA_UNAVAILABLE: ${msg}`);
  }
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI request gagal: ${errText}`);
  }
  const data = await response.json();
  const content = IS_OPENAI_COMPAT ? toText(data?.choices?.[0]?.message?.content) : toText(data?.message?.content);
  if (!content) throw new Error("AI tidak mengembalikan konten respons.");
  return content;
}
async function POST({ request, cookies }) {
  let messages = [];
  let rooms = [];
  try {
    const body = await request.json().catch(() => ({}));
    messages = Array.isArray(body?.messages) ? mapIncomingMessages(body.messages) : [];
    rooms = await getRoomsFromDatabase();
    const authUser = getAuthenticatedUser(cookies);
    const userContext = authUser ? `
Tamu yang sedang login: ${authUser.email} (ID: ${authUser.id})
Gunakan data ini untuk mengisi email jika tamu ingin booking otomatis.` : "\nTamu belum login. Jika ingin booking otomatis, minta tamu login terlebih dahulu atau gunakan create_booking_link sebagai alternatif.";
    const dynamicSystemPrompt = `${BASE_SYSTEM_PROMPT}${userContext}

Kamar tersedia saat ini (dari database):
${buildRoomsSummary(rooms)}

${TOOL_INSTRUCTIONS}`;
    const agentMessages = [{ role: "system", content: dynamicSystemPrompt }, ...messages];
    for (let i = 0; i < MAX_AGENT_STEPS; i++) {
      let modelOutput;
      try {
        modelOutput = await callOllama(agentMessages);
      } catch (error) {
        if (isAIUnavailable(error)) {
          return json({
            reply: "Maaf, layanan AI sedang tidak tersedia. Silakan kunjungi halaman /booking untuk reservasi langsung.",
            degraded: true
          });
        }
        throw error;
      }
      const payload = parseJsonObject(modelOutput);
      if (!payload) {
        return json({ reply: modelOutput });
      }
      const action = toText(payload.action).toLowerCase();
      if (action === "respond") {
        const reply = toText(payload.reply);
        const bookingResult = payload.booking_result || null;
        return json({
          reply: reply || "Maaf, saya belum bisa memproses permintaan Anda saat ini.",
          ...bookingResult ? { booking_result: bookingResult } : {}
        });
      }
      if (action === "tool") {
        const toolName = toText(payload.tool).toLowerCase();
        const toolResult = await runTool(toolName, payload.input, rooms, authUser);
        agentMessages.push({ role: "assistant", content: JSON.stringify(payload) });
        agentMessages.push({
          role: "user",
          content: `TOOL_RESULT ${toolName}: ${JSON.stringify(toolResult)}. ${toolName === "create_booking" && /** @type {any} */
          toolResult.success ? "Booking berhasil! Sertakan booking_result dalam respons action=respond: " + JSON.stringify(toolResult) : "Jika data sudah cukup, balas dengan action=respond."}`
        });
        continue;
      }
      return json({ reply: "Maaf, saya mengalami kendala internal. Silakan coba lagi." });
    }
    return json({ reply: "Maaf, permintaan terlalu kompleks. Mohon ringkas dan coba lagi." });
  } catch (error) {
    if (isAIUnavailable(error)) {
      return json({
        reply: "Maaf, layanan AI sedang tidak tersedia. Silakan gunakan halaman /booking untuk reservasi.",
        degraded: true
      });
    }
    console.error("POST /api/chat error:", error);
    return json({ error: "Gagal memproses chat AI." }, { status: 500 });
  }
}
export {
  POST
};
