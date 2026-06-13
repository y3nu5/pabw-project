<script>
  import AdminAIConsole from '$lib/components/AdminAIConsole.svelte';
  let { data } = $props();

  /**
   * @param {number} amount
   */
  function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  }

  // Fallback if data fails to load
  const dbStats = $derived(data.statsData?.stats || {
    totalBookings: 0,
    monthlyRevenue: 0,
    occupiedRooms: 0,
    totalRooms: 0,
    availableRooms: 0,
    activeGuests: 0
  });

  const occupancyPercentage = $derived(
    dbStats.totalRooms > 0 ? Math.round((dbStats.occupiedRooms / dbStats.totalRooms) * 100) : 0
  );

  const stats = $derived([
    { 
      name: 'Total Reservasi', 
      value: String(dbStats.totalBookings), 
      change: 'Total', 
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' 
    },
    { 
      name: 'Pendapatan (Bulan Ini)', 
      value: formatCurrency(dbStats.monthlyRevenue), 
      change: 'Bulan ini', 
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' 
    },
    { 
      name: 'Kamar Terisi', 
      value: `${dbStats.occupiedRooms}/${dbStats.totalRooms}`, 
      change: `${occupancyPercentage}% Okupansi`, 
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' 
    },
    { 
      name: 'Tamu Aktif', 
      value: String(dbStats.activeGuests), 
      change: 'Akumulasi', 
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' 
    },
  ]);

  const recentBookings = $derived(data.statsData?.recentBookings || []);
  const roomStatsBreakdown = $derived(data.statsData?.roomStats || { available: 0, occupied: 0, maintenance: 0 });
  const totalRoomsForBar = $derived((roomStatsBreakdown.available + roomStatsBreakdown.occupied + roomStatsBreakdown.maintenance) || 1);
  const availablePercentage = $derived(Math.round((roomStatsBreakdown.available / totalRoomsForBar) * 100));
  const occupiedPercentage = $derived(Math.round((roomStatsBreakdown.occupied / totalRoomsForBar) * 100));
  const maintenancePercentage = $derived(Math.round((roomStatsBreakdown.maintenance / totalRoomsForBar) * 100));
</script>

<div class="space-y-8 animate-fade-in">
  <!-- Welcome -->
  <div>
    <h1 class="font-display text-4xl text-[#faf5e8]">Selamat Datang, {data.user.first_name}</h1>
    <p class="text-[#a07332] font-serif italic">Berikut adalah ringkasan operasional Grand Maison hari ini.</p>
  </div>

  <!-- Stats Grid -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {#each stats as stat}
      <div class="bg-[#2d1118] border border-[#9a6f08]/20 p-6 shadow-sm hover:border-[#d4a017]/30 transition-colors">
        <div class="flex items-center justify-between mb-4">
          <div class="p-2 bg-[#d4a017]/10 text-[#d4a017]">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d={stat.icon} />
            </svg>
          </div>
          <span class="text-[10px] font-serif tracking-widest text-[#a07332] uppercase">{stat.change}</span>
        </div>
        <h3 class="text-xs tracking-widest text-[#faf5e8]/50 uppercase font-body mb-1">{stat.name}</h3>
        <p class="text-2xl font-display text-[#d4a017]">{stat.value}</p>
      </div>
    {/each}
  </div>

  <!-- Recent Activity & Quick Actions -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- Recent Bookings Table -->
    <div class="lg:col-span-2 bg-[#2d1118] border border-[#9a6f08]/20 overflow-hidden">
      <div class="p-6 border-b border-[#9a6f08]/20 flex items-center justify-between">
        <h3 class="font-serif text-lg text-[#faf5e8]">Reservasi Terbaru</h3>
        <a href="/admin/bookings" class="text-xs text-[#d4a017] hover:underline uppercase tracking-widest font-body">Lihat Semua</a>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="text-[10px] uppercase tracking-widest text-[#a07332] border-b border-[#9a6f08]/10">
              <th class="px-6 py-4 font-body">Referensi</th>
              <th class="px-6 py-4 font-body">Tamu</th>
              <th class="px-6 py-4 font-body">Kamar</th>
              <th class="px-6 py-4 font-body">Check-in</th>
              <th class="px-6 py-4 font-body">Status</th>
              <th class="px-6 py-4 font-body">Total</th>
            </tr>
          </thead>
          <tbody class="text-sm">
            {#each recentBookings as booking}
              <tr class="border-b border-[#9a6f08]/10 hover:bg-[#1a0a0f]/50 transition-colors">
                <td class="px-6 py-4 font-serif text-[#d4a017]">{booking.booking_reference}</td>
                <td class="px-6 py-4 text-[#faf5e8]/80">{booking.first_name} {booking.last_name}</td>
                <td class="px-6 py-4 text-[#faf5e8]/80">{booking.room_name}</td>
                <td class="px-6 py-4 text-[#faf5e8]/60">{booking.check_in}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-tighter
                    {booking.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                     booking.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                     booking.status === 'checked_in' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                     booking.status === 'checked_out' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20' :
                     'bg-red-500/10 text-red-400 border border-red-500/20'}">
                    {booking.status.replace('_', ' ')}
                  </span>
                </td>
                <td class="px-6 py-4 font-serif text-[#faf5e8]">{formatCurrency(booking.grand_total)}</td>
              </tr>
            {:else}
              <tr>
                <td colspan="6" class="px-6 py-12 text-center text-[#faf5e8]/30 italic font-serif">
                  Belum ada data reservasi terbaru.
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- AI Console & Room Status -->
    <div class="space-y-6">
      <AdminAIConsole />

      <div class="bg-[#2d1118] border border-[#9a6f08]/20 p-6">
        <h3 class="font-serif text-lg text-[#faf5e8] mb-4">Status Kamar</h3>
        <div class="space-y-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-[#faf5e8]/60">Tersedia</span>
            <span class="text-[#d4a017] font-serif">{roomStatsBreakdown.available}</span>
          </div>
          <div class="w-full h-1 bg-[#1a0a0f] rounded-full overflow-hidden">
            <div class="h-full bg-green-500" style="width: {availablePercentage}%"></div>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-[#faf5e8]/60">Terisi</span>
            <span class="text-[#d4a017] font-serif">{roomStatsBreakdown.occupied}</span>
          </div>
          <div class="w-full h-1 bg-[#1a0a0f] rounded-full overflow-hidden">
            <div class="h-full bg-red-500" style="width: {occupiedPercentage}%"></div>
          </div>
          <div class="flex items-center justify-between text-sm pt-2">
            <span class="text-[#faf5e8]/60">Maintenance</span>
            <span class="text-[#d4a017] font-serif">{roomStatsBreakdown.maintenance}</span>
          </div>
          <div class="w-full h-1 bg-[#1a0a0f] rounded-full overflow-hidden">
            <div class="h-full bg-yellow-600" style="width: {maintenancePercentage}%"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
