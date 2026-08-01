<script setup lang="ts">
useSeoMeta({
  title: 'Platform LMS & Sistem Informasi Sekolah',
  description: 'Sistem Informasi Manajemen Sekolah Terintegrasi Moodle LMS, Manajemen Nilai PH, STS, SAS, dan Rapor Akademik.',
  ogTitle: 'Kelasbilie - Platform LMS & Sistem Informasi Sekolah',
  ogDescription: 'Sistem Informasi Manajemen Sekolah Terintegrasi Moodle LMS, Manajemen Nilai PH, STS, SAS, dan Rapor Akademik.',
  ogImage: 'https://images.bilter.my.id/kelasbilie.png'
})
</script>

<template>
  <div class="min-h-screen bg-slate-900 text-white flex flex-col justify-between relative overflow-hidden">
    <!-- Background Elements -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/40 via-slate-900 to-slate-950 pointer-events-none" />

    <!-- Header Navigation -->
    <header class="relative z-10 container mx-auto px-6 py-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-500 to-primary-700 flex items-center justify-center font-black text-xl shadow-lg shadow-primary-500/20">
          K
        </div>
        <span class="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
          Kelasbilie
        </span>
      </div>

      <div class="flex items-center gap-4">
        <UButton
          to="/login"
          color="primary"
          variant="solid"
          size="md"
          icon="i-lucide-log-in"
          label="Masuk ke Sistem"
          class="font-semibold cursor-pointer shadow-md hover:shadow-primary-500/20"
        />
      </div>
    </header>

    <!-- Main Hero Content -->
    <main class="relative z-10 container mx-auto px-6 py-12 md:py-20 flex flex-col items-center text-center max-w-4xl">
      <UBadge color="primary" variant="subtle" size="md" class="mb-6 px-4 py-1.5 rounded-full font-bold uppercase tracking-wider text-xs border border-primary-500/30">
        ✨ Integrated Moodle LMS & Academic Portal
      </UBadge>

      <h1 class="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-3xl">
        Sistem Informasi Sekolah & Sync Nilai Moodle <span class="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 via-teal-300 to-emerald-400">Tanpa Hambatan</span>
      </h1>

      <p class="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed">
        Platform manajemen akademik terpadu untuk siswa, guru, dan admin sekolah. Sinkronisasi nilai PH, STS, SAS per course Moodle dengan cepat dan akurat.
      </p>

      <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
        <UButton
          to="/login"
          color="primary"
          size="xl"
          icon="i-lucide-arrow-right"
          trailing
          label="Mulai Sekarang"
          class="w-full sm:w-auto px-8 py-3.5 text-base font-bold shadow-xl shadow-primary-600/30 cursor-pointer"
        />
      </div>

      <!-- Feature Grid Highlights -->
      <div class="mt-16 sm:mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left">
        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-2xl p-6 hover:border-primary-500/50 transition-colors">
          <div class="p-3 bg-primary-500/10 text-primary-400 rounded-xl w-fit mb-4 border border-primary-500/20">
            <UIcon name="i-lucide-zap" class="w-6 h-6" />
          </div>
          <h3 class="text-lg font-bold text-white mb-1">Sync Per-Course Cepat</h3>
          <p class="text-sm text-slate-400 leading-relaxed">
            Sinkronisasi nilai Moodle per mata pelajaran dalam 2-5 detik tanpa perlu menunggu antrean global.
          </p>
        </div>

        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-2xl p-6 hover:border-primary-500/50 transition-colors">
          <div class="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-fit mb-4 border border-teal-500/20">
            <UIcon name="i-lucide-users" class="w-6 h-6" />
          </div>
          <h3 class="text-lg font-bold text-white mb-1">Multi-Role Portal</h3>
          <p class="text-sm text-slate-400 leading-relaxed">
            Akses khusus role Super Admin, Guru Pengampu, Wali Kelas, dan Portal Rekapitulasi Nilai Siswa.
          </p>
        </div>

        <div class="bg-slate-800/50 backdrop-blur border border-slate-700/60 rounded-2xl p-6 hover:border-primary-500/50 transition-colors">
          <div class="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-4 border border-emerald-500/20">
            <UIcon name="i-lucide-bar-chart-3" class="w-6 h-6" />
          </div>
          <h3 class="text-lg font-bold text-white mb-1">Rekap Nilai Otomatis</h3>
          <p class="text-sm text-slate-400 leading-relaxed">
            Perhitungan otomatis bobot nilai PH (50%), STS (25%), SAS (25%), dan rincian per komponen.
          </p>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="relative z-10 border-t border-slate-800 py-6 text-center text-xs text-slate-500">
      &copy; {{ new Date().getFullYear() }} Kelasbilie. All rights reserved.
    </footer>
  </div>
</template>
