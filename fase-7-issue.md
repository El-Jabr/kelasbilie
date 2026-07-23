# Panduan Implementasi Fase 7: Dashboard Guru (Teacher)

Dokumen ini berisi instruksi detail langkah-demi-langkah (step-by-step) untuk mengimplementasikan **Fase 7: Dashboard Guru (Teacher)** pada project kelasbilie. Instruksi ini dirancang agar mudah diikuti oleh junior programmer atau AI assistant (model yang lebih hemat biaya). 

## Tujuan Utama
Membangun modul antarmuka (frontend) dan fungsionalitas bagi user dengan role `TEACHER` agar mereka dapat melihat daftar kelas yang diampu, melihat daftar siswa di kelas tersebut, menginput nilai secara manual (atau melihat nilai yang disinkronisasi dari Moodle), melihat rekap nilai, dan mengedit profil.

## Aturan & Standar Wajib (Sangat Penting!)
1. **KONSISTENSI UI**: Selalu gunakan komponen dari **Nuxt UI** (`@nuxt/ui`). Contoh: `UTable`, `UButton`, `UCard`, `UForm`, `UInput`, `UIcon`, `UModal`, dll. Jangan gunakan tag standar HTML mentah jika Nuxt UI sudah menyediakan komponennya.
2. **LAYOUT**: Aplikasi **TIDAK menggunakan Sidebar**. Semua navigasi berada di atas pada **Header Navbar** (menggunakan dropdown). Hal ini harus dijaga konsistensinya. Header ini dikelola terpusat di `app/components/AppHeader.vue`.
3. **STATE MANAGEMENT**: Gunakan `useAuthStore()` (Pinia) yang sudah ada di `app/stores/auth.ts` untuk mendapatkan data `user` dan mengecek `isAuthenticated`. Jangan gunakan `useState('user')`.
4. **PEMANGGILAN API**: Gunakan composable `useFetch` (Nuxt) dengan flag `watch` atau `execute` untuk fetch data tabel agar reaktif. Tambahkan parameter query `page` dan `limit` untuk paginasi jika diperlukan.
5. **TOAST NOTIFICATION**: Gunakan `const toast = useToast()` dari Nuxt UI untuk setiap aksi sukses/error (seperti `toast.add({ title: 'Berhasil', color: 'green' })`).

---

## Langkah-Langkah Pengerjaan

### Step 7.1: Persiapan Layout dan Navigasi Guru
Kita menggunakan satu model navigasi terpusat di atas (Header).
1. **Cek / Update `app/components/AppHeader.vue`**: 
   - Pastikan di dalam `AppHeader.vue`, pada *computed property* `links` atau `items`, sudah ada pengaturan menu khusus untuk role `TEACHER`.
   - Menu untuk guru harus meliputi:
     - Dashboard (`/teacher`)
     - Kelas Saya (`/teacher/classes`)
     - Profil (`/teacher/profile`)
2. **Buat `app/layouts/teacher.vue`**:
   - Buat file layout baru di `app/layouts/teacher.vue`.
   - Isi file ini harus identik/mirip strukturnya dengan `app/layouts/admin.vue`, yaitu memuat komponen `<AppHeader />`, slot `<slot />` yang dibungkus tag `<main>`, dan `<AppFooter />`.
   - Pastikan desainnya memanjang (*full width*) tapi konten di tengah (contoh: `max-w-7xl mx-auto`).

### Step 7.2: Halaman Dashboard Guru (Home)
**File**: `app/pages/teacher/index.vue`
1. Terapkan layout yang baru dibuat: `definePageMeta({ layout: 'teacher', middleware: ['auth'] })`. Pastikan juga role middleware mengamankan halaman ini khusus `TEACHER`.
2. Halaman ini bertugas menampilkan **Daftar Kelas yang Diampu di Semester Aktif**.
3. **Tugas API**: Buat (atau gunakan yang sudah ada) API GET `/api/teaching-assignments?teacherId=...&semesterId=...` yang mengembalikan relasi `Subject`, `Classroom`, dan `Semester`.
4. **Tugas UI**: Tampilkan dalam bentuk **Card Grid** (menggunakan `<UCard>`).
   - Setiap card mewakili satu penugasan mengajar (Mata Pelajaran X di Kelas Y).
   - Di dalam card, tampilkan: Nama Mata Pelajaran, Nama Kelas, dan total siswa (jika tersedia).
   - Tambahkan tombol di card: "Lihat Detail Kelas" yang mengarahkan ke `/teacher/classes/[teachingAssignmentId]`.

### Step 7.3: Halaman Detail Kelas & Daftar Siswa
**File**: `app/pages/teacher/classes/[id]/index.vue`
1. Halaman ini akan menampilkan daftar siswa yang terdaftar di kelas untuk penugasan mengajar tertentu.
2. **Tugas API**: 
   - Anda perlu melakukan fetch ke API GET `/api/teaching-assignments/[id]` untuk mendapatkan detail kelas dan mapel.
   - Gunakan API GET `/api/student-classes` (dengan filter classroom dan semester) untuk mendapatkan daftar siswa di kelas tersebut.
3. **Tugas UI**:
   - Gunakan `UTable` untuk menampilkan daftar siswa (Nama Siswa, NIS, Jenis Kelamin, dll).
   - Buat header tabel yang informatif (menampilkan Nama Kelas dan Nama Mata Pelajaran).
   - Sediakan tombol navigasi "Kembali ke Dashboard".
   - Di atas `UTable`, tambahkan tombol (misal color `primary`) bertuliskan "Input Nilai Siswa" yang mengarahkan ke halaman input nilai: `/teacher/classes/[id]/grades`.

### Step 7.4: Halaman Input & Sinkronisasi Nilai
**File**: `app/pages/teacher/classes/[id]/grades.vue`
1. **Konsep**: Guru perlu melihat daftar siswa dan nilai `GradeComponent` mereka berdasarkan `GradeItem` untuk mata pelajaran/course ini.
2. **Tugas UI & Filter**:
   - Sediakan filter Dropdown/Select (menggunakan `<USelect>` atau `<USelectMenu>`) untuk Kategori Nilai: `PH` (Penilaian Harian), `STS` (Sumatif Tengah Semester), `SAS` (Sumatif Akhir Semester).
   - Buat tabel (menggunakan `UTable`) dengan kolom: Nama Siswa, Nilai (Input field jika manual), Status Sync Moodle.
3. **Logika Auto-Sync (Moodle)**:
   - Jika nilai ini dikonfigurasi tersinkronisasi dari Moodle, tampilkan badge khusus (menggunakan `<UBadge>`) yang menandakan "Tersinkronisasi dari Moodle". Input nilai pada UI harus **Read-Only** (di-disable) jika nilai berasal dari Moodle.
4. **Form Submit (Manual)**:
   - Jika nilai bersifat manual, biarkan guru menginput angka menggunakan `<UInput type="number">` di dalam kolom tabel.
   - Sediakan tombol "Simpan Nilai" (Save) di bawah tabel.
5. **Tugas API**:
   - Simpan inputan massal dengan melakukan call API POST/PUT ke `/api/grades/components` (buat/sesuaikan endpoint untuk batch insert/update skor siswa).
   - Setelah simpan berhasil, tampilkan `toast` sukses.

### Step 7.5: Halaman Rekap Nilai (Grade Summary)
**File**: `app/pages/teacher/classes/[id]/summary.vue`
1. Halaman ini adalah versi rekapan per-kategori yang sudah final.
2. **Tugas API**: Gunakan API GET `/api/grades/summary` dengan filter `teachingId`.
3. **Tugas UI**: 
   - Gunakan `UTable`. Kolomnya berisi: Nama Siswa, Nilai PH (Rata-rata), Nilai STS, Nilai SAS.
   - Berikan pewarnaan kondisional (contoh: teks warna merah jika nilai < KKM atau misalnya < 75). Anda bisa menggunakan fungsi helper pada `UI` untuk memanipulasi class css `text-red-500`.

### Step 7.6: Halaman Profil Guru
**File**: `app/pages/teacher/profile.vue`
1. Menampilkan detail `User` dan profil `Teacher` dari user yang sedang login.
2. **Tugas UI**:
   - Buat form menggunakan `<UForm>` dari Nuxt UI.
   - Tampilkan field: Nama Lengkap (readonly), Email (readonly), Username (readonly), NIP (editable), dan No Handphone (editable).
3. **Tugas API**:
   - Fetch data dengan API GET `/api/teachers/[id]` (ID guru didapatkan dari authStore atau data profil user login).
   - Update data dengan API PATCH `/api/teachers/[id]`.
4. **Validasi**:
   - Pastikan validasi field diatur di frontend (misal pastikan form tidak kosong). Bisa memakai `zod` schema yang di-import dari folder `shared/schemas/` lalu ditaruh di `<UForm :schema="schema">`.
   - Tampilkan toast saat berhasil menyimpan update profil.

---

## Urutan Pengerjaan yang Disarankan
Bagi programmer/AI, disarankan mengeksekusi langkah-langkah di atas secara berurutan:
1. Selesaikan Layout (`teacher.vue` dan `AppHeader.vue`) (Step 7.1).
2. Buat Halaman Dashboard Guru (List Kelas) (Step 7.2).
3. Buat Halaman Detail Kelas & Daftar Siswa (Step 7.3).
4. Buat Halaman Profil Guru (Step 7.6). (Cukup mudah dan stand alone).
5. Fokus utama: Halaman Input Nilai (Step 7.4) & Rekap Nilai (Step 7.5).

*Catatan: Segera tes fungsionalitas di browser setiap kali selesai mengerjakan 1 step sebelum beralih ke step berikutnya.*
