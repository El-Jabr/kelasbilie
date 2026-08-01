# 🏫 KelasBilie — Sistem Manajemen Akademik Sekolah & Pesantren

<p align="center">
  <img src="public/logo.png" alt="KelasBilie" width="120" />
</p>

<p align="center">
  Sistem informasi akademik berbasis web untuk manajemen sekolah & pesantren yang terintegrasi dengan Moodle LMS dan Kecerdasan Buatan (Google Gemini AI).
  <br/>
  Dibangun dengan <strong>Nuxt 4</strong>, <strong>Nuxt UI v4</strong>, <strong>Prisma ORM</strong>, dan <strong>PostgreSQL</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Nuxt-4.x-00DC82?logo=nuxt&labelColor=020420" />
  <img src="https://img.shields.io/badge/Nuxt_UI-v4-00DC82?logo=nuxt&labelColor=020420" />
  <img src="https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma&labelColor=020420" />
  <img src="https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql&labelColor=020420" />
  <img src="https://img.shields.io/badge/Google_Gemini-AI_Analysis-blue?logo=google" />
  <img src="https://img.shields.io/badge/Moodle-LMS_Integration-orange?logo=moodle" />
</p>

---

## 📌 Tentang Aplikasi

**KelasBilie** adalah sistem manajemen akademik sekolah dan pesantren modern yang mencakup:

- Manajemen Data Master (Guru, Siswa, User) & Penentuan KKM Per Mata Pelajaran
- Pengelolaan Akademik (Kelas, Semester, Mata Pelajaran, Pembagian Rombel)
- Engine Penilaian Akademik (PH, STS, SAS, Nilai Akhir) dengan Kalkulasi Otomatis
- Integrasi Penuh **Moodle LMS** (sinkronisasi user, auto-enrollment kursus, dan pembacaan nilai otomatis)
- **Integrasi AI Gemini** untuk Analisis Performa Siswa & Kelas dengan Konteks Khusus Sekolah/Pesantren (misal: penyesuaian istilah *Murobbi*, *Tahfidz*, *Muthala'ah*)
- Suite **Unit Testing Komprehensif (Vitest)** untuk seluruh API backend (57 test scenario)

---

## 👥 Alur Kerja Aplikasi Berdasarkan Peran (Role Workflow)

Aplikasi KelasBilie membedakan hak akses dan alur kerja pengguna ke dalam 4 peran (*role*):

### 1. 🛡️ Super Admin (`SUPER_ADMIN`)
*Role puncak dengan wewenang penuh atas seluruh konfigurasi dan data aplikasi.*
- **Pengaturan Sistem & AI (`/settings`)**: Mengatur nama sekolah, koneksi REST API Moodle (URL & Token), serta mengaktifkan Integrasi AI Gemini (API Key & System Prompt Konteks Sekolah/Pesantren).
- **Integrasi & Sinkronisasi Moodle (`/super-admin/moodle/sinkronisasi`)**:
  - Mengekspor data akun Guru & Siswa ke Moodle secara otomatis.
  - Melakukan sinkronisasi nilai siswa dari Moodle ke database lokal.
  - Mengelola **Dual Mode Password Moodle Siswa** (*Mode Harian* vs *Mode Ujian STS/SAS*) dan mengunduh CSV kredensial ujian.
- **Manajemen Data Master & Akademik**: Menambah, mengedit, dan menghapus data User, Guru, Siswa, Tahun Ajaran, Semester, Kelas, Mata Pelajaran (termasuk nilai **KKM**), serta Pembagian Rombel Siswa (*drag-and-drop*).
- **Analisis AI Khusus (`/super-admin/ai`)**: Menjalankan analisis performa belajar kelas dan siswa berbasis AI Gemini.

### 2. 👔 Admin (`ADMIN`)
*Role manajerial akademik untuk mendukung operasional sekolah tanpa akses konfigurasi kritis.*
- **Kelola Data Master**: Menambah dan mengupdate data Guru, Siswa, dan User.
- **Kelola Akademik**: Menentukan Kelas, Mata Pelajaran & Nilai KKM, Pembagian Rombel Siswa, dan Penugasan Wali Kelas.
- **Inspeksi Nilai (`/super-admin/moodle/nilai`)**: Memantau rekapitulasi nilai seluruh kelas dan detail komponen nilai per mata pelajaran.
- **Analisis AI**: Mengakses fitur Analisis AI untuk siswa dan kelas.
- *Batasan*: Tidak dapat mengubah kredensial koneksi Moodle atau System Prompt di menu Settings.

### 3. 👨‍🏫 Guru (`TEACHER`)
*Portal khusus pendidik (`/teacher`) untuk mengelola kelas mengajar dan input penilaian.*
- **Daftar Kelas Mengajar (`/teacher/classes`)**: Melihat daftar kelas dan mata pelajaran yang diampu pada semester aktif.
- **Input & Pengelolaan Nilai (`/teacher/classes/[id]/grades`)**:
  - Menginput nilai Penilaian Harian (PH 1, PH 2, PH 3, dst.) dan menambah item penilaian harian baru.
  - Menginput nilai Sumatif Tengah Semester (STS) dan Sumatif Akhir Semester (SAS).
  - Melihat *badge* referensi nilai Moodle asli (`Moodle: [skor]`).
  - Sistem menghitung otomatis Nilai Akhir dengan formula: `(50% × Rata-rata PH) + (25% × STS) + (25% × SAS)`.
- **Portal Wali Kelas (`/teacher/homeroom`)**: Guru yang ditugaskan sebagai Wali Kelas dapat memantau rekap nilai seluruh mata pelajaran santri/siswa di kelas binaannya.
- **Analisis AI Kelas/Siswa**: Menjalankan analisis AI Gemini khusus untuk siswa dan kelas yang diampunya.

### 4. 🎓 Siswa / Santri (`STUDENT`)
*Portal mandiri siswa (`/student`) untuk transparansi hasil akademik.*
- **Dashboard Siswa**: Informasi kelas, wali kelas, semester aktif, dan statistik pribadi.
- **Lihat Nilai Akademik (`/student/grades`)**: Transparansi rekapitulasi nilai per mata pelajaran, rincian PH, STS, SAS, status KKM, serta Nilai Akhir.
- **Profil Siswa**: Informasi data diri dan akun.

---

## 🎯 Aturan Pembuatan Kursus & Quiz Moodle Agar Sinkronisasi Mulus

Agar proses sinkronisasi nilai dari **Moodle LMS** ke **KelasBilie** berjalan lancar tanpa kendala, ikuti aturan standar pembuatan kursus (*Course*) dan kuis (*Quiz*) di Moodle berikut:

### 1. 📌 Aturan Pemetaan Kursus (Course Mapping Rules)
1. **Penyamaan ID Course**: Setiap kursus yang dibuat di Moodle harus dihubungkan ke **Penugasan Mengajar (Teaching Assignment)** di KelasBilie melalui menu `/super-admin/akademik/teaching-assignments`.
2. **Auto-Enrollment**: Pastikan siswa telah diekspor dari KelasBilie via menu `/super-admin/moodle/sinkronisasi` agar Moodle ID dan username siswa terhubung sempurna.

### 2. 📝 Aturan Penamaan Quiz & Grade Items di Moodle
KelasBilie secara otomatis mengelompokkan nilai dari Moodle ke dalam 3 kategori utama: **PH**, **STS**, dan **SAS**. Ikuti konvensi penamaan judul Quiz/Activity di Moodle berikut:

| Kategori Nilai | Kata Kunci Penamaan di Moodle (Case-Insensitive) | Contoh Judul Quiz di Moodle |
|---|---|---|
| **Penilaian Harian (PH)** | Harus mengandung kata: `PH`, `Tugas`, `Kuis`, `Daily`, atau `Assignment` | - `PH 1 Bab Al-Qur'an`<br/>- `Tugas 2 Fiqih`<br/>- `Kuis Harian 3` |
| **Sumatif Tengah Semester (STS)** | Harus mengandung kata: `STS`, `UTS`, atau `Midterm` | - `STS IPA Kelas 8`<br/>- `UTS Matematika Semester Ganjil` |
| **Sumatif Akhir Semester (SAS)** | Harus mengandung kata: `SAS`, `UAS`, atau `Final` | - `SAS Bahasa Arab Semester Ganjil`<br/>- `UAS IPA Kelas 8` |

> [!TIP]
> **Catatan Pengolahan Nilai PH:**  
> Jika dalam satu kursus Moodle terdapat beberapa kuis PH (misal: PH 1, PH 2, PH 3), KelasBilie akan secara otomatis menghitung **Rata-Rata PH** sebelum dimasukkan ke dalam bobot 50% Nilai Akhir.

### 3. ⚙️ Pengaturan Grade Setting di Moodle
- **Skala Nilai**: Pastikan nilai maksimal (*Grade Range*) pada kuis Moodle disetel ke rentang **0 - 100**.
- **Grading Method**: Gunakan metode penilaian standar (*Highest Grade* atau *Last Attempt*).

---

## 🧩 Formula Penilaian Akhir

Sistem menggunakan formula penilaian baku:

```
Nilai Akhir = (50% × Rata-rata PH) + (25% × STS) + (25% × SAS)
```

- **PH** (Penilaian Harian) — Diambil rata-ratanya dari seluruh item PH
- **STS** (Sumatif Tengah Semester) — Bobot 25%
- **SAS** (Sumatif Akhir Semester) — Bobot 25%
- Seluruh kalkulasi dibulatkan ke bilangan bulat terdekat

---

## 📱 Dual Mode Password Moodle Siswa

Untuk mendukung pelaksanaan ujian berbasis komputer yang aman, KelasBilie menyediakan fitur **Dual Mode Password**:

| Mode | Format Password | Contoh | Tujuan |
|---|---|---|---|
| **Mode Harian** | `Bilie#` + NIS | `Bilie#20240001` | Digunakan untuk pembelajaran dan kuis harian |
| **Mode Ujian STS/SAS** | `Bilie#` + 6 angka acak | `Bilie#892301` | Mencegah kecurangan / kebocoran login saat ujian resmi |

*Admin dapat mengunduh daftar username & password mode ujian dalam bentuk file **CSV** untuk dibagikan saat pelaksanaan ujian.*

---

## 🧪 Unit Testing

KelasBilie dilengkapi dengan suite pengujian unit berbasis **Vitest**:

```bash
# Jalankan seluruh unit test (57 scenario)
npm test
```

Test suite mencakup:
- Autentikasi JWT & Role Access Control
- CRUD Master Data & Akademik (Tahun Ajaran, Semester, Kelas, Siswa, Guru, Mapel & KKM)
- Engine Penilaian & Kalkulasi Rata-rata
- Integrasi AI Gemini (Siswa, Kelas, Mapel, & System Prompt)
- Integrasi Moodle REST API & Export Kredensial

---

## 🚀 Instalasi & Run

```bash
# Install dependencies
pnpm install

# Setup env & DB
cp .env.example .env
npx prisma db push

# Buat Super Admin pertama
pnpm db:superadmin

# Jalankan dev server
pnpm dev
```

---

<p align="center">
  Made with ❤️ for Indonesian Schools & Pesantren
</p>
