import { defineStore } from 'pinia'
import type { User } from '~~/prisma/generated/client'

/**
 * Auth Store — satu-satunya tempat menyimpan state autentikasi user.
 *
 * ATURAN: Jangan gunakan useState('user') di mana pun di aplikasi ini.
 * Selalu gunakan useAuthStore() untuk membaca atau mengubah state user.
 *
 * Cara pakai:
 *   const authStore = useAuthStore()
 *   authStore.user         → data user yang sedang login (atau null)
 *   authStore.isAuthenticated → true jika user sudah login
 *   authStore.setUser(data)   → simpan data user setelah login
 *   authStore.logout()        → hapus semua data user
 */
export const useAuthStore = defineStore('auth', () => {
  /**
   * Data user yang sedang login.
   * Berisi { id, email, role, fullname } dari JWT payload.
   * Null jika user belum login atau sudah logout.
   */
  const user = ref<any | null>(null)
 
  /**
   * JWT token string (opsional, disimpan di HTTP-only Cookie oleh server).
   * Field ini jarang dipakai di frontend karena cookie sudah otomatis terkirim.
   * Saat ini tidak digunakan secara aktif — bisa diabaikan.
   */
  const token = ref<string | null>(null)

  /**
   * Computed property: true jika user sudah login (user.value tidak null).
   * Digunakan di middleware untuk mengecek apakah perlu fetch /api/auth/me.
   *
   * Contoh penggunaan:
   *   if (authStore.isAuthenticated) return // sudah login, skip fetch
   */
  const isAuthenticated = computed(() => !!user.value)

  /**
   * Simpan data user ke store setelah login berhasil atau setelah fetch /api/auth/me.
   * Dipanggil dari: login.vue (setelah POST /api/auth/login)
   *                 middleware/auth.ts (setelah GET /api/auth/me)
   *
   * @param data - Object user dari response API, atau null untuk menghapus
   */
  function setUser(data: any | null) {
    user.value = data
    console.debug('[AuthStore] setUser dipanggil:', data?.email ?? 'null')
  }

  /**
   * Simpan JWT token string ke store.
   * Catatan: Token sebenarnya sudah aman di HTTP-only Cookie.
   * Fungsi ini jarang dipakai — hanya jika ada kebutuhan khusus.
   *
   * @param jwt - String JWT token dari server
   */
  function setToken(jwt: string) {
    token.value = jwt
    console.debug('[AuthStore] setToken dipanggil')
  }

  /**
   * Hapus semua data user dan token dari store (logout).
   * Dipanggil dari: middleware/auth.ts (jika fetch /api/auth/me gagal)
   *                 tombol logout di UI
   *
   * Catatan: Fungsi ini HANYA mengosongkan state di frontend.
   * Untuk menghapus cookie di server, panggil POST /api/auth/logout secara terpisah.
   */
  function logout() {
    user.value = null
    token.value = null
    console.debug('[AuthStore] logout dipanggil — state user dikosongkan')
  }

  // Kembalikan semua state dan fungsi agar bisa diakses dari luar store
  return {
    user,           // ref: data user (baca saja dari luar, jangan diubah langsung)
    token,          // ref: JWT token string (jarang dipakai)
    isAuthenticated, // computed: boolean, true jika user sudah login
    setUser,        // function: simpan data user
    setToken,       // function: simpan token
    logout          // function: hapus semua data (client-side logout)
  }
})