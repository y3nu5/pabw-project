# LLM Admin Feature - Implementation Guide

## 🎯 Apa itu LLM Admin?

LLM Admin adalah sistem AI yang memungkinkan admin hotel mengelola operasional melalui natural language commands. Admin bisa:
- ✅ Lihat dan cari reservasi
- ✅ Update status booking
- ✅ Lihat daftar kamar
- ✅ Analisis data hotel (revenue, occupancy rate)

---

## 📁 File yang Dibuat/Diubah

### Backend
- **File Baru**: `/backend/src/routes/api/admin-chat/+server.js`
  - Endpoint: `POST /api/admin-chat`
  - Authentication: Admin only
  - Integration: Ollama LLM + Database tools

### Frontend
- **File Diupdate**: `/frontend/src/lib/components/AdminAIConsole.svelte`
  - Connect ke backend `/api/admin-chat`
  - UI: Terminal-style console
  - Conversation tracking

---

## 🚀 Cara Menggunakan

### Step 1: Pastikan Backend Running

```bash
# Terminal 1 - Backend
cd backend
bun run dev
```

Output:
```
VITE v7.3.2 ready in XXX ms
listening on port 3000
```

### Step 2: Jalankan Frontend

```bash
# Terminal 2 - Frontend
cd frontend
bun run dev
```

Output:
```
VITE v7.3.1 ready in XXX ms
Local: http://localhost:5173
```

### Step 3: Pastikan Ollama Running

```bash
# Terminal 3
ollama serve
```

Output:
```
Listening on 127.0.0.1:11434
```

### Step 4: Login sebagai Admin

1. Buka http://localhost:5173/login
2. Email: `admin@grandmaison.com`
3. Password: `admin123`
4. Klik **Login** → Akan redirect ke `/admin/`

### Step 5: Gunakan Admin AI Console

Di dashboard admin, Anda akan lihat AI Console di bagian kanan bawah. Ketik perintah:

```
Lihat booking pending
```

Atau:

```
Cari reservasi atas nama Siti
```

---

## 💬 Contoh Perintah

### 1. Lihat Reservasi

**Perintah:**
```
Lihat 5 booking terakhir yang pending
```

**Response:**
```
Daftar booking pending:
1. GM-X8K9-AF | Siti Rahayu | Suite Baroque | Check-in: 2024-05-01 | Rp 4.500.000
2. GM-P2W1-BC | Budi Santoso | Superior Klasik | Check-in: 2024-05-02 | Rp 1.200.000
...
```

### 2. Cari Booking

**Perintah:**
```
Cari reservasi Siti
```

**Response:**
```
Ditemukan 2 booking atas nama Siti:
1. GM-X8K9-AF | Siti Rahayu | Suite Baroque
2. [Detail lainnya]
```

### 3. Update Status Booking

**Perintah:**
```
Ubah booking dengan ID 1 statusnya jadi confirmed
```

**Response:**
```
✓ Status booking GM-X8K9-AF berhasil diubah dari "pending" ke "confirmed"
```

### 4. Lihat Statistik

**Perintah:**
```
Berapa occupancy rate hari ini?
```

**Response:**
```
Tingkat okupansi saat ini:
- Total kamar: 48
- Kamar terisi: 36
- Kamar tersedia: 12
- Occupancy rate: 75%
```

### 5. Revenue Analysis

**Perintah:**
```
Berapa total revenue hari ini?
```

**Response:**
```
Revenue hari ini:
- Total: Rp 45.000.000
- Dari 5 booking yang confirmed/checked-in/checked-out
```

---

## 🔧 Tools yang Tersedia

Backend memiliki 5 tools utama yang dipanggil LLM:

### 1. `list_bookings`
Lihat daftar reservasi dengan filter status

**Input:**
```json
{
  "status": "pending",  // optional: pending, confirmed, cancelled, checked_in, checked_out
  "limit": 10           // optional: berapa hasil (default 10, max 100)
}
```

### 2. `search_booking`
Cari booking by guest name, email, atau reference

**Input:**
```json
{
  "query": "Siti"  // required: kata kunci pencarian
}
```

### 3. `update_booking_status`
Ubah status reservasi

**Input:**
```json
{
  "booking_id": 1,
  "new_status": "confirmed"  // pending, confirmed, cancelled, checked_in, checked_out
}
```

### 4. `list_rooms`
Daftar kamar dengan filter ketersediaan

**Input:**
```json
{
  "available_only": true,  // optional: hanya kamar tersedia
  "limit": 20             // optional: berapa hasil (default 20, max 100)
}
```

### 5. `get_analytics`
Dapatkan statistik hotel

**Input:**
```json
{
  "metric": "occupancy_rate"  // revenue_today, occupancy_rate, pending_bookings, total_stats
}
```

---

## 📊 Sistem Kerja

```
Frontend (AdminAIConsole)
         ↓
         ↓ Fetch POST /api/admin-chat
         ↓
Backend (/api/admin-chat endpoint)
    ├─ 1. Verifikasi admin auth
    ├─ 2. Build system prompt
    ├─ 3. Call Ollama LLM
    │
    ├─ LLM Decision Loop:
    │  ├─ LLM membaca perintah user
    │  ├─ LLM putuskan tool apa yang diperlukan
    │  ├─ LLM return JSON: {"action":"tool","tool":"...", "input":{...}}
    │  │
    │  ├─ Backend execute tool
    │  ├─ Get database result
    │  ├─ Send back to LLM
    │  │
    │  ├─ LLM process result
    │  └─ LLM return: {"action":"respond","reply":"..."}
    │
    └─ Return response ke frontend
```

---

## ⚙️ Konfigurasi Environment

**Backend `.env`:**
```env
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=mistral:7b
```

**Frontend `.env`:**
```env
PUBLIC_BACKEND_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🐛 Troubleshooting

| Error | Solusi |
|-------|--------|
| `Ollama AI belum terhubung` | Pastikan Ollama sudah running: `ollama serve` |
| `Unauthorized. Admin access required` | Login sebagai admin dulu, bukan guest |
| `Gagal memproses perintah` | Cek console browser (F12) untuk error detail |
| `Database error` | Pastikan Supabase connection string valid di `.env` |
| AI tidak merespons | Restart Ollama dan refresh browser |

---

## 🎓 Contoh Workflow Lengkap

### Scenario: Admin ingin confirm booking dan lihat revenue

**Step 1: Admin login**
- Buka http://localhost:5173/login
- Masuk sebagai admin

**Step 2: Lihat pending bookings**
- Di Admin Dashboard, ketik di AI Console:
```
Lihat booking yang statusnya pending
```
- Lihat hasilnya: List of pending bookings

**Step 3: Confirm satu booking**
- Ketik di AI Console:
```
Ubah booking ID 1 statusnya jadi confirmed
```
- Lihat konfirmasi: "✓ Status berhasil diubah"

**Step 4: Check revenue hari ini**
- Ketik:
```
Berapa revenue hari ini?
```
- Lihat hasil: Total revenue dengan breakdown

---

## 📈 Fitur yang Bisa Ditambah di Masa Depan

- [ ] Voice input untuk AI console
- [ ] Export analytics ke PDF/Excel
- [ ] Create/edit room via AI
- [ ] Generate invoice otomatis
- [ ] SMS notification ke guest
- [ ] Multi-language support
- [ ] Advanced analytics (weekly/monthly trends)

---

## 📞 Support

Jika ada masalah atau ingin menambah fitur, cek:
1. Console browser (F12) untuk error messages
2. Terminal backend untuk logs
3. Ollama status: curl http://127.0.0.1:11434/api/tags
