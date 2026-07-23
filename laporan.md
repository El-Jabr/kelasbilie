# Laporan Analisis Project: Kelasbilie

Berdasarkan analisis **schema.prisma** (15 model), struktur API, dan kode *frontend*, berikut adalah laporan komprehensif mengenai status project, evaluasi *best practice*, serta roadmap pengembangan.

---

## A. Arsitektur Role & Hak Akses

Sistem menggunakan 4 role dengan tanggung jawab berbeda:

| Role | Tanggung Jawab | Keterangan |
|---|---|---|
| `SUPER_ADMIN` | Sinkronisasi Moodle, Import User (Guru & Siswa), CRUD data master User | Akses penuh ke seluruh sistem |
| `ADMIN` | Mengelola TeachingAssignment (penugasan guru ke kelas), HomeroomAssignment (wali kelas), StudentClass (pembagian siswa ke kelas), CRUD data akademik | **Admin adalah sekaligus Guru** — memiliki record `Teacher` dan dapat mengajar mata pelajaran |
| `TEACHER` | Melihat kelas yang diampu, input nilai manual, lihat rekap nilai siswa, lihat profil | Guru murni tanpa hak kelola akademik |
| `STUDENT` | Melihat nilai sendiri, lihat kelas & wali kelas, lihat profil | Akses baca saja |

> **Penting:** Role `ADMIN` adalah **dual role** — secara fungsional juga seorang guru. Oleh karena itu:
> - Saat ADMIN login, dashboard yang muncul adalah **dashboard guru** (dengan tambahan menu admin).
> - ADMIN memiliki record `Teacher` di database.
> - Halaman guru (`/teacher/*`) harus dapat diakses oleh role `ADMIN` maupun `TEACHER`.
> - Middleware `role` untuk halaman guru harus mengizinkan keduanya: `['TEACHER', 'ADMIN']`.

### Navigasi Header per Role

| Role | Menu di AppHeader |
|---|---|
| `SUPER_ADMIN` | Dashboard, Master Data (dropdown), Akademik (dropdown), Moodle (dropdown), Monitoring, Settings |
| `ADMIN` | Dashboard (Guru), Kelas Mengajar, Akademik (dropdown: TeachingAssignment, Wali Kelas, Pembagian Kelas), Profil |
| `TEACHER` | Dashboard, Kelas Mengajar, Profil Saya |
| `STUDENT` | Dashboard, Nilai Saya, Profil Saya |

---

## B. Alur Pembagian Kelas Siswa (StudentClass) — Bulk Import

Mendaftarkan ratusan siswa ke kelas setiap tahun ajaran baru adalah pekerjaan besar. Berikut opsi yang tersedia:

### Opsi 1 — Import CSV Manual
- Admin upload file CSV dengan kolom: `nis, nama_kelas, semester`
- Sistem otomatis cocokkan NIS ke tabel `Student` dan nama kelas ke `Classroom`.
- Preview sebelum konfirmasi import.

### Opsi 2 — Clone dari Semester Sebelumnya (Rekomendasi)
- Admin pilih semester sumber dan semester tujuan.
- Sistem menyalin seluruh record `StudentClass` dari semester sumber ke semester tujuan.
- Opsi opsional: **Auto-naik kelas** (siswa kelas VII naik ke VIII, VIII naik ke IX).
- Siswa yang sudah lulus / tidak aktif bisa difilter/dikecualikan otomatis.

### Opsi 3 — Bulk Assign per Kelas
- Admin memilih kelas + semester, lalu pilih beberapa siswa dari daftar untuk didaftarkan sekaligus.
- Berguna untuk tambah siswa baru ke kelas yang sudah ada.

> **API yang dibutuhkan:**
> - `POST /api/student-classes/bulk` — insert banyak StudentClass sekaligus dari array `[{ studentId, classroomId, semesterId }]`
> - `POST /api/student-classes/clone` — clone semester: `{ fromSemesterId, toSemesterId, promoteLevel: boolean }`

---

## 0. Ringkasan Model Database (schema.prisma)

| Model | Kategori | Relasi Utama |
|---|---|---|
| `User` | Auth & Identity | → Teacher, → Student |
| `Student` | Master Data | → User, → StudentClass[], → GradeComponent[], → GradeSummary[], → Enrollment[] |
| `Teacher` | Master Data | → User, → TeachingAssignment[], → HomeroomAssignment[] |
| `AcademicYear` | Akademik | → Semester[] |
| `Semester` | Akademik | → AcademicYear, → StudentClass[], → TeachingAssignment[], → HomeroomAssignment[], → GradeSummary[] |
| `Classroom` | Akademik | → StudentClass[], → TeachingAssignment[], → HomeroomAssignment[] |
| `Subject` | Akademik | → TeachingAssignment[] |
| `StudentClass` | Pivot | Student × Classroom × Semester |
| `TeachingAssignment` | Pivot Utama | Teacher × Subject × Classroom × Semester × Course → GradeSummary[] |
| `HomeroomAssignment` | Pivot | Teacher (Wali Kelas) × Classroom × Semester |
| `Course` | Moodle Sync | → CourseCategory, → TeachingAssignment, → GradeItem[], → Enrollment[] |
| `CourseCategory` | Moodle Sync | → Course[] |
| `GradeItem` | Nilai | → Course, → GradeComponent[] |
| `GradeComponent` | Nilai | Student × GradeItem (skor per item) |
| `GradeSummary` | Nilai | Student × TeachingAssignment × Semester × GradeCategory (PH/STS/SAS) |
| `Enrollment` | Moodle Sync | Student × Course |
| `SchoolSetting` | Konfigurasi | moodleUrl, moodleToken, syncInterval |
| `SyncLog` | Monitoring | resource (USER/COURSE/GRADE/CATEGORY), status, message |

---

## 1. Roadmap & Posisi Saat Ini (Steps)

Tahapan pembangunan sistem LMS ini dipecah menjadi langkah-langkah **kecil dan parsial** yang dapat dikerjakan dan diverifikasi satu per satu.

---

### ✅ FASE 1 – Pondasi & Autentikasi (SELESAI)

- [x] **Step 1.1:** Inisialisasi project Nuxt 4 (struktur `app/` & `server/`)
- [x] **Step 1.2:** Instalasi module esensial (`@nuxt/ui`, `@nuxt/content`, `@vueuse/nuxt`)
- [x] **Step 1.3:** Konfigurasi Prisma ORM + PostgreSQL (`PrismaPg`)
- [x] **Step 1.4:** Desain skema database lengkap (18 model: User, Student, Teacher, AcademicYear, Semester, Classroom, Subject, StudentClass, TeachingAssignment, HomeroomAssignment, Course, CourseCategory, GradeItem, GradeComponent, GradeSummary, Enrollment, SchoolSetting, SyncLog)
- [x] **Step 1.5:** Implementasi API Login (`server/api/auth/login.post.ts`)
- [x] **Step 1.6:** Implementasi API Logout (`server/api/auth/logout.post.ts`)
- [x] **Step 1.7:** Implementasi API Get Me (`server/api/auth/me.get.ts`)
- [x] **Step 1.8:** Setup JWT Token disimpan di HTTP-only Cookie
- [x] **Step 1.9:** Halaman Login UI (`app/pages/login.vue`)
- [x] **Step 1.10:** Pinia Auth Store (`app/stores/auth.ts`) — *sudah dibuat, belum digunakan penuh*
- [x] **Step 1.11:** Zod shared schemas untuk: User, Student, Teacher, Class, Subject, Semester, AcademicYear, TeachingAssignment (`shared/schemas/`)

---

### ✅ FASE 2 – Perbaikan Kritis Sebelum Lanjut (SELESAI)

- [x] **Step 2.1 – [FIX] Unifikasi State Management di `login.vue`**
  - **Masalah:** `login.vue` masih pakai `useState('user')`, padahal Pinia Store sudah dibuat di `app/stores/auth.ts`.
  - **Aksi:** Ganti baris `useState('user').value = res.data` menjadi `useAuthStore().setUser(res.data)`.

- [x] **Step 2.2 – [FIX] Refactor `middleware/auth.ts` — Pinia + Cegah API Flood**
  - **Masalah:** `$fetch('/api/auth/me')` dipanggil setiap navigasi halaman **tanpa pengecekan** apakah user sudah ada. Setiap klik menu = 1 request ke server.
  - **Aksi:** Tambahkan pengecekan `authStore.isAuthenticated` sebelum fetch. Gunakan `useAuthStore()` dan aktifkan kembali `return navigateTo('/login')` yang saat ini dikomentari.

- [x] **Step 2.3 – [FIX] Refactor `middleware/role.ts` — Gunakan Pinia**
  - **Masalah:** Masih menggunakan `useState<User | null>('user')` yang terpisah dari Pinia Store.
  - **Aksi:** Ganti dengan `useAuthStore()` agar satu sumber kebenaran (*single source of truth*).

- [x] **Step 2.4 – [FIX] Optimasi `/api/auth/me` — Kurangi DB Hit**
  - **Masalah:** Setiap panggilan `me.get.ts` selalu query `prisma.user.findUnique` ke database, padahal JWT sudah berisi `id`, `role`, `fullname`.
  - **Aksi:** Kembalikan data langsung dari JWT payload tanpa query DB. Simpan `prisma.findUnique` hanya untuk endpoint profil lengkap.

- [x] **Step 2.5 – [FIX] Hapus `console.log` Sensitif**
  - **Masalah:** Ada `console.log('Token for API:', token)` dan `console.log('Payload:', payload)` di `me.get.ts`, serta `console.log('Login response:', ...)` di `login.vue`. Ini membocorkan data sensitif ke log.
  - **Aksi:** Hapus semua `console.log` debug tersebut.

---

### ✅ FASE 3 – Core CRUD API Master Data (SELESAI)

#### 3A. Users & Auth
- [x] **Step 3.1:** API Users GET list — `index.get.ts` (pagination, search, filter role/active, sort) ✅
- [x] **Step 3.2:** API Users POST create — `index.post.ts` ✅
- [x] **Step 3.3:** API Users GET by ID — `[id].get.ts` ✅
- [x] **Step 3.4:** API Users PATCH update — `[id].patch.ts` ✅
- [x] **Step 3.5:** API Users DELETE — `[id].delete.ts` ✅
- [x] **Step 3.6:** Tambah `try-catch` + `createError(409)` di Users POST/PATCH untuk duplikasi email/username ✅
- [x] **Step 3.7:** Tambah server middleware guard di semua API Users (hanya `SUPER_ADMIN` boleh akses) ✅

#### 3B. Kelas (Classroom)
- [x] **Step 3.8:** API Classroom GET list — `classes/index.get.ts` ✅
- [x] **Step 3.9:** API Classroom POST — `classes/index.post.ts` ✅
- [x] **Step 3.10:** API Classroom PATCH — `classes/[id].patch.ts` ✅
- [x] **Step 3.11:** API Classroom DELETE — `classes/[id].delete.ts` ✅
- [x] **Step 3.12:** Tambah Zod validasi body di POST/PATCH Classroom (`shared/schemas/class.ts` sudah ada) ✅
- [x] **Step 3.13:** Tambah unique constraint handling: nama kelas + level tidak boleh duplikat (409 Conflict) ✅

#### 3C. Mata Pelajaran (Subject)
- [x] **Step 3.14:** API Subject GET list — `subjects/index.get.ts` ✅
- [x] **Step 3.15:** API Subject POST — `subjects/index.post.ts` ✅
- [x] **Step 3.16:** API Subject PATCH — `subjects/[id].patch.ts` ✅
- [x] **Step 3.17:** API Subject DELETE — `subjects/[id].delete.ts` ✅
- [x] **Step 3.18:** Handle error jika Subject dihapus padahal masih dipakai di `TeachingAssignment` (relasi constraint P2003 -> 400 Bad Request) ✅

#### 3D. Guru (Teacher)
- [x] **Step 3.19:** API Teacher GET list — `teachers/index.get.ts` ✅
- [x] **Step 3.20:** API Teacher POST (create User + Teacher sekaligus dalam 1 transaksi) — `teachers/index.post.ts` ✅
- [x] **Step 3.21:** API Teacher PATCH — `teachers/[id].patch.ts` ✅
- [x] **Step 3.22:** API Teacher DELETE — `teachers/[id].delete.ts` ✅
- [x] **Step 3.23:** API Teacher Import CSV — `teachers/import/` ✅
- [x] **Step 3.24:** API Teacher GET by ID — `teachers/[id].get.ts` ✅
- [x] **Step 3.25:** Validasi NIP unik saat POST/PATCH + error 409 jika duplikat ✅

#### 3E. Siswa (Student)
- [x] **Step 3.26:** API Student GET list — `students/index.get.ts` ✅
- [x] **Step 3.27:** API Student POST (create User + Student sekaligus) — `students/index.post.ts` ✅
- [x] **Step 3.28:** API Student PATCH — `students/[id].patch.ts` ✅
- [x] **Step 3.29:** API Student DELETE — `students/[id].delete.ts` ✅
- [x] **Step 3.30:** API Student Import CSV — `students/import/` ✅
- [x] **Step 3.31:** API Student GET by ID — `students/[id].get.ts` ✅
- [x] **Step 3.32:** Validasi NIS unik saat POST/PATCH + error 409 jika duplikat ✅

#### 3F. Tahun Ajaran (AcademicYear)
- [x] **Step 3.33:** API AcademicYear GET list — `academic-years/index.get.ts` ✅
- [x] **Step 3.34:** API AcademicYear POST — `academic-years/index.post.ts` ✅
- [x] **Step 3.35:** API AcademicYear PUT update — `academic-years/[id]/index.put.ts` ✅
- [x] **Step 3.36:** API AcademicYear DELETE — `academic-years/[id]/index.delete.ts` ✅
- [x] **Step 3.37:** API AcademicYear toggle status — `academic-years/[id]/status.patch.ts` ✅
- [x] **Step 3.38:** Validasi: hanya 1 AcademicYear boleh `isActive = true` dalam satu waktu ✅
- [x] **Step 3.39:** Validasi: AcademicYear `isLocked` tidak boleh diubah/dihapus (403 Forbidden) ✅

#### 3G. Semester
- [x] **Step 3.40:** API Semester GET list — `semesters/index.get.ts` ✅
- [x] **Step 3.41:** API Semester POST — `semesters/index.post.ts` ✅ (unique constraint: `academicYearId + type`)
- [x] **Step 3.42:** API Semester PATCH — `semesters/[id].patch.ts` ✅
- [x] **Step 3.43:** API Semester DELETE — `semesters/[id].delete.ts` ✅
- [x] **Step 3.44:** Validasi: hanya 1 Semester aktif per AcademicYear aktif ✅
- [x] **Step 3.45:** Validasi: Semester `isLocked` tidak boleh diubah/dihapus (403 Forbidden) ✅

#### 3H. Penugasan Mengajar (TeachingAssignment)
- [x] **Step 3.46:** API TeachingAssignment GET list — `teaching-assignments/index.get.ts` ✅ (dengan join Teacher, Subject, Classroom, Semester)
- [x] **Step 3.47:** API TeachingAssignment POST — `teaching-assignments/index.post.ts` ✅
- [x] **Step 3.48:** API TeachingAssignment PATCH — `teaching-assignments/[id].patch.ts` ✅
- [x] **Step 3.49:** API TeachingAssignment DELETE — `teaching-assignments/[id].delete.ts` ✅
- [x] **Step 3.50:** Validasi unique: 1 guru tidak boleh mengajar subjek yang sama di kelas yang sama dalam 1 semester (409 Conflict) ✅
- [x] **Step 3.51:** Validasi `courseId` (Moodle Course ID) harus ada di tabel `Course` sebelum assignment dibuat (404 Not Found) ✅

#### 3I. Wali Kelas (HomeroomAssignment)
- [x] **Step 3.52:** Buat API GET list HomeroomAssignment — `server/api/homerooms/index.get.ts` ✅
- [x] **Step 3.53:** Buat API POST HomeroomAssignment — `server/api/homerooms/index.post.ts` ✅
- [x] **Step 3.54:** Buat API PATCH HomeroomAssignment — `server/api/homerooms/[id].patch.ts` ✅
- [x] **Step 3.55:** Buat API DELETE HomeroomAssignment — `server/api/homerooms/[id].delete.ts` ✅
- [x] **Step 3.56:** Validasi unique: 1 kelas hanya boleh punya 1 wali kelas per semester, 1 guru hanya boleh jadi wali di 1 kelas per semester (409 Conflict) ✅

#### 3J. Pembagian Kelas Siswa (StudentClass)
- [x] **Step 3.57:** Buat API POST StudentClass — `server/api/student-classes/index.post.ts` (daftarkan siswa ke kelas per semester) ✅
- [x] **Step 3.58:** Buat API GET StudentClass per Classroom + Semester — `server/api/student-classes/index.get.ts` ✅
- [x] **Step 3.59:** Buat API DELETE StudentClass — `server/api/student-classes/[id].delete.ts` ✅
- [x] **Step 3.60:** Validasi unique: 1 siswa hanya boleh ada di 1 kelas per semester (409 Conflict) ✅

---

### 🔗 FASE 4 – Integrasi Moodle (Sync System)

> Model yang terlibat: `Course`, `CourseCategory`, `GradeItem`, `GradeComponent`, `Enrollment`, `SyncLog`, `SchoolSetting`

#### 4A. Konfigurasi Moodle
- [x] **Step 4.1:** API GET SchoolSetting — `server/api/settings/index.get.ts` ✅
- [x] **Step 4.2:** API PATCH SchoolSetting (moodleUrl, moodleToken, syncInterval) — `server/api/settings/index.patch.ts` ✅
- [ ] **Step 4.3:** Halaman UI Pengaturan Sekolah (`super-admin/settings/index.vue`) — form moodleUrl + moodleToken + test koneksi
- [x] **Step 4.4:** Buat `server/utils/moodle.ts` — service wrapper untuk Moodle REST API (`core_course_get_courses`, `core_enrol_get_enrolled_users`, `gradereport_user_get_grade_items`) ✅

#### 4B. Sync Course & Category dari Moodle
- [x] **Step 4.5:** Skeleton API Moodle GET — `server/api/moodle/index.get.ts` (ada tapi perlu dilengkapi) ✅
- [x] **Step 4.6:** Skeleton API Moodle POST sync — `server/api/moodle/index.post.ts` ✅
- [x] **Step 4.7:** Implementasi sync `CourseCategory` dari Moodle → simpan ke tabel `CourseCategory` ✅
- [x] **Step 4.8:** Implementasi sync `Course` dari Moodle → simpan ke tabel `Course` (dengan relasi `CourseCategory`) ✅
- [x] **Step 4.9:** Tulis `SyncLog` setiap kali sync selesai (resource=CATEGORY/COURSE, status=success/failed, message) ✅
- [ ] **Step 4.10:** UI halaman sinkronisasi (`super-admin/moodle/sinkronisasi.vue`) — tombol trigger sync per resource + tampil history `SyncLog`

#### 4C. Sync GradeItem & GradeComponent dari Moodle
- [x] **Step 4.11:** Implementasi sync `GradeItem` per course dari Moodle → simpan ke tabel `GradeItem` (id=moodle gradeItemId, category=PH/STS/SAS) ✅
- [x] **Step 4.12:** Implementasi sync `GradeComponent` per student per gradeItem → simpan skor ke tabel `GradeComponent` ✅
- [x] **Step 4.13:** Tulis `SyncLog` untuk setiap sync GRADE ✅
- [ ] **Step 4.14:** UI halaman nilai Moodle (`super-admin/moodle/nilai.vue`) — tampil status sync nilai per course

#### 4D. Sync Enrollment dari Moodle
- [x] **Step 4.15:** Implementasi sync `Enrollment` (siswa terdaftar di course Moodle) → simpan ke tabel `Enrollment` ✅
- [x] **Step 4.16:** Tulis `SyncLog` untuk setiap sync USER/ENROLLMENT ✅
- [ ] **Step 4.17:** UI tampil daftar siswa yang ter-enroll per course di halaman course Moodle (`super-admin/moodle/course.vue`)

#### 4E. Halaman Course Moodle (UI)
- [x] **Step 4.18:** Skeleton halaman `super-admin/moodle/course.vue` sudah ada ✅
- [ ] **Step 4.19:** Hubungkan dengan API untuk tampil list Course dari DB lokal (yang sudah di-sync)
- [ ] **Step 4.20:** Tambah filter berdasarkan `CourseCategory` dan `TeachingAssignment`

---

### 📊 FASE 5 – Pipeline Kalkulasi Nilai (GradeSummary)

> Model yang terlibat: `GradeComponent` → `GradeSummary`  
> Enum: `GradeCategory { PH, STS, SAS }`

- [x] **Step 5.1:** Pahami aturan kalkulasi: `GradeSummary` berisi rekapitulasi nilai per kategori (PH=Penilaian Harian, STS=Sumatif Tengah Semester, SAS=Sumatif Akhir Semester) per siswa per TeachingAssignment per semester ✅
- [x] **Step 5.2:** Buat API kalkulasi otomatis `GradeSummary` — `server/api/grades/calculate.post.ts` ✅
  - Input: `teachingId`, `semesterId`
  - Proses: ambil semua `GradeComponent` siswa yang terdaftar di kelas tersebut → rata-rata per kategori → simpan/update `GradeSummary`
- [x] **Step 5.3:** Buat API GET GradeSummary per TeachingAssignment — `server/api/grades/summary.get.ts` ✅
  - Filter: `teachingId`, `semesterId`, `category` (PH/STS/SAS)
  - Response: daftar siswa + nilai per kategori
- [x] **Step 5.4:** Buat API GET GradeSummary per Student — `server/api/grades/student/[studentId].get.ts` ✅
  - Response: semua mata pelajaran + nilai per kategori untuk student tersebut
- [x] **Step 5.5:** Buat API GET GradeComponent per Student per Course — `server/api/grades/components.get.ts` ✅
  - Tampil detail skor per GradeItem (per tugas/kuis)
- [x] **Step 5.6:** Buat trigger kalkulasi otomatis setelah sync GradeComponent selesai (Step 4.12 → auto-calculate Step 5.2) ✅

---

### 🖥️ FASE 6 – Frontend Dashboard Super Admin

> Halaman yang sudah ada (skeleton): `super-admin/index.vue`, `master/`, `akademik/`, `moodle/`, `monitoring/`, `settings/`

#### 6A. Layout & Dashboard Utama
- [x] **Step 6.1:** Buat layout Admin (`app/layouts/admin.vue`) — Sidebar navigasi + Header dengan info user + dark mode toggle ✅
  - Navigasi: Dashboard | Master Data | Akademik | Moodle | Monitoring | Pengaturan
- [x] **Step 6.2:** Halaman `super-admin/index.vue` — Statistik ringkasan ✅
  - Card: Total User, Total Guru, Total Siswa, Total Kelas
  - Card: Status Sync Terakhir (dari `SyncLog`)
  - Card: Semester Aktif + Tahun Ajaran Aktif

#### 6B. Master Data — Users
- [x] **Step 6.3:** `super-admin/master/users/index.vue` — UTable users (pagination server-side, search, filter role, filter isActive) ✅
- [x] **Step 6.4:** Modal/drawer Tambah User + validasi Zod ✅
- [x] **Step 6.5:** Modal/drawer Edit User + konfirmasi Hapus User ✅
- [x] **Step 6.6:** Badge dinamis untuk `role` (SUPER_ADMIN=purple, ADMIN=gray, TEACHER=blue, STUDENT=orange) dan `isActive` ✅

#### 6C. Master Data — Guru
- [x] **Step 6.7:** `super-admin/master/guru/index.vue` — UTable guru (search nama/NIP, pagination) ✅
- [x] **Step 6.8:** Modal Tambah Guru (form: fullname, email, username, password, NIP) ✅
- [x] **Step 6.9:** Modal Edit Guru + Hapus ✅
- [x] **Step 6.10:** Tombol Import CSV Guru + preview sebelum import ✅

#### 6D. Master Data — Siswa
- [x] **Step 6.11:** `super-admin/master/siswa/index.vue` — UTable siswa (search nama/NIS, filter kelas, pagination) ✅
- [x] **Step 6.12:** Modal Tambah Siswa (form: fullname, email, NIS) ✅
- [x] **Step 6.13:** Modal Edit Siswa + Hapus ✅
- [x] **Step 6.14:** Tombol Import CSV Siswa + preview ✅

#### 6E. Akademik
- [x] **Step 6.15:** Skeleton halaman `super-admin/akademik/tahun-ajaran.vue` ✅
- [x] **Step 6.16:** Lengkapi UI Tahun Ajaran — tabel + form create/edit + toggle status aktif/kunci ✅
- [x] **Step 6.17:** Skeleton halaman `super-admin/akademik/semester.vue` ✅
- [x] **Step 6.18:** Lengkapi UI Semester — tabel + form create (pilih AcademicYear, pilih GANJIL/GENAP) + toggle status ✅
- [x] **Step 6.19:** Skeleton halaman `super-admin/akademik/kelas.vue` ✅
- [x] **Step 6.20:** Lengkapi UI Kelas — tabel + form create (nama, level, ruang, gedung, lantai) ✅
- [x] **Step 6.21:** Skeleton halaman `super-admin/akademik/mata-pelajaran.vue` ✅
- [x] **Step 6.22:** Lengkapi UI Mata Pelajaran — tabel + form create (kode, nama) ✅
- [x] **Step 6.23:** Halaman Penugasan Mengajar — tabel `TeachingAssignment` per semester aktif + form assign guru ✅
- [x] **Step 6.24:** Halaman Wali Kelas — tabel `HomeroomAssignment` per semester + form assign wali kelas ✅
- [x] **Step 6.25:** Halaman Pembagian Kelas Siswa (`StudentClass`) — assign siswa ke kelas per semester (bisa bulk dari CSV) ✅

#### 6F. Monitoring
- [x] **Step 6.26:** `super-admin/monitoring/activity-log.vue` — tampil `SyncLog` (resource, status, message, syncedAt) ✅
- [ ] **Step 6.27:** `super-admin/monitoring/queue.vue` — tampil antrian sync yang berjalan
- [ ] **Step 6.28:** `super-admin/monitoring/login-history.vue` — tampil riwayat login user

---

### 👩‍🏫 FASE 7 – Dashboard Guru (Teacher) (SELESAI)

- [x] **Step 7.1:** Buat/Update layout Guru (`app/layouts/teacher.vue`) — Menggunakan Header Navbar dengan dropdown (tanpa Sidebar), konsisten dengan AppHeader yang sudah dibuat.
- [x] **Step 7.2:** Halaman dashboard guru — list kelas yang diampu di semester aktif (dari `TeachingAssignment`)
- [x] **Step 7.3:** Halaman detail kelas — daftar siswa di kelas (dari `StudentClass` + `Student`)
- [x] **Step 7.4:** Halaman input nilai — tampil `GradeItem` per course → input skor per siswa → simpan `GradeComponent`
  - Filter: per kategori (PH/STS/SAS)
  - Fitur: skor sudah sync dari Moodle tampil otomatis (read-only dari `lastSync`)
- [x] **Step 7.5:** Halaman rekap nilai — tampil `GradeSummary` per siswa per mata pelajaran (PH/STS/SAS)
- [x] **Step 7.6:** Halaman profil guru — edit NIP, no HP

---

### 🎓 FASE 8 – Dashboard Siswa (Student) (SELESAI)

- [x] **Step 8.1:** Buat layout Siswa (`app/layouts/student.vue`) — Menggunakan Top Header Navbar dengan dropdown (tanpa Sidebar), konsisten dengan AppHeader yang sudah dibuat.
- [x] **Step 8.2:** Halaman dashboard siswa — info kelas aktif, semester, wali kelas (dari `HomeroomAssignment`)
- [x] **Step 8.3:** Halaman nilai siswa — tampil `GradeSummary` semua mata pelajaran
  - Kolom: Mata Pelajaran | Guru | PH | STS | SAS
- [x] **Step 8.4:** Halaman detail nilai per pelajaran — tampil `GradeComponent` per `GradeItem` (detail per tugas/kuis/UH)
- [x] **Step 8.5:** Halaman profil siswa — tampil NIS, kelas, semester

---

### 🧪 FASE 9 – Testing & Deployment

- [ ] **Step 9.1:** Tulis unit test untuk API kritis (Login, auth/me, CRUD Users, kalkulasi GradeSummary)
- [ ] **Step 9.2:** Test integrasi Moodle sync (mock Moodle API response)
- [ ] **Step 9.3:** Setup `.env` production (DATABASE_URL, JWT_SECRET, MOODLE_URL, MOODLE_TOKEN)
- [ ] **Step 9.4:** Migrasi database production (`prisma migrate deploy`)
- [ ] **Step 9.5:** Build Nuxt production (`nuxt build`)
- [ ] **Step 9.6:** Deploy ke server / cloud provider
- [ ] **Step 9.7:** Setup cron job untuk auto-sync Moodle (interval sesuai `SchoolSetting.syncInterval`)

---

## 2. Evaluasi Kode & Best Practice

Anda sudah melakukan pekerjaan yang sangat baik dalam merancang arsitektur. Namun, ada beberapa hal krusial yang perlu diperbaiki:

### ✅ Yang Sudah Bagus

| Aspek | Detail |
|---|---|
| Struktur API | Format `{ data, pagination }` sudah REST-compliant dan konsisten |
| Prisma Query | Penggunaan `$transaction` untuk count + query sekaligus sangat efisien |
| Schema Design | Unique constraints di `StudentClass`, `TeachingAssignment`, `HomeroomAssignment` sudah tepat |
| Enum Types | `GradeCategory` (PH/STS/SAS), `Role`, `SemesterType`, `Resource` sudah terdefinisi rapi |
| Shared Schemas | Zod schemas di `shared/schemas/` sudah ada untuk 8 entitas |
| Import CSV | Teacher & Student sudah punya endpoint import CSV (lengkap dengan preview) |
| Keamanan Password | `bcryptjs` sudah tepat digunakan |
| JWT Cookie | Penyimpanan token di HTTP-only Cookie sudah aman |

### ✅ Yang Sudah Diperbaiki (Selesai di Fase 2–7)

#### A. ~~Split Source of Truth~~ → **SELESAI**
- `login.vue`, `middleware/auth.ts`, `middleware/role.ts` — sudah menggunakan **Pinia Store** secara konsisten.

#### B. ~~API Flood di Middleware~~ → **SELESAI**
- `authStore.isAuthenticated` dicek lebih dulu sebelum memanggil `$fetch('/api/auth/me')`. Tidak ada flood request.

#### C. ~~Database Hit Tidak Perlu di `/api/auth/me`~~ → **SELESAI**
- `me.get.ts` kini mengembalikan data langsung dari JWT payload tanpa query DB.

#### D. ~~`console.log` di Production Code~~ → **SELESAI**
- Semua `console.log` sensitif (token, payload) telah dihapus.

#### E. ~~Redirect di `middleware/auth.ts` Dikomentari~~ → **SELESAI**
- `return navigateTo('/login')` sudah aktif kembali di middleware auth.

#### F. ~~API Users belum lengkap~~ → **SELESAI**
- Endpoint `[id].get.ts`, `[id].patch.ts`, `[id].delete.ts` sudah tersedia di `/api/users/`.

#### G. ~~API Teachers & Students belum punya `[id].get.ts`~~ → **SELESAI**
- Sudah dibuat di Fase 3.

#### H. ~~Tidak ada API untuk HomeroomAssignment & StudentClass~~ → **SELESAI**
- API lengkap sudah dibuat di Fase 3I dan 3J.

---

## 3. Saran Tambahan

1. **Validasi Query String:** Parameter GET (`page`, `limit`, `search`) di-parse manual. Buat Zod query schema untuk konsistensi.
2. **Error Handling Prisma:** Tangkap `PrismaClientKnownRequestError` kode P2002 (unique constraint) → return 409 Conflict.
3. **`nuxt.config.ts` — Prerender:** Konfigurasi `nitro.prerender.crawlLinks = true` bisa mempengaruhi API routes. Pastikan hanya halaman statis yang di-prerender.
4. **GradeSummary Trigger:** Pertimbangkan kalkulasi `GradeSummary` dijalankan otomatis setelah setiap sync `GradeComponent` selesai, bukan manual.
5. **SchoolSetting token keamanan:** `moodleToken` disimpan sebagai `@db.Text` — pastikan nilainya dienkripsi atau hanya bisa diakses via server-side.

---

## 4. Saran Tampilan (UI/UX)

Karena Anda menggunakan `@nuxt/ui` (Tailwind CSS & Headless UI):

1. **Admin Layout:** Header Navbar di atas dengan sistem dropdown (tanpa Sidebar). Glassmorphism pada navbar: `bg-white/75 dark:bg-gray-900/75 backdrop-blur-md`.
2. **Data Table:** Gunakan `UTable` + hubungkan `page`, `limit`, `total` dari API untuk server-side pagination.
3. **Status Badges:** `isActive` → `UBadge color="success"` / `color="neutral"`. `role` → SUPER_ADMIN=purple, ADMIN=gray, TEACHER=blue, STUDENT=orange. `GradeCategory` → PH=blue, STS=amber, SAS=rose.
4. **Micro-interactions:** Selalu `toast.add()` untuk setiap aksi CRUD. Gunakan `:loading="isLoading"` pada tombol submit.
5. **Dark Mode:** Gunakan prefix `dark:` pada semua komponen custom. `@nuxt/ui` sudah mendukung dark mode native.
---

## 5. Review Komprehensif (23 Juli 2026)

### 🗑️ File yang Tidak Digunakan & Harus Dihapus

| File / Direktori | Alasan |
|---|---|
| `app/pages/signup.vue` | Tidak ada alur pendaftaran mandiri. User dibuat oleh Admin/Import. |
| `app/pages/pricing.vue` | Tidak relevan untuk LMS sekolah internal. |
| `app/pages/blog.vue` & `blog/` | Tidak relevan, tidak ada konten. |
| `app/pages/docs/` | Tidak relevan untuk sistem ini. |
| `app/pages/super-admin/master/permission.vue` | Skeleton kosong (114 bytes), belum diperlukan. |
| `app/pages/super-admin/master/role.vue` | Skeleton kosong (114 bytes), belum diperlukan. |
| `app/pages/super-admin/master/sekolah.vue` | Skeleton kosong (114 bytes), belum dikoneksikan ke API `SchoolSetting`. |
| `app/pages/super-admin/moodle/nilai.vue` | Skeleton kosong (114 bytes), belum diimplementasikan. |

**Referensi `/signup` yang harus dibersihkan:**
- `app/components/AppHeader.vue` (L352, L379)
- `app/components/AppFooter.vue` (L67 — tombol "Pendaftaran")
- `app/pages/login.vue` (L127 — link "Sign up")
- `app/error.vue` (L36 — redirect ke `/pricing`)

---

### 🐛 Bug UI — Warna Non-Standar Nuxt UI v3

`app/pages/super-admin/moodle/sinkronisasi.vue` masih menggunakan `color="purple"`, `color="blue"`, `color="green"`, `color="orange"`, `color="red"`, `color="gray"` pada komponen `<UButton>` dan `<UBadge>` — ini **tidak valid** di Nuxt UI v3. Harus diganti ke: `primary`, `secondary`, `success`, `warning`, `error`, `info`, `neutral`.

---

### 📊 Analisis Alur Bisnis & Gap

#### A. Import CSV — Seharusnya Otomatis Buat User

- **Gap:** Import siswa dan guru saat ini hanya menambah record `Student`/`Teacher` ke user yang **sudah ada**. Admin harus buat user dulu terpisah, baru bisa import.
- **Target:** Import CSV harus membuat `User` + `Student`/`Teacher` sekaligus dalam 1 transaksi.
- Format CSV siswa baru: `fullname, username, email, nis, password (opsional)`
- Format CSV guru baru: `fullname, username, email, nip, password (opsional), role (TEACHER/SUPER_ADMIN)`
- Jika password tidak diisi, generate otomatis dan tampilkan di hasil import.

#### B. Sync Moodle — Alur Sudah Sesuai

- ✅ Sync Course & Category: Ambil **semua** data dari Moodle.
- ✅ Sync Enrollment (USER): Hanya proses user yang terdaftar di DB lokal (cocokkan `moodleUserId`).
- ✅ Sync GRADE: Otomatis kalkulasi ulang `GradeSummary` setelah sync nilai selesai.

#### C. Dashboard Guru — Fitur Wali Kelas (Belum Ada)

- Guru dengan `HomeroomAssignment` aktif seharusnya bisa melihat **semua nilai semua mata pelajaran** seluruh siswa di kelasnya.
- Saat ini, guru hanya melihat kelas yang dia ajar langsung (via `TeachingAssignment`).
- Perlu tab/section "Wali Kelas" di dashboard guru.

#### D. Nilai Manual Guru — Perlu Proteksi dari Overwrite Sync

- ✅ API `POST /api/grades/components` sudah mendukung input manual.
- ⚠️ Nilai manual bisa **tertimpa** saat admin melakukan sync Moodle berikutnya.
- Solusi: Tambah field `isManual boolean @default(false)` di `GradeComponent`. Saat sync Moodle, jika `isManual = true`, **skip / tidak timpa** nilai tersebut.

---

### 🛣️ Roadmap Tambahan (Fase 8.5 — Perbaikan & Kelengkapan)

#### 🧹 Cleanup
- [x] **Step 8.5.1:** Hapus semua file yang tidak digunakan: `signup.vue`, `pricing.vue`, `blog.vue`, direktori `blog/`, `docs/`, skeleton kosong (`permission.vue`, `role.vue`, `sekolah.vue`, `nilai.vue`)
- [x] **Step 8.5.2:** Hapus semua referensi `/signup` di `AppHeader.vue`, `AppFooter.vue`, `login.vue`, dan `/pricing` di `error.vue`

#### 🐛 Bug Fix
- [x] **Step 8.5.3:** Perbaiki warna non-standar Nuxt UI v3 di `sinkronisasi.vue` — ganti `"purple"`, `"blue"`, `"green"`, `"orange"`, `"red"`, `"gray"` ke `"primary"`, `"info"`, `"success"`, `"warning"`, `"error"`, `"neutral"`

#### 🔐 Penyesuaian Role — ADMIN Dual Role (Admin sekaligus Guru)
- [x] **Step 8.5.4:** Update `middleware/role.ts` — halaman `/teacher/*` harus mengizinkan role `ADMIN` dan `TEACHER` (saat ini hanya `TEACHER`)
- [x] **Step 8.5.5:** Update `AppHeader.vue` — saat role `ADMIN` login, tampilkan menu gabungan: menu guru (`Kelas Mengajar`, `Profil`) + menu admin (`Penugasan Mengajar`, `Wali Kelas`, `Pembagian Kelas`)
- [x] **Step 8.5.6:** Saat import guru, ADMIN wajib memiliki record `Teacher` di DB (pastikan endpoint `/api/teachers/import` membuat record `Teacher` untuk ADMIN juga)
- [x] **Step 8.5.7:** Update `login.vue` redirect — ADMIN diarahkan ke `/teacher` (dashboard guru) bukan `/super-admin`

#### 📥 Import CSV — Buat User + Data Sekaligus
- [x] **Step 8.5.8:** Refactor `/api/students/import` — setiap baris CSV buat `User` (role=STUDENT) + `Student` dalam 1 transaksi. Format CSV: `fullname, username, email, nis, password (opsional)`
- [x] **Step 8.5.9:** Refactor `/api/teachers/import` — setiap baris CSV buat `User` (role=TEACHER/ADMIN) + `Teacher` dalam 1 transaksi. Format CSV: `fullname, username, email, nip, password (opsional), role (TEACHER/ADMIN)`
- [x] **Step 8.5.10:** Jika kolom `password` kosong di CSV, generate password acak 8 karakter dan tampilkan di tabel hasil import (kolom "Password Awal")

#### 🏫 Bulk Import StudentClass (Pembagian Kelas Siswa)
- [x] **Step 8.5.11:** Buat API `POST /api/student-classes/bulk` — insert banyak StudentClass sekaligus dari array `[{ studentId, classroomId, semesterId }]` dengan validasi unique constraint
- [x] **Step 8.5.12:** Buat API `POST /api/student-classes/clone` — clone pembagian kelas dari satu semester ke semester lain. Body: `{ fromSemesterId, toSemesterId, promoteLevel: boolean }`. Jika `promoteLevel=true`, siswa di kelas VII-A dipindah ke VIII-A, VIII-A ke IX-A, dst.
- [x] **Step 8.5.13:** Implementasi UI halaman "Pembagian Kelas" dengan 3 opsi:
  - **Tab 1 - Import CSV:** Upload CSV `nis, nama_kelas` → preview → konfirmasi import
  - **Tab 2 - Clone Semester:** Pilih semester sumber + semester tujuan + toggle "Naik Kelas Otomatis" → preview daftar siswa → konfirmasi
  - **Tab 3 - Assign Manual:** Pilih kelas + semester → tampilkan daftar siswa aktif belum ter-assign → centang → simpan

#### 👩‍🏫 Fitur Wali Kelas di Dashboard Guru
- [x] **Step 8.5.14:** Buat API `GET /api/homerooms/my` — cek apakah guru yang login memiliki `HomeroomAssignment` aktif (semester aktif)
- [x] **Step 8.5.15:** Buat API `GET /api/grades/classroom/[classroomId]` — rekap semua `GradeSummary` per siswa per mata pelajaran di kelas tersebut (khusus semester aktif)
- [x] **Step 8.5.16:** Tambah section/card "Wali Kelas" di halaman `teacher/index.vue` jika guru punya homeroom aktif — tampilkan nama kelas dan link ke halaman rekap
- [x] **Step 8.5.17:** Buat halaman `teacher/homeroom/index.vue` — tabel rekap nilai seluruh siswa di kelas (semua mapel, kolom PH/STS/SAS/Akhir)

#### 🛡️ Proteksi Nilai Manual
- [x] **Step 8.5.18:** Tambah field `isManual Boolean @default(false)` di model `GradeComponent` pada `schema.prisma`, lalu jalankan `prisma migrate dev`
- [x] **Step 8.5.19:** Update `POST /api/grades/components` — set `isManual: true` saat guru input manual
- [x] **Step 8.5.20:** Update sync Moodle di `moodle/index.post.ts` — skip upsert `GradeComponent` jika record yang ada sudah `isManual = true`

#### ⚙️ Halaman Pengaturan Sekolah
- [x] **Step 8.5.21:** Implementasi halaman `super-admin/settings/index.vue` — form `moodleUrl` + `moodleToken` + tombol "Test Koneksi" + simpan ke `SchoolSetting`
