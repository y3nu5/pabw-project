<script>
  import { invalidateAll } from '$app/navigation';
  import { API_BASE_URL } from '$lib/config/api';

  let { data } = $props();

  // Modal State
  let showModal = $state(false);
  /** @type {any} */
  let selectedUser = $state(null);
  let userRole = $state('');
  let isSubmitting = $state(false);
  let successMsg = $state('');
  let errorMsg = $state('');

  /**
   * @param {any} user
   */
  function openModal(user) {
    selectedUser = user;
    userRole = user.role;
    successMsg = '';
    errorMsg = '';
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    selectedUser = null;
  }

  async function handleUpdateRole() {
    if (!selectedUser || isSubmitting) return;
    isSubmitting = true;
    successMsg = '';
    errorMsg = '';

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role: userRole })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal mengubah role user.');
      }

      successMsg = 'Role user berhasil diperbarui!';
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

  async function handleDeleteUser() {
    if (!selectedUser || isSubmitting) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus akun ${selectedUser.first_name} (${selectedUser.email}) secara permanen? Reservasi milik user ini akan di-set NULL.`)) {
      return;
    }

    isSubmitting = true;
    successMsg = '';
    errorMsg = '';

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menghapus user.');
      }

      successMsg = 'User berhasil dihapus secara permanen!';
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
      <h1 class="font-display text-3xl text-[#faf5e8]">Manajemen Tamu</h1>
      <p class="text-[#a07332] font-serif italic">Daftar pengguna terdaftar di Grand Maison.</p>
    </div>
  </div>

  <div class="bg-[#2d1118] border border-[#9a6f08]/20 overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead>
          <tr class="text-[10px] uppercase tracking-widest text-[#a07332] border-b border-[#9a6f08]/10">
            <th class="px-6 py-4 font-body">Nama Lengkap</th>
            <th class="px-6 py-4 font-body">Email</th>
            <th class="px-6 py-4 font-body">Role</th>
            <th class="px-6 py-4 font-body">Terdaftar Pada</th>
            <th class="px-6 py-4 font-body text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="text-sm">
          {#each data.users as user (user.id)}
            <tr class="border-b border-[#9a6f08]/10 hover:bg-[#1a0a0f]/50 transition-colors">
              <td class="px-6 py-4 text-[#faf5e8] font-serif">
                {user.first_name} {user.last_name || ''}
              </td>
              <td class="px-6 py-4 text-[#faf5e8]/70">
                {user.email}
              </td>
              <td class="px-6 py-4">
                <span class="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-tighter border 
                  {user.role === 'admin' ? 'bg-[#d4a017]/10 text-[#d4a017] border-[#d4a017]/20' : 'bg-[#faf5e8]/10 text-[#faf5e8]/50 border-[#faf5e8]/10'}">
                  {user.role}
                </span>
              </td>
              <td class="px-6 py-4 text-[#faf5e8]/50 text-xs">
                {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </td>
              <td class="px-6 py-4 text-right">
                <button onclick={() => openModal(user)} class="text-[#a07332] hover:text-[#d4a017] text-[10px] uppercase tracking-widest font-serif cursor-pointer">Kelola</button>
              </td>
            </tr>
          {:else}
            <tr>
              <td colspan="5" class="px-6 py-12 text-center text-[#faf5e8]/30 italic font-serif">
                Belum ada data user.
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- ==========================================
     MODAL KELOLA USER (CHANGE ROLE / DELETE)
     ========================================== -->
{#if showModal && selectedUser}
  <div class="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
    <div class="bg-[#2d1118] border border-[#d4a017]/40 max-w-md w-full p-8 shadow-2xl relative flex flex-col">
      <button 
        onclick={closeModal} 
        class="absolute top-4 right-4 text-[#a07332] hover:text-[#faf5e8] text-xl cursor-pointer"
        aria-label="Tutup"
      >
        &times;
      </button>

      <div class="mb-6">
        <span class="text-[10px] font-serif tracking-[0.3em] uppercase text-[#a07332]">Manajemen Pengguna</span>
        <h2 class="text-xl font-serif text-[#d4a017] mt-1">{selectedUser.first_name} {selectedUser.last_name || ''}</h2>
        <p class="text-xs text-[#faf5e8]/50">{selectedUser.email}</p>
      </div>

      <div class="space-y-6">
        <!-- Role Form -->
        <div class="space-y-2">
          <label for="role-select" class="block text-xs uppercase tracking-wider text-[#a07332]">Ubah Akses Role</label>
          <div class="flex gap-2">
            <select 
              id="role-select"
              bind:value={userRole} 
              class="input-baroque bg-[#1a0a0f] text-[#faf5e8] py-2 text-sm flex-1"
            >
              <option value="guest">Guest (Tamu)</option>
              <option value="admin">Admin (Pengelola)</option>
            </select>
            <button 
              onclick={handleUpdateRole} 
              disabled={isSubmitting || userRole === selectedUser.role} 
              class="btn-primary px-4 py-2 text-xs cursor-pointer disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="pt-4 border-t border-[#9a6f08]/20 space-y-2">
          <span class="block text-xs uppercase tracking-wider text-red-400 font-semibold">Danger Zone</span>
          <p class="text-[11px] text-[#faf5e8]/40">Menghapus user akan menghapus akunnya secara permanen. Semua data reservasi akan tetap ada namun kepemilikannya akan di-set NULL.</p>
          <button 
            onclick={handleDeleteUser} 
            disabled={isSubmitting}
            class="w-full bg-red-950/40 hover:bg-red-900/40 border border-red-900/60 hover:border-red-500/80 text-red-400 py-2 text-xs uppercase tracking-widest font-serif transition-colors cursor-pointer disabled:opacity-50"
          >
            Hapus Akun Tamu
          </button>
        </div>

        {#if successMsg}
          <p class="text-sm text-green-400 text-center">{successMsg}</p>
        {/if}
        {#if errorMsg}
          <p class="text-sm text-red-400 text-center">{errorMsg}</p>
        {/if}
      </div>
    </div>
  </div>
{/if}

