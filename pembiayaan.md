# 💰 Rincian Biaya Development & Operasional — KelasBilie

Dokumen ini berisi rincian estimasi biaya pembuatan (*Development Cost*) dan biaya penggunaan/operasional berjalan (*Operational / Running Cost*) untuk aplikasi **KelasBilie** (Sistem Manajemen Akademik Sekolah & Pesantren Terintegrasi Moodle LMS & AI Gemini).

---

## 🛠️ 1. Rincian Biaya Development (Investasi Awal / One-Time Cost)

Biaya *development* adalah estimasi biaya pembuatan dan pengembangan awal aplikasi dari nol hingga siap pakai di lingkungan produksi (*production-ready*).

| Komponen Fitur / Modul | Deskripsi Pekerjaan | Estimasi Biaya (IDR) |
|---|---|---|
| **UI/UX Design & Architecture** | Perancangan *wireframe*, antarmuka pengguna (Nuxt UI v4), dan arsitektur database (Prisma + PostgreSQL) | Rp 7.500.000 – Rp 10.000.000 |
| **Frontend & Portal Pengguna** | Pengembangan 4 Portal Pengguna: Super Admin, Admin, Guru, dan Siswa berbasis Nuxt 4 & TailwindCSS 4 | Rp 20.000.000 – Rp 30.000.000 |
| **Backend & Engine Penilaian** | Pengembangan REST API Nitro, kalkulasi otomatis nilai akhir (50% PH + 25% STS + 25% SAS), KKM mapel, dan rombel | Rp 20.000.000 – Rp 25.000.000 |
| **Integrasi Moodle LMS** | Integrasi Moodle REST API, sinkronisasi nilai otomatis, ekspor user, auto-enrollment, dan *Dual Password System* (Harian vs Ujian) | Rp 15.000.000 – Rp 20.000.000 |
| **Integrasi Kecerdasan Buatan (AI Gemini)** | Prompt engineering, konteks sekolah/pesantren (istilah *Murobbi*, *Tahfidz*), analisis performa siswa & kelas, serta sistem *caching* | Rp 10.000.000 – Rp 15.000.000 |
| **Quality Assurance & Unit Testing** | Pembuatan 57 skenario *unit test* otomatis (Vitest) untuk memastikan kestabilan 100% seluruh API backend | Rp 7.500.000 – Rp 10.000.000 |
| **Setup Server & Deployment** | Konfigurasi server Linux/Nginx, SSL HTTPS, environment produksi, dan pembuatan akun Super Admin pertama | Rp 5.000.000 – Rp 7.500.000 |

### 📊 Total Investasi Development Awal:
> **Rp 85.000.000 – Rp 117.500.000** *(Dibayarkan 1x di awal proyek)*

---

## ⚡ 2. Rincian Biaya Operasional / Penggunaan Berjalan (Running Cost)

Biaya operasional adalah biaya berkala (bulanan/tahunan) yang diperlukan agar aplikasi tetap aktif, aman, dan dapat diakses oleh seluruh guru, siswa, dan pengelola sekolah.

### 🌐 A. Infrastructure & Hosting

| Komponen | Spesifikasi / Kebutuhan | Estimasi Bulanan | Estimasi Tahunan |
|---|---|---|---|
| **Server VPS Main App & Moodle** | VPS 4 vCPU / 8 GB RAM / 100 GB SSD (Cloud Provider: Biznet Gio / Hetzner / DigitalOcean) | Rp 450.000 – Rp 750.000 | Rp 5.400.000 – Rp 9.000.000 |
| **Database Managed PostgreSQL** | PostgreSQL Database Server (Storage & Backup Otomatis) | Rp 300.000 – Rp 500.000 | Rp 3.600.000 – Rp 6.000.000 |
| **Nama Domain & SSL** | Domain Resmi Sekolah (`.sch.id` atau `.id`) + Sertifikat Keamanan SSL (Let's Encrypt) | - | Rp 150.000 – Rp 250.000 |

### 🤖 B. API Service & Maintenance

| Komponen | Spesifikasi / Kebutuhan | Estimasi Bulanan | Estimasi Tahunan |
|---|---|---|---|
| **Google Gemini AI API** | Kuota API Analisis AI (Gratis hingga 1.500 request/hari. Jika melampaui kuota gratis *pay-as-you-go*) | Rp 0 – Rp 250.000 | Rp 0 – Rp 3.000.000 |
| **Maintenance & Security Support** | *Backup* data harian otomatis, pembaruan keamanan, perbaikan bug minor, dan monitoring server | Rp 750.000 – Rp 1.500.000 | Rp 9.000.000 – Rp 18.000.000 |

### 📊 Total Biaya Operasional Berjalan:
- **Estimasi Per Bulan**: **Rp 1.500.000 – Rp 3.000.000 / bulan**
- **Estimasi Per Tahun**: **Rp 18.150.000 – Rp 36.250.000 / tahun**

---

## 🏫 3. Opsi Skema Pembiayaan Alternatif (SaaS / Per Siswa)

Jika aplikasi ini ingin ditawarkan dalam bentuk **Layanan Berlangganan (SaaS / Software-as-a-Service)** untuk sekolah atau pesantren tanpa biaya pembuatan di awal, berikut rekomendasi skema pembiayaannya:

### Option A: Skema Berlangganan Per Sekolah (Flat Monthly Fee)
* **Sekolah Kecil (< 200 Siswa)**: Rp 1.500.000 / bulan
* **Sekolah Menengah (200 – 600 Siswa)**: Rp 2.500.000 / bulan
* **Pesantren / Sekolah Besar (> 600 Siswa)**: Rp 4.000.000 / bulan

### Option B: Skema Iuran Per Siswa (Per-Student Fee)
* **Rp 5.000 – Rp 10.000 / siswa / bulan**  
  *(Sudah mencakup penggunaan Moodle LMS, fitur Analisis AI Gemini, hosting server, dan pemeliharaan sistem)*.

---

## 📌 Kesimpulan & Rekomendasi
1. **Untuk Penggunaan Mandiri Sekolah**: Investasi pembuatan aplikasi berkisar **Rp 85 Juta – Rp 117 Juta** (sekali saja), dengan biaya pemeliharaan server berkisar **Rp 1,5 Juta – Rp 3 Juta / bulan**.
2. **Efisiensi AI**: Penggunaan Google Gemini AI sangat efisien karena memanfaatkan model `gemini-flash-latest` dengan kuota gratis harian yang cukup untuk skala sekolah menengah.
