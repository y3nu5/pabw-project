<script>
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { API_BASE_URL } from '$lib/config/api';

  let { data } = $props();

  let searchQuery = $state(page.url.searchParams.get('search') || '');
  let statusFilter = $state(page.url.searchParams.get('status') || '');

  /** @type {any} */
  let searchTimeout;
  function handleSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      updateFilters();
    }, 450);
  }

  function updateFilters() {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter) params.set('status', statusFilter);
    goto(`?${params.toString()}`, { keepFocus: true, replaceState: true });
  }

  // Detail Modal State
  /** @type {any} */
  let selectedBooking = $state(null);
  let detailStatus = $state('');
  let isUpdatingStatus = $state(false);
  let statusSuccessMsg = $state('');
  let statusErrorMsg = $state('');

  /**
   * @param {any} booking
   */
  function openDetail(booking) {
    selectedBooking = booking;
    detailStatus = booking.status;
    statusSuccessMsg = '';
    statusErrorMsg = '';
  }

  function closeDetail() {
    selectedBooking = null;
  }

  async function handleUpdateStatus() {
    if (!selectedBooking || isUpdatingStatus) return;
    isUpdatingStatus = true;
    statusSuccessMsg = '';
    statusErrorMsg = '';

    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${selectedBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: detailStatus })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal mengupdate status.');
      }

      statusSuccessMsg = 'Status berhasil diperbarui!';
      await invalidateAll();
      selectedBooking.status = detailStatus;
    } catch (err) {
      statusErrorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
    } finally {
      isUpdatingStatus = false;
    }
  }

  // Create Modal State
  let showCreateModal = $state(false);
  /** @type {any[]} */
  let roomsList = $state([]);
  let isCreatingBooking = $state(false);
  let createSuccessMsg = $state('');
  let createErrorMsg = $state('');

  // Form fields
  let formFirstName = $state('');
  let formLastName = $state('');
  let formEmail = $state('');
  let formPhone = $state('');
  let formNationality = $state('ID');
  let formRoomId = $state('');
  let formCheckIn = $state('');
  let formCheckOut = $state('');
  let formGuests = $state(1);
  let formPaymentMethod = $state('transfer');
  let formSpecialRequest = $state('');

  async function loadRooms() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms?available=true`);
      if (res.ok) {
        const json = await res.json();
        roomsList = json.data || [];
      }
    } catch (err) {
      console.error('Failed to load rooms list:', err);
    }
  }

  function openCreateModal() {
    showCreateModal = true;
    createSuccessMsg = '';
    createErrorMsg = '';
    formFirstName = '';
    formLastName = '';
    formEmail = '';
    formPhone = '';
    formNationality = 'ID';
    formRoomId = '';
    formCheckIn = '';
    formCheckOut = '';
    formGuests = 1;
    formPaymentMethod = 'transfer';
    formSpecialRequest = '';
    loadRooms();
  }

  function closeCreateModal() {
    showCreateModal = false;
  }

  /**
   * @param {SubmitEvent} e
   */
  async function handleCreateBooking(e) {
    e.preventDefault();
    if (isCreatingBooking) return;
    isCreatingBooking = true;
    createSuccessMsg = '';
    createErrorMsg = '';

    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          roomId: formRoomId,
          checkIn: formCheckIn,
          checkOut: formCheckOut,
          guests: formGuests,
          firstName: formFirstName,
          lastName: formLastName,
          email: formEmail,
          phone: formPhone,
          nationality: formNationality,
          paymentMethod: formPaymentMethod,
          specialRequest: formSpecialRequest
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal membuat reservasi.');
      }

      createSuccessMsg = 'Reservasi baru berhasil dibuat!';
      await invalidateAll();
      setTimeout(() => {
        showCreateModal = false;
      }, 1500);
    } catch (err) {
      createErrorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
    } finally {
      isCreatingBooking = false;
    }
  }

  /**
   * @param {string} status
   */
  function getStatusColor(status) {
    switch (status) {
      case 'confirmed': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'checked_in': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'checked_out': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  }

  /**
   * @param {number} amount
   */
  function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  }
</script>

<div class="space-y-6 animate-fade-in relative">
  <div class="flex justify-between items-center">
    <div>
      <h1 class="font-display text-3xl text-[#faf5e8]">Manajemen Reservasi</h1>
      <p class="text-[#a07332] font-serif italic">Kelola semua pemesanan kamar di Grand Maison.</p>
    </div>
    <button onclick={openCreateModal} class="btn-primary py-2 px-6 text-xs cursor-pointer">
      Reservasi Baru
    </button>
  </div>

  <div class="bg-[#2d1118] border border-[#9a6f08]/20 overflow-hidden">
    <!-- Filter Bar -->
    <div class="p-4 border-b border-[#9a6f08]/20 flex gap-4 flex-wrap">
      <input 
        type="text" 
        bind:value={searchQuery}
        oninput={handleSearchInput}
        placeholder="Cari referensi atau nama tamu..." 
        class="input-baroque py-2 text-sm max-w-sm flex-1 min-w-[200px]"
      />
      <select 
        bind:value={statusFilter}
        onchange={updateFilters}
        class="input-baroque py-2 text-sm w-[180px] bg-[#1a0a0f] text-[#faf5e8]"
      >
        <option value="">Semua Status</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="checked_in">Checked In</option>
        <option value="checked_out">Checked Out</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead>
          <tr class="text-[10px] uppercase tracking-widest text-[#a07332] border-b border-[#9a6f08]/10">
            <th class="px-6 py-4 font-body">Ref / Tanggal</th>
            <th class="px-6 py-4 font-body">Tamu</th>
            <th class="px-6 py-4 font-body">Kamar</th>
            <th class="px-6 py-4 font-body">Durasi</th>
            <th class="px-6 py-4 font-body">Status</th>
            <th class="px-6 py-4 font-body">Total</th>
            <th class="px-6 py-4 font-body text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          {#each data.bookings as booking (booking.id)}
            <tr class="border-b border-[#9a6f08]/10 hover:bg-[#1a0a0f]/50 transition-colors">
              <td class="px-6 py-4">
                <div class="font-serif text-[#d4a017]">{booking.booking_reference}</div>
                <div class="text-[10px] text-[#faf5e8]/40 mt-0.5">{new Date(booking.created_at).toLocaleDateString('id-ID')}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-[#faf5e8] font-medium">{booking.first_name} {booking.last_name}</div>
                <div class="text-[11px] text-[#faf5e8]/50 mt-0.5">{booking.email}</div>
              </td>
              <td class="px-6 py-4">
                <div class="text-[#faf5e8]/80">{booking.room_name}</div>
                <div class="text-[10px] text-[#a07332] uppercase tracking-tighter">{booking.room_code}</div>
              </td>
              <td class="px-6 py-4 text-[#faf5e8]/60">
                <div class="text-xs">{booking.check_in} s/d</div>
                <div class="text-xs">{booking.check_out}</div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-tighter border {getStatusColor(booking.status)}">
                  {booking.status.replace('_', ' ')}
                </span>
              </td>
              <td class="px-6 py-4 font-serif text-[#faf5e8]">{formatCurrency(booking.grand_total)}</td>
              <td class="px-6 py-4 text-right">
                <button 
                  onclick={() => openDetail(booking)} 
                  class="text-[#d4a017] hover:text-[#e8c04a] text-xs font-serif uppercase tracking-widest cursor-pointer"
                >
                  Detail
                </button>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="7" class="px-6 py-12 text-center text-[#faf5e8]/30 italic font-serif">
                Belum ada data reservasi.
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- ==========================================
     MODAL DETAIL RESERVASI
     ========================================== -->
{#if selectedBooking}
  <div class="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
    <div class="bg-[#2d1118] border border-[#d4a017]/40 max-w-2xl w-full p-8 shadow-2xl relative flex flex-col max-h-[90vh]">
      <!-- Close button -->
      <button 
        onclick={closeDetail} 
        class="absolute top-4 right-4 text-[#a07332] hover:text-[#faf5e8] text-xl cursor-pointer"
        aria-label="Tutup"
      >
        &times;
      </button>

      <!-- Header -->
      <div class="mb-6">
        <span class="text-[10px] font-serif tracking-[0.3em] uppercase text-[#a07332]">Detail Reservasi</span>
        <h2 class="text-2xl font-serif text-[#d4a017] mt-1">{selectedBooking.booking_reference}</h2>
      </div>

      <!-- Info content -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2 flex-1">
        <!-- Guest Section -->
        <div>
          <h3 class="text-xs uppercase tracking-widest text-[#a07332] font-semibold border-b border-[#9a6f08]/20 pb-2 mb-3">Data Tamu</h3>
          <table class="text-sm w-full space-y-2">
            <tbody>
              <tr>
                <td class="text-[#faf5e8]/40 w-28 py-1">Nama</td>
                <td class="text-[#faf5e8]/90 py-1">{selectedBooking.first_name} {selectedBooking.last_name}</td>
              </tr>
              <tr>
                <td class="text-[#faf5e8]/40 py-1">Email</td>
                <td class="text-[#faf5e8]/90 py-1 break-all">{selectedBooking.email}</td>
              </tr>
              <tr>
                <td class="text-[#faf5e8]/40 py-1">Telepon</td>
                <td class="text-[#faf5e8]/90 py-1">{selectedBooking.phone || '-'}</td>
              </tr>
              <tr>
                <td class="text-[#faf5e8]/40 py-1">Negara</td>
                <td class="text-[#faf5e8]/90 py-1">{selectedBooking.nationality || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Room & Stay Section -->
        <div>
          <h3 class="text-xs uppercase tracking-widest text-[#a07332] font-semibold border-b border-[#9a6f08]/20 pb-2 mb-3">Detail Kamar & Menginap</h3>
          <table class="text-sm w-full space-y-2">
            <tbody>
              <tr>
                <td class="text-[#faf5e8]/40 w-28 py-1">Tipe Kamar</td>
                <td class="text-[#faf5e8]/90 py-1">{selectedBooking.room_name}</td>
              </tr>
              <tr>
                <td class="text-[#faf5e8]/40 py-1">Kode Kamar</td>
                <td class="text-[#faf5e8]/90 py-1">{selectedBooking.room_code}</td>
              </tr>
              <tr>
                <td class="text-[#faf5e8]/40 py-1">Check In</td>
                <td class="text-[#faf5e8]/90 py-1">{selectedBooking.check_in}</td>
              </tr>
              <tr>
                <td class="text-[#faf5e8]/40 py-1">Check Out</td>
                <td class="text-[#faf5e8]/90 py-1">{selectedBooking.check_out}</td>
              </tr>
              <tr>
                <td class="text-[#faf5e8]/40 py-1">Jumlah Tamu</td>
                <td class="text-[#faf5e8]/90 py-1">{selectedBooking.guests} orang</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Financials Section -->
        <div class="md:col-span-2">
          <h3 class="text-xs uppercase tracking-widest text-[#a07332] font-semibold border-b border-[#9a6f08]/20 pb-2 mb-3">Rincian Pembayaran</h3>
          <table class="text-sm w-full">
            <tbody>
              <tr>
                <td class="text-[#faf5e8]/40 py-1">Metode Bayar</td>
                <td class="text-[#faf5e8]/90 py-1 uppercase">{selectedBooking.payment_method}</td>
              </tr>
              <tr>
                <td class="text-[#faf5e8]/40 py-1">Subtotal</td>
                <td class="text-[#faf5e8]/90 py-1">{formatCurrency(selectedBooking.subtotal)}</td>
              </tr>
              <tr>
                <td class="text-[#faf5e8]/40 py-1">Pajak (10%)</td>
                <td class="text-[#faf5e8]/90 py-1">{formatCurrency(selectedBooking.tax_amount)}</td>
              </tr>
              <tr class="border-t border-[#9a6f08]/20 font-serif text-base text-[#d4a017]">
                <td class="py-2 font-bold">Total Pembayaran</td>
                <td class="py-2 font-bold">{formatCurrency(selectedBooking.grand_total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Special Request -->
        <div class="md:col-span-2">
          <h3 class="text-xs uppercase tracking-widest text-[#a07332] font-semibold border-b border-[#9a6f08]/20 pb-2 mb-3">Permintaan Khusus</h3>
          <p class="text-sm text-[#faf5e8]/80 italic bg-[#1a0a0f] p-3 border border-[#9a6f08]/10">
            {selectedBooking.special_request || 'Tidak ada permintaan khusus.'}
          </p>
        </div>
      </div>

      <!-- Action Panel: Update Status -->
      <div class="mt-6 pt-4 border-t border-[#9a6f08]/20 flex flex-col gap-3">
        <label for="status-select" class="text-xs uppercase tracking-wider text-[#a07332]">Kelola Status Reservasi</label>
        <div class="flex gap-4">
          <select 
            id="status-select"
            bind:value={detailStatus}
            class="input-baroque bg-[#1a0a0f] text-[#faf5e8] py-2 text-sm flex-1"
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button 
            onclick={handleUpdateStatus} 
            disabled={isUpdatingStatus}
            class="btn-primary px-6 py-2 text-xs cursor-pointer disabled:opacity-50"
          >
            {isUpdatingStatus ? 'Menyimpan...' : 'Simpan Status'}
          </button>
        </div>

        {#if statusSuccessMsg}
          <p class="text-xs text-green-400 mt-1">{statusSuccessMsg}</p>
        {/if}
        {#if statusErrorMsg}
          <p class="text-xs text-red-400 mt-1">{statusErrorMsg}</p>
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- ==========================================
     MODAL RESERVASI BARU
     ========================================== -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
    <div class="bg-[#2d1118] border border-[#d4a017]/40 max-w-2xl w-full p-8 shadow-2xl relative flex flex-col max-h-[90vh]">
      <button 
        onclick={closeCreateModal} 
        class="absolute top-4 right-4 text-[#a07332] hover:text-[#faf5e8] text-xl cursor-pointer"
        aria-label="Tutup"
      >
        &times;
      </button>

      <div class="mb-6">
        <span class="text-[10px] font-serif tracking-[0.3em] uppercase text-[#a07332]">Formulir</span>
        <h2 class="text-2xl font-serif text-[#d4a017] mt-1">Buat Reservasi Baru</h2>
      </div>

      <form onsubmit={handleCreateBooking} class="space-y-4 overflow-y-auto pr-2 flex-1">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Nama Depan -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Nama Depan *</label>
            <input type="text" bind:value={formFirstName} required class="input-baroque w-full py-2 text-sm bg-[#1a0a0f]" />
          </div>
          <!-- Nama Belakang -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Nama Belakang *</label>
            <input type="text" bind:value={formLastName} required class="input-baroque w-full py-2 text-sm bg-[#1a0a0f]" />
          </div>
          <!-- Email -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Email *</label>
            <input type="email" bind:value={formEmail} required class="input-baroque w-full py-2 text-sm bg-[#1a0a0f]" />
          </div>
          <!-- Telepon -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Telepon</label>
            <input type="text" bind:value={formPhone} class="input-baroque w-full py-2 text-sm bg-[#1a0a0f]" />
          </div>
          <!-- Kebangsaan -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Kebangsaan</label>
            <input type="text" bind:value={formNationality} class="input-baroque w-full py-2 text-sm bg-[#1a0a0f]" placeholder="ID" />
          </div>
          <!-- Kamar -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Kamar Tersedia *</label>
            <select bind:value={formRoomId} required class="input-baroque w-full py-2 text-sm bg-[#1a0a0f] text-[#faf5e8]">
              <option value="">Pilih Kamar...</option>
              {#each roomsList as room}
                <option value={room.id}>{room.name} ({room.code}) - {formatCurrency(room.price_per_night)}/malam</option>
              {/each}
            </select>
          </div>
          <!-- Check In -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Check In *</label>
            <input type="date" bind:value={formCheckIn} required class="input-baroque w-full py-2 text-sm bg-[#1a0a0f]" />
          </div>
          <!-- Check Out -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Check Out *</label>
            <input type="date" bind:value={formCheckOut} required class="input-baroque w-full py-2 text-sm bg-[#1a0a0f]" />
          </div>
          <!-- Jumlah Tamu -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Jumlah Tamu *</label>
            <input type="number" bind:value={formGuests} min="1" max="10" required class="input-baroque w-full py-2 text-sm bg-[#1a0a0f]" />
          </div>
          <!-- Metode Pembayaran -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Metode Pembayaran *</label>
            <select bind:value={formPaymentMethod} required class="input-baroque w-full py-2 text-sm bg-[#1a0a0f] text-[#faf5e8]">
              <option value="transfer">Bank Transfer</option>
              <option value="card">Credit Card</option>
              <option value="cash">Cash</option>
            </select>
          </div>
          <!-- Permintaan Khusus -->
          <div class="md:col-span-2">
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Permintaan Khusus</label>
            <textarea bind:value={formSpecialRequest} class="input-baroque w-full py-2 text-sm bg-[#1a0a0f] h-20 resize-none"></textarea>
          </div>
        </div>

        {#if createSuccessMsg}
          <p class="text-sm text-green-400 mt-2">{createSuccessMsg}</p>
        {/if}
        {#if createErrorMsg}
          <p class="text-sm text-red-400 mt-2">{createErrorMsg}</p>
        {/if}

        <div class="flex justify-end gap-3 pt-4 border-t border-[#9a6f08]/20">
          <button type="button" onclick={closeCreateModal} class="px-6 py-2 border border-[#9a6f08]/40 text-[#a07332] hover:text-[#faf5e8] text-xs cursor-pointer">
            Batal
          </button>
          <button type="submit" disabled={isCreatingBooking} class="btn-primary px-6 py-2 text-xs cursor-pointer disabled:opacity-50">
            {isCreatingBooking ? 'Memproses...' : 'Buat Reservasi'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
