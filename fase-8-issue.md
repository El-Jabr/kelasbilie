# Instruksi Implementasi Fase 8: Dashboard Siswa (Student)

Dokumen ini berisi instruksi detail untuk mengimplementasikan Fase 8 pada project **Kelasbilie**. Harap kerjakan dengan teliti secara bertahap (step-by-step) dan pastikan Anda mengikuti setiap panduan UI/UX serta best practices di bawah ini.

## 📌 Pedoman Penting (Wajib Dibaca Sebelum Mulai)

1. **Konsistensi UI (Nuxt UI v3):**
   - Aplikasi ini menggunakan **Nuxt UI v3**. Pastikan Anda HANYA menggunakan prop `color` standar Nuxt UI v3, yaitu: `"primary"`, `"secondary"`, `"success"`, `"error"`, `"warning"`, `"info"`, dan `"neutral"`.
   - **JANGAN** gunakan nama warna spesifik Tailwind seperti `"emerald"`, `"rose"`, `"amber"`, `"red"`, `"green"`, dll pada komponen `<UBadge>`, `<UButton>`, `<UAlert>`, dll.
   - Gunakan ikon dari pustaka **Lucide** (contoh: `i-lucide-user`, `i-lucide-book-open`, dll).
2. **Layout & Navigasi (Sangat Penting):**
   - Sesuai dengan instruksi terbaru, sistem menggunakan navigasi **Top Header Navbar** (bukan Sidebar). 
   - Gunakan komponen `<AppHeader />` dan `<AppFooter />` pada layout.
   - Jangan membuat navigasi Sidebar (seperti UPage/UDashboard) untuk Siswa.
3. **Keamanan (Middleware):**
   - Seluruh halaman siswa (`app/pages/student/...`) WAJIB dilindungi dengan:
     ```typescript
     definePageMeta({
       layout: 'student',
       middleware: ['auth', 'role'],
       role: 'STUDENT'
     })
     ```

---

## 🚀 Langkah-langkah Implementasi

### Step 8.1: Setup Layout Siswa & AppHeader
1. Periksa `app/components/AppHeader.vue`. Pastikan logika navigasi untuk role `STUDENT` sudah ada. Menu yang harus tampil untuk siswa:
   - **Dashboard** (`/student`)
   - **Nilai Saya** (`/student/grades`)
   - **Profil** (`/student/profile`)
2. Buat file `app/layouts/student.vue`.
3. Isi `student.vue` dengan struktur sederhana yang memuat `<AppHeader />`, slot konten utama dalam container `<main class="min-h-screen bg-gray-50 dark:bg-gray-950 pt-20"> <slot /> </main>`, dan `<AppFooter />`.

### Step 8.2: Halaman Dashboard Siswa (`/student/index.vue`) & API
Halaman ini menampilkan informasi kelas siswa yang aktif (Tahun Ajaran Aktif, Semester Aktif, Nama Kelas, dan Wali Kelas).
1. **Buat API Endpoint:** `server/api/students/me.get.ts`
   - Ambil `userId` dari token JWT (via context auth).
   - Query ke tabel `Student` berdasarkan `userId`.
   - Lakukan `include` untuk mendapatkan `StudentClass` pada semester yang sedang aktif (dimana `Semester.isActive = true`), lalu include `Classroom` dan `HomeroomAssignment` (untuk nama Wali Kelas).
2. **Buat Halaman UI (`app/pages/student/index.vue`):**
   - Tampilkan banner/welcome card ("Selamat Datang, [Nama Siswa]").
   - Tampilkan Card informasi akademik:
     - Kelas Saat Ini (contoh: VII A)
     - Wali Kelas (Nama Guru)
     - Tahun Ajaran & Semester Aktif
   - Tampilkan *Quick Links* (tombol aksi cepat menuju halaman Nilai Saya).

### Step 8.3: Halaman Rekap Nilai Siswa (`/student/grades/index.vue`) & API
Halaman ini menampilkan tabel seluruh mata pelajaran dan nilai (GradeSummary) untuk semester aktif.
1. **API Endpoint (`server/api/grades/student/[id].get.ts`):** 
   - API ini mungkin sudah ada (lihat Fase 5). Pastikan ia mengembalikan daftar `GradeSummary` (PH, STS, SAS) untuk student tersebut berdasarkan `semesterId` yang aktif. Termasuk data `TeachingAssignment` -> `Subject` dan `Teacher`.
2. **Buat Halaman UI (`app/pages/student/grades/index.vue`):**
   - Gunakan `<UTable>` untuk menampilkan daftar mata pelajaran.
   - **Kolom Tabel:** Mata Pelajaran | Guru Pengampu | Nilai PH | Nilai STS | Nilai SAS | Nilai Akhir (Opsional) | Aksi (Tombol Detail).
   - Tampilkan badge dinamis jika nilai di bawah KKM (Gunakan color="error") atau di atas KKM (Gunakan color="success").
   - Tambahkan tombol "Lihat Detail" di setiap baris yang mengarah ke `/student/grades/[teachingId]`.

### Step 8.4: Halaman Detail Nilai Per Pelajaran (`/student/grades/[teachingId].vue`)
Menampilkan rincian skor per tugas / kuis (dari tabel `GradeComponent`).
1. **API Endpoint:** Pastikan endpoint `/api/grades/components` dapat diakses oleh Siswa dengan parameter `studentId` dan `teachingId` (atau `courseId`), dan hanya mengembalikan data siswa tersebut.
2. **Buat Halaman UI (`app/pages/student/grades/[teachingId].vue`):**
   - Tampilkan informasi Header: Nama Mata Pelajaran & Nama Guru.
   - Buat tabel detail `GradeComponent`.
   - **Kolom Tabel:** Nama Tugas / Ujian (`GradeItem.itemname`) | Kategori (PH/STS/SAS) | Skor (`finalgrade`).

### Step 8.5: Halaman Profil Siswa (`/student/profile.vue`)
Menampilkan data diri siswa.
1. **Buat Halaman UI (`app/pages/student/profile.vue`):**
   - Ambil data dari state auth dan API `/api/students/me`.
   - Tampilkan profil dalam bentuk Card yang elegan.
   - Informasi yang ditampilkan:
     - Nama Lengkap, Email
     - NIS
     - Kelas Saat Ini
   - Halaman ini bersifat read-only untuk siswa (siswa tidak dapat mengubah NIS sendiri, hanya bisa melihat).

---

## ✅ Kriteria Selesai (Definition of Done)
1. Siswa dapat login dan langsung diarahkan ke `/student`.
2. AppHeader menampilkan menu spesifik siswa secara horizontal di atas (tanpa sidebar).
3. Dashboard menampilkan kelas dan wali kelas saat ini tanpa error.
4. Halaman nilai (`/student/grades`) menampilkan tabel rekapitulasi PH/STS/SAS dengan baik.
5. Saat pindah role/akun (Guru ke Siswa, dll), AppHeader me-refresh menu dengan benar sesuai rolenya.
6. Tidak ada error TypeScript atau error console pada halaman Siswa.
7. Penggunaan komponen warna Nuxt UI v3 konsisten (success, error, warning, info, neutral, primary).

Silakan kerjakan langkah-langkah di atas secara berurutan dan buat satu commit/laporan ketika seluruh komponen Siswa sudah berjalan dengan baik.
