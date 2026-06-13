<script>
  let { data } = $props();

  // Helper formats
  /**
   * @param {number} amount
   */
  function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  }

  /**
   * @param {string} status
   */
  function getStatusLabel(status) {
    switch (status) {
      case 'pending': return 'Menunggu Konfirmasi';
      case 'confirmed': return 'Terkonfirmasi';
      case 'checked_in': return 'Sudah Check In';
      case 'checked_out': return 'Selesai / Check Out';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  }

  /**
   * @param {string} status
   */
  function getStatusBadgeClass(status) {
    switch (status) {
      case 'confirmed': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'checked_in': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'checked_out': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  }

  // Filter bookings
  let activeBookings = $derived(
    data.bookings.filter(/** @param {any} b */ (b) => ['pending', 'confirmed', 'checked_in'].includes(b.status))
  );

  let pastBookings = $derived(
    data.bookings.filter(/** @param {any} b */ (b) => ['checked_out', 'cancelled'].includes(b.status))
  );
</script>

<svelte:head>
  <title>Riwayat Pemesanan — Grand Maison</title>
</svelte:head>

<div class="relative py-16 px-6 text-center border-b border-gold-700/20">
  <p class="text-gold-500 text-xs tracking-[0.4em] uppercase font-body mb-3">Grand Maison</p>
  <h1 class="font-display text-4xl md:text-5xl text-ivory-100">Riwayat Pemesanan</h1>
  <p class="text-ivory-600 font-serif italic mt-2">Daftar reservasi dan riwayat masa inap Anda di Grand Maison.</p>
</div>

<div class="max-w-5xl mx-auto px-6 py-12 space-y-12">

  <!-- ==================== PESANAN AKTIF ==================== -->
  <section class="space-y-6">
    <h2 class="font-display text-2xl text-gold-400 border-b border-gold-700/20 pb-3">Pesanan Aktif & Mendatang</h2>
    
    {#if activeBookings.length === 0}
      <div class="border border-gold-700/20 bg-velvet-800/40 p-10 text-center text-ivory-500 italic font-serif">
        Tidak ada pemesanan aktif saat ini.
      </div>
    {:else}
      <div class="space-y-6">
        {#each activeBookings as booking (booking.id)}
          <div class="bg-velvet-800 border border-gold-700/30 p-6 flex flex-col md:flex-row justify-between gap-6 relative">
            <div class="space-y-4 flex-1">
              <div class="flex flex-wrap items-center gap-3">
                <span class="font-serif text-[#d4a017] text-lg font-bold tracking-wide">{booking.booking_reference}</span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-tighter border {getStatusBadgeClass(booking.status)}">
                  {getStatusLabel(booking.status)}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-body">
                <div>
                  <span class="text-ivory-600 block text-xs uppercase tracking-wider">Tipe Kamar</span>
                  <span class="text-ivory-100 font-medium">{booking.room_name} ({booking.room_code})</span>
                </div>
                <div>
                  <span class="text-ivory-600 block text-xs uppercase tracking-wider">Durasi Menginap</span>
                  <span class="text-ivory-100">{new Date(booking.check_in).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} s/d {new Date(booking.check_out).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div>
                  <span class="text-ivory-600 block text-xs uppercase tracking-wider">Tamu</span>
                  <span class="text-ivory-100">{booking.guests} orang (a.n. {booking.first_name} {booking.last_name})</span>
                </div>
                <div>
                  <span class="text-ivory-600 block text-xs uppercase tracking-wider">Metode Pembayaran</span>
                  <span class="text-ivory-100 uppercase">{booking.payment_method}</span>
                </div>
              </div>
            </div>

            <div class="flex flex-col justify-between items-end text-right border-t md:border-t-0 md:border-l border-gold-700/20 pt-4 md:pt-0 md:pl-6 min-w-[200px]">
              <div>
                <span class="text-ivory-600 block text-xs uppercase tracking-wider">Total Pembayaran</span>
                <span class="font-serif text-2xl text-gold-400 font-bold">{formatCurrency(booking.grand_total)}</span>
              </div>
              <span class="text-[10px] text-ivory-700 mt-2 block">Dipesan pada {new Date(booking.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <!-- ==================== RIWAYAT SELESAI ==================== -->
  <section class="space-y-6">
    <h2 class="font-display text-2xl text-gold-600 border-b border-gold-700/20 pb-3">Riwayat Masa Inap & Pembatalan</h2>
    
    {#if pastBookings.length === 0}
      <div class="border border-gold-700/20 bg-velvet-800/20 p-8 text-center text-ivory-700 italic font-serif">
        Belum ada riwayat menginap sebelumnya.
      </div>
    {:else}
      <div class="space-y-4">
        {#each pastBookings as booking (booking.id)}
          <div class="bg-velvet-900/40 border border-gold-700/10 p-5 flex flex-col md:flex-row justify-between gap-6 opacity-75 hover:opacity-100 transition-opacity">
            <div class="space-y-2 flex-1">
              <div class="flex items-center gap-3">
                <span class="font-serif text-ivory-400 text-base font-semibold">{booking.booking_reference}</span>
                <span class="px-2 py-0.5 rounded-full text-[9px] uppercase tracking-tighter border {getStatusBadgeClass(booking.status)}">
                  {getStatusLabel(booking.status)}
                </span>
              </div>
              <p class="text-xs text-ivory-600">
                {booking.room_name} &bull; {booking.guests} Tamu &bull; {new Date(booking.check_in).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(booking.check_out).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div class="text-right flex flex-col justify-center">
              <span class="font-serif text-lg text-gold-500 font-bold">{formatCurrency(booking.grand_total)}</span>
              <span class="text-[9px] text-ivory-700">Selesai pada {new Date(booking.updated_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </section>

</div>
