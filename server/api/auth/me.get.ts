import jwt from 'jsonwebtoken'

/**
 * GET /api/auth/me
 *
 * Endpoint ini digunakan oleh middleware/auth.ts untuk memverifikasi
 * apakah user masih terautentikasi (token masih valid).
 *
 * CARA KERJA:
 * 1. Baca JWT token dari HTTP-only Cookie bernama 'token'
 * 2. Verifikasi token menggunakan JWT_SECRET
 * 3. Kembalikan data user dari JWT payload (TANPA query database!)
 *
 * KENAPA TIDAK QUERY DATABASE?
 * JWT dirancang untuk autentikasi stateless. Token sudah berisi data yang kita butuhkan.
 * Query DB di setiap request navigasi akan membebani database secara tidak perlu.
 * Jika butuh data profil lengkap, gunakan endpoint terpisah (misal: GET /api/users/:id).
 *
 * KAPAN SEBAIKNYA QUERY DB DI SINI?
 * Hanya jika kebutuhan keamanan mengharuskan validasi token real-time,
 * misalnya jika user bisa di-ban/deaktivasi dan harus langsung terasa efeknya.
 * Untuk MVP ini, JWT validation sudah cukup.
 *
 * @returns { id, role, fullname, email } dari JWT payload
 * @throws 401 jika token tidak ada atau tidak valid/expired
 */
export default defineEventHandler((event) => {
  // Baca JWT token dari HTTP-only Cookie
  // Cookie ini disetel oleh server saat login (POST /api/auth/login)
  const token = getCookie(event, 'token')

  // Ambil konfigurasi runtime (JWT_SECRET dari .env)
  const config = useRuntimeConfig()

  // Jika tidak ada token, user belum login atau cookie sudah dihapus
  if (!token) {
    throw createError({
      statusCode: 401,
      message: 'Tidak terautentikasi. Silakan login terlebih dahulu.'
    })
  }

  try {
    /**
     * Verifikasi dan decode JWT token.
     * jwt.verify() akan:
     * - Memastikan token tidak dipalsukan (signature check)
     * - Memastikan token belum expired (expiresIn check)
     * - Mengembalikan payload jika valid
     * - Melempar error jika tidak valid atau expired
     */
    const payload = jwt.verify(token, config.jwtSecret) as {
      id: string       // UUID user dari database
      role: string     // Role: SUPER_ADMIN | ADMIN | TEACHER | STUDENT
      fullname: string // Nama lengkap user
      email: string    // Email user
    }

    /**
     * Kembalikan data user dari JWT payload.
     * Data ini yang akan disimpan ke Pinia store di middleware/auth.ts.
     * Tidak ada query ke database — murni dari JWT!
     */
    return {
      id: payload.id,
      role: payload.role,
      fullname: payload.fullname,
      email: payload.email
    }
  }
  catch (err: any) {
    /**
     * JWT verification gagal bisa karena:
     * - Token expired (JsonWebTokenError: jwt expired)
     * - Token dipalsukan (JsonWebTokenError: invalid signature)
     * - Token rusak/tidak valid
     *
     * Dalam semua kasus ini, response 401 akan menyebabkan
     * middleware/auth.ts memanggil authStore.logout() dan redirect ke /login.
     */
    throw createError({
      statusCode: 401,
      message: 'Token tidak valid atau sudah expired. Silakan login kembali.'
    })
  }
})

