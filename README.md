# 🏫 KelasBilie — Sistem Manajemen Akademik Sekolah

<p align="center">
  <img src="public/logo.png" alt="KelasBilie" width="120" />
</p>

<p align="center">
  Sistem informasi akademik berbasis web untuk manajemen sekolah yang terintegrasi dengan Moodle LMS.
  <br/>
  Dibangun dengan <strong>Nuxt 4</strong>, <strong>Nuxt UI v4</strong>, <strong>Prisma ORM</strong>, dan <strong>PostgreSQL</strong>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Nuxt-4.x-00DC82?logo=nuxt&labelColor=020420" />
  <img src="https://img.shields.io/badge/Nuxt_UI-v4-00DC82?logo=nuxt&labelColor=020420" />
  <img src="https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma&labelColor=020420" />
  <img src="https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql&labelColor=020420" />
  <img src="https://img.shields.io/badge/Moodle-LMS_Integration-orange?logo=moodle" />
</p>

---

## 📌 Tentang Aplikasi

**KelasBilie** adalah sistem manajemen akademik sekolah yang mencakup:

- Manajemen data Master (Guru, Siswa, User)
- Pengelolaan Akademik (Kelas, Semester, Mata Pelajaran, Pembagian Rombel)
- Input & Rekap Nilai Siswa (PH, STS, SAS, Nilai Akhir)
- Integrasi penuh dengan **Moodle LMS** (sinkronisasi user, kursus, dan nilai)
- Portal khusus per peran: **Super Admin**, **Admin**, **Guru**, **Siswa**

---

## 🔑 Peran & Akses

| Peran | Akses |
|---|---|
| **SUPER_ADMIN** | Akses penuh ke semua modul & pengaturan sistem |
| **ADMIN** | Master data, Akademik, Nilai — tanpa akses Settings & Moodle Sinkronisasi |
| **TEACHER** | Dashboard Guru, input nilai kelasnya, wali kelas |
| **STUDENT** | Portal siswa, lihat nilai, lihat informasi kelas |

---

## 🏗️ Modul & Fitur Lengkap

### 🔐 Autentikasi
- Login dengan Email + Password (JWT-based, HTTPOnly cookie)
- Role-based access control (RBAC) — middleware `auth` + `role` di setiap halaman
- Logout dengan konfirmasi modal

---

### 🧑‍💼 Super Admin / Admin Panel (`/super-admin`)

#### Master Data
- **Kelola User** (`/master/users`) — Tambah, edit, hapus user sistem; reset password; set role
- **Kelola Guru** (`/master/guru`) — CRUD data guru dengan NIP, mata pelajaran, import CSV bulk
- **Kelola Siswa** (`/master/siswa`) — CRUD data siswa dengan NIS, kelas, import CSV bulk

#### Akademik
- **Tahun Ajaran** (`/akademik/tahun-ajaran`) — CRUD Tahun Ajaran (contoh: 2024/2025)
- **Semester** (`/akademik/semester`) — CRUD Semester (Ganjil/Genap), set semester aktif
- **Kelas** (`/akademik/kelas`) — CRUD Kelas/Rombel (nama, tingkat, ruang)
- **Mata Pelajaran** (`/akademik/mata-pelajaran`) — CRUD Mata Pelajaran dengan kode mapel
- **Penugasan Mengajar** (`/akademik/teaching-assignments`) — Assign guru ke kelas + mapel + course Moodle
- **Wali Kelas** (`/akademik/homerooms`) — Assign guru sebagai wali kelas per semester
- **Pembagian Kelas Siswa** (`/akademik/pembagian-kelas`) — Drag-and-drop transfer siswa ke rombel kelas via panel ganda (Transfer List), dengan filter semester + kelas target

#### Nilai & Moodle
- **Inspeksi Nilai Per Kelas** (`/moodle/nilai`) — Lihat rekap nilai semua siswa per kelas & mapel dalam dua mode:
  - *Mode CLASSROOM_OVERVIEW* — semua nilai akhir seluruh mapel dalam satu tabel
  - *Mode SUBJECT_DETAIL* — detail PH 1, PH 2, PH 3, ..., Rata-rata PH (50%), STS (25%), SAS (25%), Nilai Akhir
- **Course Moodle** (`/moodle/course`) — Lihat daftar kursus Moodle yang terhubung ke penugasan mengajar
- **Sinkronisasi Moodle** (`/moodle/sinkronisasi`) *(Super Admin only)*:
  - Ekspor user aplikasi (Guru & Siswa) ke Moodle sekaligus auto-enroll ke course
  - Sinkronisasi nilai siswa dari Moodle ke database lokal
  - **Mode Password Siswa Moodle**:
    - *Mode Harian*: password = `Bilie#` + NIS (contoh: `Bilie#20240001`)
    - *Mode Ujian STS/SAS*: password = `Bilie#` + 6 angka acak (contoh: `Bilie#892301`)
  - Download CSV kredensial Moodle siswa (NIS, Nama, Kelas, Username, Password)

#### Monitoring
- **Activity Log** (`/monitoring/activity-log`) — Log semua aktivitas sinkronisasi & perubahan data sistem

#### Settings
- **Pengaturan Sistem** (`/settings`) — Konfigurasi nama sekolah, koneksi Moodle (URL + Token API), dan pengaturan global

---

### 👨‍🏫 Portal Guru (`/teacher`)

- **Dashboard Guru** — Ringkasan tugas mengajar, info semester aktif, statistik kelas
- **Daftar Kelas Mengajar** (`/teacher/classes`) — Semua kelas yang diajar guru pada semester aktif
- **Detail Kelas** (`/teacher/classes/[id]`) — Daftar siswa di kelas, ringkasan nilai
- **Input Nilai Siswa** (`/teacher/classes/[id]/grades`) — Tabel Inspeksi Nilai lengkap:
  - Input nilai PH 1, PH 2, PH 3 (dinamis)
  - Tambah item PH manual baru (➕ Tambah Item PH)
  - Input nilai STS dan SAS
  - Nilai Akhir dihitung otomatis: `(50% × Avg PH) + (25% × STS) + (25% × SAS)`
  - Badge referensi `Moodle: [skor]` untuk nilai asli dari Moodle
  - Simpan nilai dengan satu klik
- **Wali Kelas** (`/teacher/homeroom`) — Guru wali kelas melihat daftar seluruh siswa di kelasnya
- **Profil Guru** (`/teacher/profile`) — Lihat & edit data profil pribadi

---

### 🎓 Portal Siswa (`/student`)

- **Dashboard Siswa** — Info kelas, wali kelas, semester, ringkasan informasi akademik
- **Nilai Akademik** (`/student/grades`) — Lihat nilai per mata pelajaran, breakdown PH/STS/SAS, dan nilai akhir
- **Profil Siswa** (`/student/profile`) — Lihat data diri & informasi kelas

---

## 🔗 Integrasi Moodle LMS

KelasBilie mendukung integrasi Moodle melalui **REST API Moodle** dengan token autentikasi.

### Fungsi yang Didukung

| Fungsi | Moodle WS Function |
|---|---|
| Buat User Baru | `core_user_create_users` |
| Update User | `core_user_update_users` |
| Cari User | `core_user_get_users_by_field` |
| Enroll ke Course | `enrol_manual_enrol_users` |
| Ambil Daftar Course | `core_course_get_courses` |
| Ambil Nilai dari Moodle | `gradereport_user_get_grade_items` |

### Alur Sinkronisasi Nilai

1. Nilai siswa di Moodle dibaca per grade item dalam setiap course
2. Grade item dipetakan ke `GradeItem` (PH/STS/SAS) berdasarkan `cmid` / nama
3. Nilai disimpan di `GradeComponent` dengan `moodleScore` (nilai asli) dan `score` (nilai aktif)
4. Nilai akhir dikalkulasi ulang: `(50% × Avg PH) + (25% × STS) + (25% × SAS)`

---

## 🚀 Instalasi & Setup

### Prasyarat

- Node.js ≥ 18
- pnpm ≥ 11
- PostgreSQL ≥ 15
- (Opsional) Moodle LMS dengan REST API aktif

### 1. Clone & Install

```bash
git clone https://github.com/your-org/kelasbilie.git
cd kelasbilie
pnpm install
```

### 2. Konfigurasi Environment

Salin file contoh dan isi variabel yang diperlukan:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/kelasbilie"
JWT_SECRET=your_jwt_secret_min_32_chars_here
NUXT_PUBLIC_SITE_URL=https://your-domain.com

# Moodle (opsional, isi jika menggunakan integrasi Moodle)
MOODLE_URL=https://moodle.your-school.com
MOODLE_TOKEN=your_moodle_rest_api_token
```

### 3. Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema ke database (development)
npx prisma db push

# Atau jalankan migration (production)
npx prisma migrate deploy
```

### 4. Buat Akun Super Admin

```bash
pnpm db:superadmin
```

Script akan meminta email, nama lengkap, dan password untuk akun Super Admin pertama.

### 5. Jalankan Development Server

```bash
pnpm dev
```

Aplikasi akan berjalan di `http://localhost:3000`.

---

## 🏭 Deployment Produksi

### Build Produksi

```bash
pnpm build
```

Output tersedia di folder `.output/`.

### Preview Build

```bash
pnpm preview
```

### Deploy ke Server (Node.js)

Setelah `pnpm build`, jalankan:

```bash
node .output/server/index.mjs
```

Atau gunakan PM2 untuk manajemen proses:

```bash
pm2 start .output/server/index.mjs --name kelasbilie
pm2 save
pm2 startup
```

### Deploy ke Docker

Buat `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY .output/ .output/
COPY .env .env

EXPOSE 3000
ENV HOST=0.0.0.0 PORT=3000

CMD ["node", ".output/server/index.mjs"]
```

```bash
docker build -t kelasbilie .
docker run -p 3000:3000 --env-file .env kelasbilie
```

### Konfigurasi Nginx (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📜 Script NPM

| Perintah | Fungsi |
|---|---|
| `pnpm dev` | Jalankan development server (hot reload) |
| `pnpm build` | Build untuk produksi |
| `pnpm preview` | Preview build produksi secara lokal |
| `pnpm typecheck` | Periksa type TypeScript (`nuxt typecheck`) |
| `pnpm lint` | Linting kode dengan ESLint |
| `pnpm db:superadmin` | Buat akun Super Admin pertama |
| `pnpm db:test` | Uji koneksi database |
| `npx prisma studio` | Buka Prisma Studio (GUI database) |
| `npx prisma db push` | Sync schema Prisma ke database (dev) |
| `npx prisma migrate deploy` | Terapkan migration (production) |

---

## 🗂️ Struktur Proyek

```
kelasbilie/
├── app/
│   ├── components/         # Komponen Vue reusable
│   │   ├── AdminSidebar.vue   # Sidebar panel admin/super-admin
│   │   ├── TeacherSidebar.vue # Sidebar portal guru
│   │   ├── StudentSidebar.vue # Sidebar portal siswa
│   │   ├── AppHeader.vue      # Header landing page (publik)
│   │   ├── AppFooter.vue      # Footer landing page (publik)
│   │   └── modal/             # Modal-modal reusable (Logout, dll)
│   ├── layouts/
│   │   ├── admin.vue      # Layout sidebar Super Admin & Admin
│   │   ├── teacher.vue    # Layout sidebar Guru
│   │   ├── student.vue    # Layout sidebar Siswa
│   │   ├── auth.vue       # Layout halaman login
│   │   └── default.vue    # Layout publik (landing page)
│   ├── pages/
│   │   ├── index.vue          # Landing page publik
│   │   ├── login.vue          # Halaman login
│   │   ├── super-admin/       # Panel Super Admin & Admin
│   │   ├── teacher/           # Portal Guru
│   │   └── student/           # Portal Siswa
│   ├── middleware/            # Auth & Role middleware
│   └── stores/                # Pinia stores (authStore)
├── server/
│   ├── api/               # REST API endpoints (Nitro)
│   │   ├── auth/          # Login, Logout, Me
│   │   ├── users/         # CRUD Users
│   │   ├── teachers/      # CRUD Guru
│   │   ├── students/      # CRUD Siswa + export CSV
│   │   ├── classes/       # CRUD Kelas
│   │   ├── semesters/     # CRUD Semester
│   │   ├── subjects/      # CRUD Mata Pelajaran
│   │   ├── academic-years/# CRUD Tahun Ajaran
│   │   ├── teaching-assignments/ # Penugasan Mengajar
│   │   ├── student-classes/      # Pembagian Rombel
│   │   ├── homerooms/     # Wali Kelas
│   │   ├── grades/        # Nilai (GradeItem, GradeComponent, Inspection)
│   │   ├── moodle/        # Integrasi Moodle (sync, export, password)
│   │   ├── settings/      # Pengaturan Sistem
│   │   └── dashboard/     # Data dashboard summary
│   └── utils/
│       ├── auth.ts        # JWT & auth utilities
│       ├── db.ts          # Prisma client instance
│       └── moodle.ts      # Moodle REST API service
├── prisma/
│   ├── schema.prisma      # Definisi schema database
│   └── migrations/        # Migration files
├── scripts/
│   ├── create-super-admin.ts  # Script buat akun super admin
│   └── test-database.ts       # Script uji koneksi DB
├── content/               # Konten landing page (Nuxt Content)
├── public/                # Aset statis (logo, favicon, dll)
├── .env.example           # Template environment variables
├── nuxt.config.ts         # Konfigurasi Nuxt
├── package.json
└── README.md
```

---

## 🔒 Keamanan

- Autentikasi menggunakan **JWT** yang disimpan di **HTTPOnly Cookie** (aman dari XSS)
- Password di-hash dengan **bcryptjs**
- Setiap endpoint API dilindungi dengan `requireRole()` — role checking server-side
- CORS dikonfigurasi pada level Nuxt server

---

## 📦 Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | Nuxt 4, Vue 3, Nuxt UI v4, TailwindCSS 4 |
| **Backend** | Nitro (Nuxt server), REST API |
| **Database** | PostgreSQL + Prisma ORM |
| **Autentikasi** | JWT (HTTPOnly Cookie) + bcryptjs |
| **State Management** | Pinia |
| **Integrasi LMS** | Moodle REST API |
| **Icons** | Lucide Icons, Simple Icons |
| **Package Manager** | pnpm |

---

## 🧩 Formula Nilai Akhir

Sistem menggunakan formula penilaian baku:

```
Nilai Akhir = (50% × Rata-rata PH) + (25% × STS) + (25% × SAS)
```

- **PH** (Penilaian Harian) — Bisa lebih dari satu, diambil rata-ratanya
- **STS** (Sumatif Tengah Semester) — Satu nilai per semester
- **SAS** (Sumatif Akhir Semester) — Satu nilai per semester
- Semua nilai dibulatkan ke bilangan bulat terdekat

---

## 📱 Akses Moodle Siswa (Dual Mode Password)

Sebelum ujian STS/SAS, admin dapat mengganti mode password Moodle siswa:

| Mode | Format Password | Contoh |
|---|---|---|
| **Harian** | `Bilie#` + NIS | `Bilie#20240001` |
| **Ujian STS/SAS** | `Bilie#` + 6 angka acak | `Bilie#892301` |

Setelah ujian selesai, password dikembalikan ke mode Harian.  
Daftar username & password bisa diunduh sebagai file **CSV** untuk dibagikan ke siswa.

---

## 🤝 Kontribusi

1. Fork repository ini
2. Buat branch fitur: `git checkout -b feature/nama-fitur`
3. Commit perubahan: `git commit -m 'feat: tambah fitur X'`
4. Push ke branch: `git push origin feature/nama-fitur`
5. Buat Pull Request

---

## 📄 Lisensi

[MIT License](LICENSE) — Bebas digunakan untuk keperluan pendidikan.

---

<p align="center">
  Made with ❤️ for Indonesian Schools
</p>
