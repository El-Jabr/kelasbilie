<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Dashboard Super Admin'
})

const { data: usersData, pending: pendingUsers } = await useFetch('/api/users')
const { data: teachersData } = await useFetch('/api/teachers')
const { data: studentsData } = await useFetch('/api/students')
const { data: classesData } = await useFetch('/api/classes')
const { data: yearsData } = await useFetch('/api/academic-years')
const { data: semData } = await useFetch('/api/semesters')
const { data: logsData } = await useFetch('/api/moodle/logs?limit=5')

const totalUsers = computed(() => usersData.value?.data?.length || 0)
const totalTeachers = computed(() => teachersData.value?.data?.length || 0)
const totalStudents = computed(() => studentsData.value?.data?.length || 0)
const totalClasses = computed(() => classesData.value?.data?.length || 0)

const activeYear = computed(() => yearsData.value?.data?.find((y: any) => y.isActive))
const activeSemester = computed(() => semData.value?.data?.find((s: any) => s.isActive))
const recentLogs = computed(() => logsData.value?.data || [])
</script>

<template>
  <div class="space-y-6">
    <!-- Top Header Title -->
    <div>
      <h1 class="text-2xl font-bold tracking-tight">
        Dashboard Utama
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Selamat datang di Sistem Informasi Manajemen Akademik Kelasbilie.
      </p>
    </div>

    <!-- Stat Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total User</p>
            <p class="text-2xl font-bold mt-1">{{ totalUsers }}</p>
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
            <p class="text-2xl font-bold mt-1">{{ totalTeachers }}</p>
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
            <p class="text-2xl font-bold mt-1">{{ totalStudents }}</p>
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
            <p class="text-2xl font-bold mt-1">{{ totalClasses }}</p>
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
              <span class="font-medium text-base">{{ activeYear?.name || 'Belum diatur' }}</span>
              <UBadge v-if="activeYear" color="success" variant="subtle">Aktif</UBadge>
              <UBadge v-else color="neutral" variant="subtle">Nonaktif</UBadge>
            </div>
          </div>

          <UDivider />

          <div>
            <span class="text-xs text-gray-400 block">Semester Aktif</span>
            <div class="flex items-center justify-between mt-1">
              <span class="font-medium text-base">{{ activeSemester?.type || 'Belum diatur' }}</span>
              <UBadge v-if="activeSemester" color="success" variant="subtle">Aktif</UBadge>
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

        <div v-if="recentLogs.length === 0" class="py-8 text-center text-sm text-gray-400">
          Belum ada riwayat sinkronisasi.
        </div>

        <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
          <div
            v-for="log in recentLogs"
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
