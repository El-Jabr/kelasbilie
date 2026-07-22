# Issue: Fase 2 — Perbaikan Kritis Auth & State Management

> **Assignee:** Junior Programmer / AI Model  
> **Priority:** 🔴 CRITICAL — Harus selesai sebelum mengerjakan Fase 3  
> **Estimasi:** 1–2 jam

---

## 🗺️ Gambaran Umum

Ada **5 masalah kritis** dalam sistem autentikasi yang harus diperbaiki. Semua masalah ini ada di **4 file** berikut:

| File | Lokasi | Masalah |
|---|---|---|
| `app/stores/auth.ts` | Frontend | Perlu ditambah komentar & `fullname` |
| `app/pages/login.vue` | Frontend | Masih pakai `useState`, harus ganti ke Pinia |
| `app/middleware/auth.ts` | Frontend | Setiap navigasi = 1 request API (boros!) |
| `app/middleware/role.ts` | Frontend | Masih pakai `useState`, harus ganti ke Pinia |
| `server/api/auth/me.get.ts` | Backend | Setiap request = hit database (boros!) |

---

## ⚠️ PENTING SEBELUM MULAI

**Jangan ubah file lain selain yang disebutkan di atas.**  
Jangan hapus komentar yang ada di dalam `<template>`.  
Kerjakan **satu file per satu** sesuai urutan di bawah.

---

## 📋 TUGAS 1 — Update `app/stores/auth.ts`

### Latar Belakang
File ini adalah **satu-satunya tempat** menyimpan state user setelah login. Saat ini sudah ada tapi belum punya komentar dan tipe `fullname` belum ada.

### Lokasi File
```
app/stores/auth.ts
```

### Kondisi File Saat Ini
```typescript
import { defineStore } from 'pinia'
import type { User } from '~~/prisma/generated/client'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  function setUser(data: User | null) {
    user.value = data
  }

  function setToken(jwt: string) {
    token.value = jwt
  }

  function logout() {
    user.value = null
    token.value = null
  }

  return {
    user,
    token,
    isAuthenticated,
    setUser,
    setToken,
    logout
  }
})
```

### ✅ Yang Harus Dilakukan
Ganti **seluruh isi file** `app/stores/auth.ts` dengan kode berikut:

```typescript
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
  const user = ref<User | null>(null)

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
  function setUser(data: User | null) {
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
```

### ✅ Checklist Verifikasi Tugas 1
- [ ] File `app/stores/auth.ts` sudah diupdate
- [ ] Ada komentar JSDoc di setiap `ref`, `computed`, dan `function`
- [ ] `console.debug` ada di `setUser`, `setToken`, `logout` untuk memudahkan debugging
- [ ] Tidak ada perubahan pada logika bisnis (hanya tambah komentar + console.debug)

---

## 📋 TUGAS 2 — Update `app/pages/login.vue`

### Latar Belakang
Setelah login berhasil, kode sekarang menyimpan data user ke `useState('user')` — ini **salah**. Harus disimpan ke Pinia store (`useAuthStore().setUser()`).

### Lokasi File
```
app/pages/login.vue
```

### Yang Bermasalah (Baris 62–78)
```typescript
// ❌ SALAH — ini yang harus dihapus/diganti
console.log('Login response:', res)        // baris 62: hapus ini

const userState = useState('user')         // baris 75: hapus ini
userState.value = res.data                 // baris 76: hapus ini

console.log('User state after login:', userState.value) // baris 78: hapus ini
```

### ✅ Yang Harus Dilakukan

**Langkah 1:** Di bagian `<script setup lang="ts">`, tepat setelah baris `const toast = useToast()`, tambahkan baris berikut:

```typescript
// Ambil instance Pinia Auth Store — satu-satunya tempat menyimpan state user
const authStore = useAuthStore()
```

**Langkah 2:** Ganti fungsi `onSubmit` yang lama dengan yang baru di bawah ini:

```typescript
/**
 * Handler submit form login.
 * Dipanggil oleh komponen UAuthForm saat user klik tombol "Sign In".
 *
 * Alur:
 * 1. Kirim POST ke /api/auth/login dengan email + password
 * 2. Server memvalidasi kredensial, membuat JWT, menyimpan JWT ke HTTP-only Cookie
 * 3. Server mengembalikan data user { id, email, role, fullname }
 * 4. Frontend menyimpan data user ke Pinia store via authStore.setUser()
 * 5. Redirect ke halaman utama '/'
 *
 * @param payload - Data form yang sudah divalidasi oleh Zod schema
 */
async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    // Kirim request login ke server
    // credentials: 'include' WAJIB ada agar browser menyimpan cookie dari server
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: payload.data,
      credentials: 'include'
    })

    // Simpan data user ke Pinia store (BUKAN useState!)
    // res.data berisi { id, email, role, fullname } dari server
    authStore.setUser(res.data)

    // Tampilkan notifikasi sukses ke user
    toast.add({
      title: 'Login berhasil',
      description: `Selamat datang, ${res.data.fullname} 👋`
    })

    // Redirect ke halaman dashboard sesuai role
    await navigateTo('/')
  }
  catch (error: any) {
    // Tampilkan pesan error dari server, atau fallback ke pesan default
    toast.add({
      title: 'Login gagal',
      description: error.data?.message || error.message || 'Email atau password salah',
      color: 'error'
    })
  }
}
```

### Hasil Akhir Bagian `<script setup>` yang Benar

Pastikan bagian `<script setup lang="ts">` dari `login.vue` terlihat seperti ini (tidak ada `useState`, tidak ada `console.log`):

```typescript
<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Login',
  description: 'Login to your account to continue'
})

// Instance toast untuk menampilkan notifikasi
const toast = useToast()

// Pinia Auth Store — satu-satunya tempat menyimpan state user
const authStore = useAuthStore()

// Definisi field-field pada form login
const fields = [{
  name: 'email',
  type: 'text' as const,
  label: 'Email',
  placeholder: 'Enter your email',
  required: true
}, {
  name: 'password',
  label: 'Password',
  type: 'password' as const,
  placeholder: 'Enter your password'
}, {
  name: 'remember',
  label: 'Remember me',
  type: 'checkbox' as const
}]

// const providers = [{
//   label: 'Google',
//   icon: 'i-simple-icons-google',
//   onClick: () => {
//     toast.add({ title: 'Google', description: 'Login with Google' })
//   }
// }, {
//   label: 'GitHub',
//   icon: 'i-simple-icons-github',
//   onClick: () => {
//     toast.add({ title: 'GitHub', description: 'Login with GitHub' })
//   }
// }]

// Zod schema untuk validasi form login di sisi frontend
const schema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(6, 'Must be at least 6 characters')
})

type Schema = z.output<typeof schema>

/**
 * Handler submit form login.
 * Dipanggil oleh komponen UAuthForm saat user klik tombol "Sign In".
 *
 * Alur:
 * 1. Kirim POST ke /api/auth/login dengan email + password
 * 2. Server memvalidasi kredensial, membuat JWT, menyimpan JWT ke HTTP-only Cookie
 * 3. Server mengembalikan data user { id, email, role, fullname }
 * 4. Frontend menyimpan data user ke Pinia store via authStore.setUser()
 * 5. Redirect ke halaman utama '/'
 *
 * @param payload - Data form yang sudah divalidasi oleh Zod schema
 */
async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    // Kirim request login ke server
    // credentials: 'include' WAJIB ada agar browser menyimpan cookie dari server
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: payload.data,
      credentials: 'include'
    })

    // Simpan data user ke Pinia store (BUKAN useState!)
    // res.data berisi { id, email, role, fullname } dari server
    authStore.setUser(res.data)

    // Tampilkan notifikasi sukses ke user
    toast.add({
      title: 'Login berhasil',
      description: `Selamat datang, ${res.data.fullname} 👋`
    })

    // Redirect ke halaman dashboard sesuai role
    await navigateTo('/')
  }
  catch (error: any) {
    // Tampilkan pesan error dari server, atau fallback ke pesan default
    toast.add({
      title: 'Login gagal',
      description: error.data?.message || error.message || 'Email atau password salah',
      color: 'error'
    })
  }
}
</script>
```

> **Catatan:** Bagian `<template>` tidak perlu diubah sama sekali.

### ✅ Checklist Verifikasi Tugas 2
- [ ] `useState('user')` sudah dihapus dari `login.vue`
- [ ] `authStore.setUser(res.data)` sudah ada menggantikan `useState`
- [ ] Semua `console.log` sudah dihapus
- [ ] `const authStore = useAuthStore()` sudah ada di atas fungsi `onSubmit`
- [ ] Pesan toast login berhasil menampilkan nama user: `Selamat datang, ${res.data.fullname}`

---

## 📋 TUGAS 3 — Update `app/middleware/auth.ts`

### Latar Belakang
Middleware ini berjalan **setiap kali user berpindah halaman**. Masalahnya, ia selalu memanggil `/api/auth/me` tanpa mengecek apakah user sudah ada di store. Artinya: 10 klik navigasi = 10 request API = 10 DB query di server.

Selain itu, baris `return navigateTo('/login')` masih dikomentari, jadi user yang **belum login bisa akses semua halaman**.

### Lokasi File
```
app/middleware/auth.ts
```

### Kondisi File Saat Ini (BERMASALAH)
```typescript
export default defineNuxtRouteMiddleware(async () => {
  const userState = useState('user')      // ❌ SALAH: pakai useState, bukan Pinia

  try {
    const user = await $fetch('/api/auth/me', {  // ❌ BOROS: dipanggil setiap navigasi!
      credentials: 'include'
    })

    userState.value = user
  } catch {
    userState.value = null
    // return navigateTo('/login')         // ❌ BAHAYA: redirect dikomentari!
  }
})
```

### ✅ Yang Harus Dilakukan
Ganti **seluruh isi file** `app/middleware/auth.ts` dengan kode berikut:

```typescript
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
```

### ✅ Checklist Verifikasi Tugas 3
- [ ] `useState('user')` sudah dihapus dari `middleware/auth.ts`
- [ ] `useAuthStore()` sudah digunakan sebagai gantinya
- [ ] Ada pengecekan `if (authStore.isAuthenticated) return` di awal fungsi
- [ ] `useRequestFetch()` digunakan (bukan `$fetch` atau `useFetch`)
- [ ] `return navigateTo('/login')` sudah **aktif** (tidak dikomentari)
- [ ] `authStore.logout()` dipanggil di `catch` block
- [ ] Ada komentar penjelasan di setiap bagian penting

---

## 📋 TUGAS 4 — Update `app/middleware/role.ts`

### Latar Belakang
Middleware ini bertugas mengecek apakah role user sesuai dengan role yang dibutuhkan sebuah halaman. Saat ini masih menggunakan `useState('user')` yang terpisah dari Pinia store — sehingga bisa terjadi kondisi di mana `auth.ts` bilang user ada, tapi `role.ts` tidak mengenali user tersebut.

### Lokasi File
```
app/middleware/role.ts
```

### Kondisi File Saat Ini (BERMASALAH)
```typescript
import type { User } from '~/types'

export default defineNuxtRouteMiddleware(async (to) => {
  const userState = useState<User | null>('user')  // ❌ SALAH: pakai useState

  if (!userState.value) {
    const { data } = await useFetch('/api/auth/me', {  // ❌ BOROS: double fetch!
      credentials: 'include'
    })

    if (data.value) {
      userState.value = data.value
    }
  }

  const required = to.meta.role as string | undefined
  if (!required) return

  if (userState.value?.role !== required) {
    return navigateTo('/login')
  }
})
```

### ✅ Yang Harus Dilakukan
Ganti **seluruh isi file** `app/middleware/role.ts` dengan kode berikut:

```typescript
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
```

### ✅ Checklist Verifikasi Tugas 4
- [ ] `import type { User } from '~/types'` sudah **dihapus** (tidak diperlukan lagi)
- [ ] `useState<User | null>('user')` sudah dihapus
- [ ] `useAuthStore()` sudah digunakan sebagai gantinya
- [ ] `useFetch('/api/auth/me', ...)` sudah dihapus (tidak boleh ada fetch di sini!)
- [ ] Fungsi menjadi **synchronous** (tidak ada `async`, tidak ada `await`)
- [ ] `authStore.user?.role` digunakan untuk cek role
- [ ] `console.debug` ada untuk memudahkan debugging

---

## 📋 TUGAS 5 — Update `server/api/auth/me.get.ts`

### Latar Belakang
Setiap kali `/api/auth/me` dipanggil, saat ini server:
1. Verifikasi JWT token ✅ (ini benar)
2. Query ke database `prisma.user.findUnique` ❌ (ini tidak perlu!)

JWT sudah berisi `{ id, role, fullname }` — data ini sudah cukup untuk kebutuhan middleware. Kita tidak perlu tanya ke database setiap saat.

> **Catatan penting:** Kita HANYA mengubah `me.get.ts` ini agar tidak query DB untuk kebutuhan middleware. Jika nanti ada endpoint khusus "profil user lengkap", baru query DB di sana.

### Lokasi File
```
server/api/auth/me.get.ts
```

### Kondisi File Saat Ini (BERMASALAH)
```typescript
import jwt from 'jsonwebtoken'
import { prisma } from '../../utils/db'     // ❌ import prisma (tidak diperlukan lagi)

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'token')
  console.log('Token for API:', token)      // ❌ Bocorkan token ke log!
  const config = useRuntimeConfig()

  if (!token)
    throw createError({ statusCode: 401, message: 'Not authenticated' })

  const payload = jwt.verify(token, config.jwtSecret) as {
    id: string
    role: string
    fullname: string
  }

  console.log('Payload:', payload)          // ❌ Bocorkan JWT payload ke log!

  // ❌ BOROS: Query ke DB padahal data sudah ada di JWT payload!
  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, role: true, fullname: true }
  })

  if (!user)
    throw createError({ statusCode: 401 })

  return user
})
```

### ✅ Yang Harus Dilakukan

> **Penjelasan singkat:** JWT yang dibuat saat login sudah berisi `{ id, role }`. Kita tambahkan `fullname` ke JWT payload di `login.post.ts` agar endpoint `me.get.ts` tidak perlu query DB.

**Langkah A:** Cek `server/api/auth/login.post.ts` baris 20-24:

```typescript
// SAAT INI — JWT hanya berisi id dan role
const token = jwt.sign(
  { id: user.id, role: user.role },  // ← fullname belum ada!
  config.jwtSecret,
  { expiresIn: '1d' }
)
```

**Langkah A harus dilakukan:** Update `server/api/auth/login.post.ts` untuk menambahkan `fullname` dan `email` ke JWT payload. Ganti bagian pembuatan token (baris 20-24) menjadi:

```typescript
/**
 * Buat JWT token yang berisi data dasar user.
 * Data ini akan dipakai oleh /api/auth/me TANPA perlu query DB lagi.
 *
 * PENTING: Jangan masukkan data sensitif ke JWT (password, dll).
 * JWT bisa di-decode oleh siapapun yang punya tokennya (walau tidak bisa dipalsukan).
 */
const token = jwt.sign(
  {
    id: user.id,        // dipakai untuk identifikasi user
    role: user.role,    // dipakai untuk pengecekan role di middleware
    fullname: user.fullname, // dipakai untuk tampilan nama di UI
    email: user.email ?? '' // dipakai untuk tampilan email di UI
  },
  config.jwtSecret,
  { expiresIn: '1d' } // token expired dalam 1 hari
)
```

**Langkah B:** Ganti **seluruh isi file** `server/api/auth/me.get.ts` dengan kode berikut:

```typescript
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
```

### ✅ Checklist Verifikasi Tugas 5

**Di `login.post.ts`:**
- [ ] JWT payload sekarang berisi `{ id, role, fullname, email }` (bukan hanya `{ id, role }`)

**Di `me.get.ts`:**
- [ ] `import { prisma } from '../../utils/db'` sudah **dihapus**
- [ ] Semua `console.log` sudah **dihapus**
- [ ] `prisma.user.findUnique(...)` sudah **dihapus** — tidak ada lagi query DB di sini
- [ ] `jwt.verify()` dibungkus `try-catch` dengan error yang informatif
- [ ] Response mengembalikan `{ id, role, fullname, email }` dari JWT payload
- [ ] Fungsi menjadi **synchronous** (tidak perlu `async` karena tidak ada `await`)

---

## 🧪 CARA MENGUJI (Testing Manual)

Setelah semua tugas selesai, lakukan pengujian berikut:

### Test 1 — Login Berhasil
1. Buka browser, pergi ke `http://localhost:3000/login`
2. Masukkan email dan password yang valid
3. Klik Sign In
4. **Expected:** Toast muncul "Login berhasil, Selamat datang [Nama User] 👋"
5. **Expected:** Diredirect ke `/`
6. Buka DevTools → Application → Cookies → pastikan ada cookie `token` dengan `HttpOnly: true`

### Test 2 — Cek Tidak Ada API Flood
1. Setelah login, buka DevTools → Network tab
2. Filter: ketik `/api/auth/me`
3. Klik beberapa menu navigasi berbeda
4. **Expected:** `/api/auth/me` hanya dipanggil **sekali** saat pertama kali (saat refresh/first load), tidak setiap navigasi

### Test 3 — Refresh Halaman
1. Setelah login, tekan F5 (refresh)
2. **Expected:** Masih tetap login (tidak kembali ke halaman login)
3. **Expected:** Di Network tab, ada 1 request ke `/api/auth/me` setelah refresh

### Test 4 — Akses Halaman Tanpa Login
1. Buka tab baru (incognito)
2. Langsung akses `http://localhost:3000/super-admin`
3. **Expected:** Otomatis diredirect ke `/login`

### Test 5 — Logout
1. Panggil logout (tombol logout atau manual dari store)
2. **Expected:** Diredirect ke `/login`
3. **Expected:** Coba akses `/super-admin` → diredirect ke `/login`

### Test 6 — Cek Console Log Bersih
1. Buka DevTools → Console tab
2. Login dan navigasi beberapa halaman
3. **Expected:** Tidak ada log sensitif seperti "Token for API:" atau "Payload:"
4. **Expected:** Yang ada hanya `console.debug` dari AuthStore: "[AuthStore] setUser dipanggil: email@..."

---

## 🚫 HAL YANG DILARANG

- ❌ **Jangan** menggunakan `useState('user')` di file manapun
- ❌ **Jangan** menggunakan `useFetch` di dalam middleware (gunakan `useRequestFetch`)
- ❌ **Jangan** menghapus atau mengubah bagian `<template>` dari `login.vue`
- ❌ **Jangan** mengubah `login.post.ts` selain bagian payload JWT yang disebutkan
- ❌ **Jangan** menambahkan `console.log` baru (gunakan `console.debug` yang bisa dimatikan di production)
- ❌ **Jangan** mengubah atau menghapus `server/api/auth/logout.post.ts`

---

## 📁 Ringkasan File yang Diubah

| File | Perubahan |
|---|---|
| `app/stores/auth.ts` | Tambah komentar JSDoc + `console.debug` di setiap fungsi |
| `app/pages/login.vue` | Ganti `useState` → `authStore.setUser()`, hapus `console.log` |
| `app/middleware/auth.ts` | Refactor total: pakai Pinia, tambah guard `isAuthenticated`, aktifkan redirect |
| `app/middleware/role.ts` | Refactor total: pakai Pinia, hapus `useState` dan `useFetch` |
| `server/api/auth/login.post.ts` | Tambah `fullname` dan `email` ke JWT payload |
| `server/api/auth/me.get.ts` | Hapus query DB, return dari JWT payload, hapus `console.log` |
