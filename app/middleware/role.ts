/**
 * Middleware: role.ts
 *
 * Middleware ini berjalan setelah auth.ts.
 * Tugasnya: mengecek apakah role user sesuai dengan role yang dibutuhkan halaman.
 *
 * CARA PAKAI di halaman/page:
 * Tambahkan definePageMeta di file .vue:
 *   definePageMeta({
 *     middleware: ['auth', 'role'],  // auth.ts harus jalan dulu!
 *     role: 'SUPER_ADMIN'           // isi dengan role yang diizinkan
 *   })
 *
 * Role yang tersedia (dari Prisma enum):
 *   'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT'
 *
 * ALUR LOGIKA:
 * 1. Ambil data user dari Pinia store (sudah diisi oleh middleware auth.ts sebelumnya)
 * 2. Cek apakah halaman tujuan membutuhkan role tertentu (to.meta.role)
 * 3. Jika tidak ada role requirement → izinkan akses (halaman tidak diproteksi role)
 * 4. Jika ada role requirement → bandingkan dengan role user
 *    a. Cocok → izinkan akses
 *    b. Tidak cocok → redirect ke /login (atau bisa ke halaman 403)
 */
export default defineNuxtRouteMiddleware((to) => {
  // Ambil instance Pinia Auth Store
  // Data user sudah diisi oleh middleware auth.ts yang berjalan sebelum ini
  const authStore = useAuthStore()

  /**
   * Ambil role yang dibutuhkan dari meta halaman tujuan.
   * Diset via definePageMeta({ role: 'SUPER_ADMIN' }) di file .vue halaman tersebut.
   * Jika halaman tidak punya meta.role, berarti halaman tersebut tidak diproteksi role.
   */
  const requiredRole = to.meta.role as string | undefined

  // Jika halaman tidak membutuhkan role tertentu, izinkan akses langsung
  if (!requiredRole) {
    return
  }

  /**
   * Bandingkan role user yang sedang login dengan role yang dibutuhkan halaman.
   *
   * authStore.user?.role → role user dari Pinia store (diisi saat login atau fetch /me)
   * requiredRole → role yang diset di definePageMeta halaman tujuan
   *
   * Jika tidak cocok, redirect ke /login.
   * Catatan: bisa diganti ke /403 jika ingin halaman "Akses Ditolak" yang lebih informatif.
   */
  if (authStore.user?.role !== requiredRole) {
    console.debug(
      `[RoleMiddleware] Akses ditolak: user role="${authStore.user?.role}" tapi halaman butuh role="${requiredRole}"`
    )
    return navigateTo('/login')
  }

  // Role cocok, izinkan akses ke halaman
  console.debug(
    `[RoleMiddleware] Akses diizinkan: user role="${authStore.user?.role}" ke "${to.path}"`
  )
})

