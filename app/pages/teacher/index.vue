<script setup lang="ts">
definePageMeta({
  layout: 'teacher',
  middleware: ['auth', 'role'],
  role: ['TEACHER', 'ADMIN', 'SUPER_ADMIN']
})

useSeoMeta({
  title: 'Dashboard Guru'
})

import { storeToRefs } from 'pinia'
import { useTeacherStore } from '~~/app/stores/teacher'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

const teacherStore = useTeacherStore()
const { teacherProfile, activeSemester, progressData, isLoading: pending } = storeToRefs(teacherStore)

onMounted(() => {
  teacherStore.fetchTeacherData()
})

const assignments = computed(() => {
  const teachings = teacherProfile.value?.teachings ?? []
  if (!teachings.length) return []
  // Prefer active semester teachings if active semester exists
  const activeSemId = activeSemester.value?.id
  if (activeSemId) {
    const matched = teachings.filter((t: any) => t.semesterId === activeSemId || t.semester?.isActive)
    if (matched.length) return matched
  }
  return teachings
})

// Search filter for teaching assignments
const searchClass = ref('')

const filteredAssignments = computed(() => {
  let list = assignments.value
  if (searchClass.value.trim()) {
    const q = searchClass.value.toLowerCase().trim()
    list = list.filter((item: any) =>
      item.subject?.name?.toLowerCase().includes(q) ||
      item.subject?.code?.toLowerCase().includes(q) ||
      item.classroom?.name?.toLowerCase().includes(q) ||
      String(item.classroom?.level).includes(q)
    )
  }
  return list
})

function getProgress(teachingId: string) {
  return progressData.value?.items?.find((i: any) => i.teachingId === teachingId)
}

const isRefreshing = ref(false)
const toast = useToast()

async function handleRefresh() {
  isRefreshing.value = true
  try {
    await teacherStore.fetchTeacherData(true)
    toast.add({
      title: 'Data Diperbarui',
      description: 'Data penugasan mengajar berhasil dimuat ulang.',
      color: 'success'
    })
  } catch (err: any) {
    toast.add({
      title: 'Gagal Memperbarui',
      description: err?.message || 'Terjadi kesalahan saat memuat ulang data.',
      color: 'error'
    })
  } finally {
    isRefreshing.value = false
  }
}

function resetSearch() {
  searchClass.value = ''
}
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome Banner -->
    <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 text-white shadow-lg">
      <div class="relative z-10 space-y-2">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-emerald-100 border border-white/20 shadow-sm">
          <UIcon name="i-lucide-sparkles" class="w-3.5 h-3.5 text-amber-300" />
          <span>Portal Pengajar • Kelas Bilie</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Selamat Datang, {{ user?.fullname || 'Bapak/Ibu Guru' }}! 👋
        </h1>
        <p class="text-xs sm:text-sm text-emerald-100/90 max-w-2xl leading-relaxed">
          Kelola penugasan mengajar, input nilai harian, STS, SAS, serta pantau progres penilaian kelas Anda dengan mudah.
        </p>
      </div>

      <!-- Decorative ambient shapes -->
      <div class="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div class="absolute right-40 -top-10 w-48 h-48 rounded-full bg-emerald-400/15 blur-xl pointer-events-none" />
    </div>

    <!-- Active Semester Bar -->
    <div v-if="activeSemester" class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-500/20 text-xs">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm shadow-emerald-500/30 shrink-0">
          <UIcon name="i-lucide-calendar" class="w-4 h-4" />
        </div>
        <div>
          <p class="font-bold text-gray-900 dark:text-white text-sm">
            Tahun Ajaran {{ activeSemester.academicYear?.name }} — {{ activeSemester.type }}
          </p>
          <p class="text-gray-500 dark:text-gray-400 text-xs">
            Semester Aktif Sistem Akademik
          </p>
        </div>
      </div>

      <UBadge color="success" variant="subtle" size="sm" class="font-bold font-mono tracking-wide px-2.5 py-1">
        SEMESTER AKTIF
      </UBadge>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-4 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/70 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Penugasan Mengajar</p>
          <p class="text-2xl font-black text-gray-900 dark:text-white mt-1">{{ assignments.length }}</p>
          <p class="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold">Kelas Aktif</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
          <UIcon name="i-lucide-book-open" class="w-6 h-6" />
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/70 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Progres Penilaian</p>
          <p class="text-2xl font-black text-gray-900 dark:text-white mt-1">{{ progressData?.overallPercent ?? 0 }}%</p>
          <p class="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 font-semibold">Semua Kelas</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
          <UIcon name="i-lucide-pie-chart" class="w-6 h-6" />
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/70 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">NIP Pengajar</p>
          <p class="text-lg font-bold font-mono text-gray-900 dark:text-white mt-1">{{ teacherProfile?.nip || '-' }}</p>
          <p class="text-[11px] text-gray-400 mt-0.5">Identitas Pegawai</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40">
          <UIcon name="i-lucide-badge-check" class="w-6 h-6" />
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/70 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Status Akun</p>
          <p class="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">Aktif</p>
          <p class="text-[11px] text-gray-400 mt-0.5 font-mono">Role: {{ user?.role }}</p>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40">
          <UIcon name="i-lucide-user-check" class="w-6 h-6" />
        </div>
      </div>
    </div>

    <!-- Classes Section -->
    <div class="space-y-4">
      <!-- Section Header with Search Toolbar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <UIcon name="i-lucide-layers" class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white leading-none">
              Daftar Penugasan Mengajar
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Kelas dan mata pelajaran yang Anda ampu pada semester ini
            </p>
          </div>
          <UBadge color="neutral" variant="subtle" size="sm" class="font-mono font-bold ml-1">
            {{ assignments.length }} Kelas
          </UBadge>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto">
          <UInput
            v-if="assignments.length > 2"
            v-model="searchClass"
            icon="i-lucide-search"
            placeholder="Cari mapel atau kelas..."
            class="w-full sm:w-64"
            size="sm"
          />
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="outline"
            size="sm"
            :loading="isRefreshing"
            class="cursor-pointer shrink-0"
            title="Muat ulang data penugasan"
            @click="handleRefresh"
          >
            Refresh
          </UButton>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="py-16 text-center space-y-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
        <p class="text-sm font-medium text-gray-600 dark:text-gray-300">Memuat data penugasan kelas...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="!assignments.length" class="py-16 text-center bg-white dark:bg-gray-800/60 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
        <div class="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mx-auto mb-3">
          <UIcon name="i-lucide-folder-open" class="w-7 h-7" />
        </div>
        <h3 class="text-base font-bold text-gray-900 dark:text-white">Belum Ada Penugasan Mengajar</h3>
        <p class="text-xs text-gray-500 max-w-sm mx-auto mt-1">
          Bapak/Ibu belum ditugaskan mengajar pada semester ini. Silakan hubungi Admin jika terdapat ketidaksesuaian.
        </p>
      </div>

      <!-- Empty Search Result -->
      <div v-else-if="!filteredAssignments.length" class="py-12 text-center bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700">
        <UIcon name="i-lucide-search-x" class="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Tidak ada kelas yang cocok dengan kata kunci</p>
        <UButton color="neutral" variant="ghost" size="xs" class="mt-2 cursor-pointer" @click="resetSearch">
          Reset Pencarian
        </UButton>
      </div>

      <!-- Card Grid: Modern, Intuitive & Proper -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <div
          v-for="item in filteredAssignments"
          :key="item.id"
          class="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-gray-800/90 border border-gray-200/80 dark:border-gray-700/70 p-5 shadow-sm hover:shadow-xl hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-300"
        >
          <!-- Top Section: Class Badge & Moodle Status -->
          <div>
            <div class="flex items-center justify-between gap-2 mb-3">
              <!-- Full Class Name Badge -->
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs tracking-tight shadow-sm">
                <UIcon name="i-lucide-school" class="w-3.5 h-3.5 text-emerald-500" />
                <span>Kelas {{ item.classroom?.name || '-' }}</span>
              </div>

              <!-- Moodle Status Badge -->
              <UBadge
                v-if="item.courseId"
                color="info"
                variant="subtle"
                size="xs"
                class="font-mono flex items-center gap-1 px-2 py-0.5"
                :title="`Terhubung ke Moodle Course #${item.courseId}`"
              >
                <UIcon name="i-lucide-cloud" class="w-3 h-3 text-blue-500" />
                <span>Moodle #{{ item.courseId }}</span>
              </UBadge>
              <span v-else class="text-[10px] text-gray-400 dark:text-gray-500">
                Non-Moodle
              </span>
            </div>

            <!-- Subject Information -->
            <div class="space-y-1 mb-4">
              <div class="flex items-center gap-2">
                <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase">
                  {{ item.subject?.code || 'MAPEL' }}
                </span>
                <span class="text-xs text-gray-400">•</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  Tingkat {{ item.classroom?.level }} {{ item.classroom?.room ? `• Ruang ${item.classroom.room}` : '' }}
                </span>
              </div>
              <h3 class="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2" :title="item.subject?.name">
                {{ item.subject?.name }}
              </h3>
            </div>

            <!-- Progress Card Section -->
            <div class="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 space-y-2.5 mb-4">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-600 dark:text-gray-300 font-medium flex items-center gap-1.5">
                  <UIcon name="i-lucide-clipboard-check" class="w-3.5 h-3.5 text-gray-400" />
                  Kelengkapan Nilai
                </span>
                <span
                  class="font-extrabold font-mono text-xs px-2 py-0.5 rounded-md"
                  :class="{
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300': (getProgress(item.id)?.percent || 0) === 100,
                    'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300': (getProgress(item.id)?.percent || 0) > 0 && (getProgress(item.id)?.percent || 0) < 100,
                    'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400': (getProgress(item.id)?.percent || 0) === 0
                  }"
                >
                  {{ getProgress(item.id)?.percent || 0 }}%
                </span>
              </div>

              <!-- Modern Progress Bar -->
              <div class="w-full bg-gray-200/80 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="(getProgress(item.id)?.percent || 0) === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'"
                  :style="{ width: `${Math.min(100, getProgress(item.id)?.percent || 0)}%` }"
                />
              </div>

              <div class="flex items-center justify-between text-[11px] text-gray-400 pt-0.5 font-medium">
                <span>
                  {{ (getProgress(item.id)?.percent || 0) === 100 ? '✅ Nilai Lengkap' : (getProgress(item.id)?.percent || 0) > 0 ? '⏳ Sedang Berjalan' : 'Belum Ada Nilai' }}
                </span>
                <span class="font-mono text-gray-500 dark:text-gray-400">
                  {{ getProgress(item.id)?.filled || 0 }}/{{ getProgress(item.id)?.expected || 0 }} nilai
                </span>
              </div>
            </div>
          </div>

          <!-- Bottom Action Buttons: Intuitive & Clean -->
          <div class="pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center gap-2">
            <!-- Primary Action: Input Nilai -->
            <UButton
              :to="`/teacher/classes/${item.id}/grades`"
              color="success"
              variant="solid"
              size="sm"
              class="flex-1 justify-center rounded-xl font-bold cursor-pointer shadow-sm hover:shadow-md hover:shadow-emerald-500/20 transition-all"
              icon="i-lucide-file-edit"
            >
              Input Nilai
            </UButton>

            <!-- Secondary Action: Data Siswa -->
            <UButton
              :to="`/teacher/classes/${item.id}`"
              color="neutral"
              variant="soft"
              size="sm"
              class="rounded-xl cursor-pointer"
              icon="i-lucide-users"
              title="Daftar Siswa di Kelas Ini"
            >
              Siswa
            </UButton>

            <!-- Tertiary Action: AI Analisis Pembelajaran -->
            <UButton
              :to="`/teacher/classes/${item.id}/ai-analysis`"
              color="primary"
              variant="soft"
              size="sm"
              class="rounded-xl cursor-pointer"
              icon="i-lucide-sparkles"
              title="AI Analisis Pembelajaran"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
