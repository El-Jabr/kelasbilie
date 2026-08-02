<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Dashboard Super Admin'
})

const pending = ref(true)
const stats = ref({
  totalUsers: 0,
  totalTeachers: 0,
  totalStudents: 0,
  totalClasses: 0,
  activeYear: null as any,
  activeSemester: null as any,
  recentLogs: [] as any[]
})

async function loadDashboardStats() {
  pending.value = true
  try {
    const res: any = await $fetch('/api/dashboard/stats', {
      credentials: 'include'
    })
    if (res?.data) {
      stats.value = res.data
    }
  } catch (err) {
    console.error('Gagal memuat stats dashboard:', err)
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  loadDashboardStats()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Top Header Title -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          Dashboard Utama
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Selamat datang di Sistem Informasi Manajemen Akademik Kelas Bilie.
        </p>
      </div>

      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="ghost"
        size="sm"
        class="cursor-pointer"
        :loading="pending"
        @click="loadDashboardStats"
      />
    </div>

    <!-- Stat Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total User</p>
            <p class="text-2xl font-bold mt-1">
              <span v-if="pending" class="text-gray-300 animate-pulse">...</span>
              <span v-else>{{ stats.totalUsers }}</span>
            </p>
          </div>
          <div class="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
            <UIcon name="i-lucide-users" class="w-6 h-6" />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Guru</p>
            <p class="text-2xl font-bold mt-1">
              <span v-if="pending" class="text-gray-300 animate-pulse">...</span>
              <span v-else>{{ stats.totalTeachers }}</span>
            </p>
          </div>
          <div class="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <UIcon name="i-lucide-user-check" class="w-6 h-6" />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Siswa</p>
            <p class="text-2xl font-bold mt-1">
              <span v-if="pending" class="text-gray-300 animate-pulse">...</span>
              <span v-else>{{ stats.totalStudents }}</span>
            </p>
          </div>
          <div class="p-3 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-xl">
            <UIcon name="i-lucide-graduation-cap" class="w-6 h-6" />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Kelas</p>
            <p class="text-2xl font-bold mt-1">
              <span v-if="pending" class="text-gray-300 animate-pulse">...</span>
              <span v-else>{{ stats.totalClasses }}</span>
            </p>
          </div>
          <div class="p-3 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl">
            <UIcon name="i-lucide-building-2" class="w-6 h-6" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Info Sections Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Active Academic Context -->
      <UCard class="lg:col-span-1">
        <template #header>
          <div class="flex items-center gap-2 font-semibold">
            <UIcon name="i-lucide-calendar-days" class="w-5 h-5 text-primary-500" />
            <span>Status Akademik Aktif</span>
          </div>
        </template>

        <div class="space-y-4">
          <div>
            <span class="text-xs text-gray-400 block">Tahun Ajaran Aktif</span>
            <div class="flex items-center justify-between mt-1">
              <span class="font-medium text-base">{{ stats.activeYear?.name || 'Belum diatur' }}</span>
              <UBadge v-if="stats.activeYear" color="success" variant="subtle">Aktif</UBadge>
              <UBadge v-else color="neutral" variant="subtle">Nonaktif</UBadge>
            </div>
          </div>

          <USeparator />

          <div>
            <span class="text-xs text-gray-400 block">Semester Aktif</span>
            <div class="flex items-center justify-between mt-1">
              <span class="font-medium text-base">{{ stats.activeSemester?.type || 'Belum diatur' }}</span>
              <UBadge v-if="stats.activeSemester" color="success" variant="subtle">Aktif</UBadge>
              <UBadge v-else color="neutral" variant="subtle">Nonaktif</UBadge>
            </div>
          </div>
        </div>

        <template #footer>
          <NuxtLink to="/super-admin/akademik/tahun-ajaran">
            <UButton block color="neutral" variant="ghost" icon="i-lucide-external-link">
              Kelola Akademik
            </UButton>
          </NuxtLink>
        </template>
      </UCard>

      <!-- Sync Logs Summary -->
      <UCard class="lg:col-span-2">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 font-semibold">
              <UIcon name="i-lucide-refresh-cw" class="w-5 h-5 text-primary-500" />
              <span>Aktivitas Sinkronisasi Moodle Terbaru</span>
            </div>
            <NuxtLink to="/super-admin/moodle/sinkronisasi">
              <UButton size="xs" color="neutral" variant="ghost">Lihat Semua</UButton>
            </NuxtLink>
          </div>
        </template>

        <div v-if="pending" class="py-8 text-center text-sm text-gray-400">
          Memuat aktivitas sinkronisasi...
        </div>

        <div v-else-if="stats.recentLogs.length === 0" class="py-8 text-center text-sm text-gray-400">
          Belum ada riwayat sinkronisasi.
        </div>

        <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <div
            v-for="log in stats.recentLogs"
            :key="log.id"
            class="py-3 flex items-center justify-between text-sm"
          >
            <div class="flex items-center gap-3">
              <UBadge
                :color="log.status === 'SUCCESS' ? 'success' : 'error'"
                variant="subtle"
                size="xs"
              >
                {{ log.resource }}
              </UBadge>
              <span class="text-gray-700 dark:text-gray-300 font-medium truncate max-w-xs md:max-w-md">
                {{ log.message }}
              </span>
            </div>
            <span class="text-xs text-gray-400 flex-shrink-0">
              {{ new Date(log.syncedAt).toLocaleString('id-ID') }}
            </span>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
