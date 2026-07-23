<script setup lang="ts">
const footerData = {
  schoolName: 'SMP Bilingual Terpadu 2 (BILIE)',
  pesantren: 'Pesantren Modern Al-Amanah Junwangi',
  description: 'Sekolah Berbasis Pesantren dengan Pendidikan 24 Jam di bawah naungan Pesantren Modern Al-Amanah Junwangi.',
  address: 'Jl. Junwangi No. 43C, Krian, Sidoarjo',
  contact: '0813-9995-2020',
  email: 'humas@smpbilingualterpadu2.sch.id',
  website: 'smpbilingualterpadu2.sch.id'
}
</script>

<template>
  <footer class="bg-gray-900 text-gray-300 py-12 border-t border-gray-800 mt-16">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Kolom 1: Branding & Deskripsi -->
        <div>
          <div class="flex items-center gap-3 mb-4">
            <img
              src="/logo.png"
              alt="SMP BILIE Logo"
              class="h-10 w-auto shrink-0 bg-white/10 p-1 rounded-lg"
            />
            <h3 class="text-lg font-bold text-white leading-tight">
              {{ footerData.schoolName }}
            </h3>
          </div>
          <p class="text-sm text-gray-400 leading-relaxed">
            {{ footerData.description }}
          </p>
        </div>

        <!-- Kolom 2: Informasi & Kontak -->
        <div>
          <h4 class="text-base font-semibold text-white mb-4">Informasi Kontak</h4>
          <ul class="space-y-2.5 text-sm">
            <li class="flex items-start gap-2.5">
              <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span class="text-gray-300">{{ footerData.address }}</span>
            </li>
            <li class="flex items-center gap-2.5">
              <UIcon name="i-lucide-phone" class="w-4 h-4 text-emerald-500 shrink-0" />
              <span class="text-gray-300">Telp/WA: {{ footerData.contact }}</span>
            </li>
            <li class="flex items-center gap-2.5">
              <UIcon name="i-lucide-mail" class="w-4 h-4 text-emerald-500 shrink-0" />
              <span class="text-gray-300">{{ footerData.email }}</span>
            </li>
            <li class="flex items-center gap-2.5">
              <UIcon name="i-lucide-globe" class="w-4 h-4 text-emerald-500 shrink-0" />
              <a :href="`https://${footerData.website}`" target="_blank" class="hover:underline text-emerald-400">
                {{ footerData.website }}
              </a>
            </li>
          </ul>
        </div>

        <!-- Kolom 3: Portal & Sosial Media -->
        <div>
          <h4 class="text-base font-semibold text-white mb-4">Akses Sistem & Medsos</h4>
          <p class="text-sm text-gray-400 mb-4">
            Portal Sistem Informasi Manajemen Akademik dan Pembelajaran Kelasbilie.
          </p>
          <div class="flex flex-wrap gap-2 mb-4">
            <UButton to="/login" color="primary" size="sm">Login Sistem</UButton>
          </div>
          <div class="flex items-center gap-2">
            <UButton
              to="https://www.instagram.com/smp_bilie"
              target="_blank"
              icon="i-simple-icons-instagram"
              aria-label="Instagram"
              color="neutral"
              variant="ghost"
              size="xs"
            />
            <UButton
              to="https://www.tiktok.com/@smp_bilie"
              target="_blank"
              icon="i-simple-icons-tiktok"
              aria-label="TikTok"
              color="neutral"
              variant="ghost"
              size="xs"
            />
            <UButton
              to="https://www.youtube.com/@smp_bilie"
              target="_blank"
              icon="i-simple-icons-youtube"
              aria-label="YouTube"
              color="neutral"
              variant="ghost"
              size="xs"
            />
          </div>
        </div>
      </div>

      <div class="border-t border-gray-800 mt-8 pt-8 text-center text-xs text-gray-500">
        &copy; {{ new Date().getFullYear() }} {{ footerData.schoolName }}. All rights reserved.
      </div>
    </div>
  </footer>
</template>
