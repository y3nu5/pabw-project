<script>
  import { invalidateAll } from '$app/navigation';
  import { API_BASE_URL } from '$lib/config/api';

  let { data } = $props();

  // Modal State
  let showModal = $state(false);
  let isEditMode = $state(false);
  let selectedRoomId = $state(null);
  let isSubmitting = $state(false);
  let successMsg = $state('');
  let errorMsg = $state('');

  // Form Fields
  let formCode = $state('');
  let formName = $state('');
  let formCategory = $state('');
  let formDescription = $state('');
  let formPricePerNight = $state(0);
  let formSizeSqm = $state(0);
  let formMaxGuests = $state(2);
  let formFeaturesText = $state('');
  let formIsAvailable = $state(true);

  /**
   * @param {number} amount
   */
  function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  }

  function openCreateModal() {
    isEditMode = false;
    selectedRoomId = null;
    successMsg = '';
    errorMsg = '';
    formCode = '';
    formName = '';
    formCategory = 'Deluxe';
    formDescription = '';
    formPricePerNight = 1000000;
    formSizeSqm = 35;
    formMaxGuests = 2;
    formFeaturesText = 'WiFi, AC, TV, Minibar';
    formIsAvailable = true;
    showModal = true;
  }

  /**
   * @param {any} room
   */
  function openEditModal(room) {
    isEditMode = true;
    selectedRoomId = room.id;
    successMsg = '';
    errorMsg = '';
    formCode = room.code;
    formName = room.name;
    formCategory = room.category;
    formDescription = room.description || '';
    formPricePerNight = room.price_per_night;
    formSizeSqm = Number(room.size_sqm);
    formMaxGuests = room.max_guests;
    formFeaturesText = Array.isArray(room.features) ? room.features.join(', ') : '';
    formIsAvailable = room.is_available;
    showModal = true;
  }

  function closeModal() {
    showModal = false;
  }

  /**
   * @param {any} room
   */
  async function toggleStatus(room) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/rooms/${room.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_available: !room.is_available })
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Gagal mengubah status kamar.');
      } else {
        await invalidateAll();
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      alert('Terjadi kesalahan koneksi.');
    }
  }

  /**
   * @param {SubmitEvent} e
   */
  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return;
    isSubmitting = true;
    successMsg = '';
    errorMsg = '';

    const features = formFeaturesText
      .split(',')
      .map(f => f.trim())
      .filter(f => f.length > 0);

    const payload = {
      code: formCode,
      name: formName,
      category: formCategory,
      description: formDescription,
      price_per_night: formPricePerNight,
      size_sqm: formSizeSqm,
      max_guests: formMaxGuests,
      features,
      is_available: formIsAvailable
    };

    try {
      const url = isEditMode 
        ? `${API_BASE_URL}/api/rooms/${selectedRoomId}` 
        : `${API_BASE_URL}/api/rooms`;

      const method = isEditMode ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan data kamar.');
      }

      successMsg = isEditMode ? 'Kamar berhasil diperbarui!' : 'Kamar baru berhasil ditambahkan!';
      await invalidateAll();
      setTimeout(() => {
        showModal = false;
      }, 1500);
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="space-y-6 animate-fade-in relative">
  <div class="flex justify-between items-center">
    <div>
      <h1 class="font-display text-3xl text-[#faf5e8]">Daftar Kamar</h1>
      <p class="text-[#a07332] font-serif italic">Kelola unit kamar dan ketersediaan di Grand Maison.</p>
    </div>
    <button onclick={openCreateModal} class="btn-primary py-2 px-6 text-xs cursor-pointer">
      Tambah Kamar
    </button>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
    {#each data.rooms as room}
      <div class="bg-[#2d1118] border border-[#9a6f08]/20 flex flex-col hover:border-[#d4a017]/30 transition-all group">
        <div class="p-6 flex-1">
          <div class="flex justify-between items-start mb-4">
            <div>
              <div class="text-[10px] text-[#a07332] uppercase tracking-[0.2em] font-body mb-1">{room.code}</div>
              <h3 class="font-serif text-xl text-[#faf5e8] group-hover:text-[#d4a017] transition-colors">{room.name}</h3>
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-tighter border 
              {room.is_available ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}">
              {room.is_available ? 'Tersedia' : 'Terisi / Tutup'}
            </span>
          </div>
          
          <div class="space-y-2 mb-6">
            <div class="flex justify-between text-xs">
              <span class="text-[#faf5e8]/40">Kategori</span>
              <span class="text-[#faf5e8]/80">{room.category}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-[#faf5e8]/40">Kapasitas</span>
              <span class="text-[#faf5e8]/80">{room.max_guests} Tamu</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-[#faf5e8]/40">Ukuran</span>
              <span class="text-[#faf5e8]/80">{room.size_sqm} m²</span>
            </div>
            {#if room.features && room.features.length > 0}
              <div class="pt-2 border-t border-[#9a6f08]/10 text-[11px] text-[#faf5e8]/60 flex flex-wrap gap-1">
                {#each room.features as feature}
                  <span class="bg-[#1a0a0f] px-2 py-0.5 border border-[#9a6f08]/10 rounded">{feature}</span>
                {/each}
              </div>
            {/if}
          </div>

          <div class="pt-4 border-t border-[#9a6f08]/10 flex justify-between items-center">
            <div class="font-serif text-[#d4a017]">{formatCurrency(room.price_per_night)} <span class="text-[10px] text-[#faf5e8]/40 uppercase">/ Malam</span></div>
          </div>
        </div>
        <div class="bg-[#1a0a0f]/50 p-4 border-t border-[#9a6f08]/10 flex gap-2">
          <button onclick={() => openEditModal(room)} class="flex-1 py-2 text-[10px] uppercase tracking-widest font-serif border border-[#9a6f08]/30 text-[#faf5e8]/60 hover:bg-[#d4a017] hover:text-[#1a0a0f] hover:border-[#d4a017] transition-all cursor-pointer">Edit</button>
          <button onclick={() => toggleStatus(room)} class="flex-1 py-2 text-[10px] uppercase tracking-widest font-serif border border-[#9a6f08]/30 text-[#faf5e8]/60 hover:bg-[#d4a017] hover:text-[#1a0a0f] hover:border-[#d4a017] transition-all cursor-pointer">
            {room.is_available ? 'Set Tutup' : 'Set Tersedia'}
          </button>
        </div>
      </div>
    {:else}
      <div class="col-span-full py-20 text-center text-[#faf5e8]/30 italic font-serif border border-dashed border-[#9a6f08]/20">
        Belum ada data kamar.
      </div>
    {/each}
  </div>
</div>

<!-- ==========================================
     MODAL TAMBAH / EDIT KAMAR
     ========================================== -->
{#if showModal}
  <div class="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
    <div class="bg-[#2d1118] border border-[#d4a017]/40 max-w-2xl w-full p-8 shadow-2xl relative flex flex-col max-h-[90vh]">
      <button 
        onclick={closeModal} 
        class="absolute top-4 right-4 text-[#a07332] hover:text-[#faf5e8] text-xl cursor-pointer"
        aria-label="Tutup"
      >
        &times;
      </button>

      <div class="mb-6">
        <span class="text-[10px] font-serif tracking-[0.3em] uppercase text-[#a07332]">{isEditMode ? 'Edit Kamar' : 'Formulir'}</span>
        <h2 class="text-2xl font-serif text-[#d4a017] mt-1">{isEditMode ? `Ubah Data Room #${formCode}` : 'Tambah Kamar Baru'}</h2>
      </div>

      <form onsubmit={handleSubmit} class="space-y-4 overflow-y-auto pr-2 flex-1">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Kode Kamar -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Kode Kamar (Unique) *</label>
            <input type="text" bind:value={formCode} required class="input-baroque w-full py-2 text-sm bg-[#1a0a0f]" placeholder="Misal: GM-101" />
          </div>
          <!-- Nama Kamar -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Nama Kamar *</label>
            <input type="text" bind:value={formName} required class="input-baroque w-full py-2 text-sm bg-[#1a0a0f]" placeholder="Misal: Classic Baroque Suite" />
          </div>
          <!-- Kategori -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Kategori *</label>
            <select bind:value={formCategory} required class="input-baroque w-full py-2 text-sm bg-[#1a0a0f] text-[#faf5e8]">
              <option value="Superior">Superior</option>
              <option value="Deluxe">Deluxe</option>
              <option value="Executive Suite">Executive Suite</option>
              <option value="Presidential Suite">Presidential Suite</option>
            </select>
          </div>
          <!-- Maks Tamu -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Maksimal Tamu *</label>
            <input type="number" bind:value={formMaxGuests} min="1" max="15" required class="input-baroque w-full py-2 text-sm bg-[#1a0a0f]" />
          </div>
          <!-- Ukuran -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Ukuran Kamar (m²) *</label>
            <input type="number" step="0.1" bind:value={formSizeSqm} min="1" required class="input-baroque w-full py-2 text-sm bg-[#1a0a0f]" />
          </div>
          <!-- Harga Per Malam -->
          <div>
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Harga Per Malam (IDR) *</label>
            <input type="number" bind:value={formPricePerNight} min="1000" required class="input-baroque w-full py-2 text-sm bg-[#1a0a0f]" />
          </div>
          <!-- Fasilitas (Features) -->
          <div class="md:col-span-2">
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Fasilitas (pisahkan dengan koma)</label>
            <input type="text" bind:value={formFeaturesText} class="input-baroque w-full py-2 text-sm bg-[#1a0a0f]" placeholder="WiFi, AC, TV, Bathtub, Minibar" />
          </div>
          <!-- Deskripsi -->
          <div class="md:col-span-2">
            <label class="block text-xs uppercase tracking-wider text-[#a07332] mb-1">Deskripsi *</label>
            <textarea bind:value={formDescription} required class="input-baroque w-full py-2 text-sm bg-[#1a0a0f] h-20 resize-none" placeholder="Tuliskan deskripsi lengkap kamar..."></textarea>
          </div>
          <!-- Ketersediaan -->
          <div class="md:col-span-2 flex items-center gap-2">
            <input type="checkbox" id="formIsAvailable" bind:checked={formIsAvailable} class="accent-[#d4a017] cursor-pointer" />
            <label for="formIsAvailable" class="text-xs uppercase tracking-wider text-[#faf5e8]/80 cursor-pointer">Kamar Tersedia untuk Dipesan</label>
          </div>
        </div>

        {#if successMsg}
          <p class="text-sm text-green-400 mt-2">{successMsg}</p>
        {/if}
        {#if errorMsg}
          <p class="text-sm text-red-400 mt-2">{errorMsg}</p>
        {/if}

        <div class="flex justify-end gap-3 pt-4 border-t border-[#9a6f08]/20">
          <button type="button" onclick={closeModal} class="px-6 py-2 border border-[#9a6f08]/40 text-[#a07332] hover:text-[#faf5e8] text-xs cursor-pointer">
            Batal
          </button>
          <button type="submit" disabled={isSubmitting} class="btn-primary px-6 py-2 text-xs cursor-pointer disabled:opacity-50">
            {isSubmitting ? 'Memproses...' : 'Simpan Kamar'}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

