/**
 * Middleware: auth.ts
 *
 * Middleware ini berjalan SETIAP KALI user berpindah halaman (route navigation).
 * Tugasnya: memastikan user sudah login sebelum bisa mengakses halaman apapun.
 *
 * ALUR LOGIKA:
 * 1. Cek apakah data user sudah ada di Pinia store (authStore.isAuthenticated)
 * 2. Jika sudah ada → langsung lanjut, tidak perlu request ke server (hemat!)
 * 3. Jika belum ada → fetch ke /api/auth/me untuk cek apakah cookie token masih valid
 *    a. Jika valid → simpan data user ke Pinia store → lanjut ke halaman
 *    b. Jika tidak valid / gagal → kosongkan store → redirect ke /login
 *
 * Kenapa pakai useRequestFetch() bukan $fetch()?
 * useRequestFetch() meneruskan cookie dari request awal (SSR context).
 * Ini penting agar cookie 'token' ikut terkirim saat server-side rendering.
 */
export default defineNuxtRouteMiddleware(async () => {
  // Ambil instance Pinia Auth Store
  const authStore = useAuthStore()

  // OPTIMASI: Jika user sudah ada di store, jangan request ke server lagi.
  // Ini mencegah API flood — tanpa ini, setiap klik navigasi = 1 request ke server.
  if (authStore.isAuthenticated) {
    // User sudah login dan data sudah ada di memory, langsung lanjut
    return
  }

  try {
    /**
     * Fetch data user dari server menggunakan cookie yang sudah ada.
     * Server akan:
     * 1. Baca cookie 'token'
     * 2. Verifikasi JWT
     * 3. Return { id, email, role, fullname } dari JWT payload (TANPA query DB)
     *
     * useRequestFetch() dipakai agar cookie diteruskan dengan benar di SSR.
     * credentials: 'include' dipakai agar cookie dikirim di client-side fetch.
     */
    const user = await useRequestFetch()('/api/auth/me', {
      credentials: 'include'
    })

    // Simpan data user yang valid ke Pinia store
    // Setelah ini, navigasi berikutnya tidak akan fetch lagi (isAuthenticated = true)
    authStore.setUser(user as any)
  }
  catch {
    /**
     * Fetch gagal = token tidak ada, expired, atau tidak valid.
     * Bersihkan state yang mungkin masih tersisa dan paksa redirect ke login.
     */
    authStore.logout()

    // Redirect ke halaman login karena user belum/tidak terautentikasi
    return navigateTo('/login')
  }
})

