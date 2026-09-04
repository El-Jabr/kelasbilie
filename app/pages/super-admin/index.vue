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
  activeYear: null as Record<string, unknown> | null,
  activeSemester: null as Record<string, unknown> | null,
  recentLogs: [] as { id: string, resource?: string, action?: string, syncedAt?: string, status?: string, message?: string }[]
})

async function loadDashboardStats() {
  pending.value = true
  try {
    const res = await $fetch<{ data?: typeof stats.value }>('/api/dashboard/stats', {
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

const teacherProgress = ref<any[]>([])
const loadingProgress = ref(true)
const progressFilter = ref('all')

const filteredProgress = computed(() => {
  if (progressFilter.value === 'incomplete') {
    return teacherProgress.value.filter(t => t.percent < 100)
  }
  return teacherProgress.value
})

async function loadTeacherProgress() {
  loadingProgress.value = true
  try {
    const res = await $fetch<any[]>('/api/progress/all-teachers', {
      credentials: 'include'
    })
    teacherProgress.value = res || []
  } catch (err) {
    console.error('Gagal memuat teacher progress:', err)
  } finally {
    loadingProgress.value = false
  }
}

onMounted(() => {
  loadDashboardStats()
  loadTeacherProgress()
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
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total User
            </p>
            <p class="text-2xl font-bold mt-1">
              <span
                v-if="pending"
                class="text-gray-300 animate-pulse"
              >...</span>
              <span v-else>{{ stats.totalUsers }}</span>
            </p>
          </div>
          <div class="p-3 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
            <UIcon
              name="i-lucide-users"
              class="w-6 h-6"
            />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Guru
            </p>
            <p class="text-2xl font-bold mt-1">
              <span
                v-if="pending"
                class="text-gray-300 animate-pulse"
              >...</span>
              <span v-else>{{ stats.totalTeachers }}</span>
            </p>
          </div>
          <div class="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <UIcon
              name="i-lucide-user-check"
              class="w-6 h-6"
            />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Siswa
            </p>
            <p class="text-2xl font-bold mt-1">
              <span
                v-if="pending"
                class="text-gray-300 animate-pulse"
              >...</span>
              <span v-else>{{ stats.totalStudents }}</span>
            </p>
          </div>
          <div class="p-3 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-xl">
            <UIcon
              name="i-lucide-graduation-cap"
              class="w-6 h-6"
            />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Total Kelas
            </p>
            <p class="text-2xl font-bold mt-1">
              <span
                v-if="pending"
                class="text-gray-300 animate-pulse"
              >...</span>
              <span v-else>{{ stats.totalClasses }}</span>
            </p>
          </div>
          <div class="p-3 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-xl">
            <UIcon
              name="i-lucide-building-2"
              class="w-6 h-6"
            />
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
            <UIcon
              name="i-lucide-calendar-days"
              class="w-5 h-5 text-primary-500"
            />
            <span>Status Akademik Aktif</span>
          </div>
        </template>

        <div class="space-y-4">
          <div>
            <span class="text-xs text-gray-400 block">Tahun Ajaran Aktif</span>
            <div class="flex items-center justify-between mt-1">
              <span class="font-medium text-base">{{ stats.activeYear?.name || 'Belum diatur' }}</span>
              <UBadge
                v-if="stats.activeYear"
                color="success"
                variant="subtle"
              >
                Aktif
              </UBadge>
              <UBadge
                v-else
                color="neutral"
                variant="subtle"
              >
                Nonaktif
              </UBadge>
            </div>
          </div>

          <USeparator />

          <div>
            <span class="text-xs text-gray-400 block">Semester Aktif</span>
            <div class="flex items-center justify-between mt-1">
              <span class="font-medium text-base">{{ stats.activeSemester?.type || 'Belum diatur' }}</span>
              <UBadge
                v-if="stats.activeSemester"
                color="success"
                variant="subtle"
              >
                Aktif
              </UBadge>
              <UBadge
                v-else
                color="neutral"
                variant="subtle"
              >
                Nonaktif
              </UBadge>
            </div>
          </div>
        </div>

        <template #footer>
          <NuxtLink to="/super-admin/akademik/kalender">
            <UButton
              block
              color="neutral"
              variant="ghost"
              icon="i-lucide-external-link"
            >
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
              <UIcon
                name="i-lucide-refresh-cw"
                class="w-5 h-5 text-primary-500"
              />
              <span>Aktivitas Sinkronisasi Moodle Terbaru</span>
            </div>
            <NuxtLink to="/super-admin/moodle/sinkronisasi">
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
              >Lihat Semua</UButton>
            </NuxtLink>
          </div>
        </template>

        <div
          v-if="pending"
          class="py-8 text-center text-sm text-gray-400"
        >
          Memuat aktivitas sinkronisasi...
        </div>

        <div
          v-else-if="stats.recentLogs.length === 0"
          class="py-8 text-center text-sm text-gray-400"
        >
          Belum ada riwayat sinkronisasi.
        </div>

        <div
          v-else
          class="divide-y divide-gray-100 dark:divide-gray-800"
        >
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
              {{ new Date(log.syncedAt || '').toLocaleString('id-ID') }}
            </span>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Teacher Progress Section -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 font-semibold">
            <UIcon name="i-lucide-bar-chart" class="w-5 h-5 text-primary-500" />
            <span>Kelengkapan Penilaian Guru</span>
          </div>
          <USelect
            v-model="progressFilter"
            :items="[{label:'Semua Guru', value:'all'}, {label:'Belum Selesai', value:'incomplete'}]"
            class="w-40"
            value-key="value"
            label-key="label"
          />
        </div>
      </template>

      <div v-if="loadingProgress" class="py-8 text-center text-sm text-gray-400">
        Memuat progress penilaian...
      </div>
      
      <div v-else-if="filteredProgress.length === 0" class="py-8 text-center text-sm text-gray-400">
        Tidak ada data progress guru ditemukan.
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm text-left">
          <thead class="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-4 py-3">Nama Guru</th>
              <th class="px-4 py-3">NIP</th>
              <th class="px-4 py-3">Progress</th>
              <th class="px-4 py-3">Detail</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-for="teacher in filteredProgress" :key="teacher.teacherId" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ teacher.name }}</td>
              <td class="px-4 py-3 text-gray-500 font-mono">{{ teacher.nip }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 max-w-32">
                    <div class="h-2.5 rounded-full" :class="teacher.percent === 100 ? 'bg-success-500' : 'bg-primary-500'" :style="`width: ${teacher.percent}%`"></div>
                  </div>
                  <span class="text-xs font-medium" :class="teacher.percent === 100 ? 'text-success-600' : 'text-gray-500'">{{ teacher.percent }}%</span>
                </div>
              </td>
              <td class="px-4 py-3 text-xs text-gray-500">
                {{ teacher.totalFilled }} / {{ teacher.totalExpected }} nilai terisi
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
