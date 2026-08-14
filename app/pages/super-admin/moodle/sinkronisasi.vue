<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  role: 'SUPER_ADMIN'
})

useSeoMeta({
  title: 'Sinkronisasi Moodle'
})

const toast = useToast()
const syncingResource = ref<string | null>(null)
const pendingLogs = ref(false)
const logs = ref<Record<string, unknown>[]>([])

// Export Users State
const isExportingUsers = ref(false)
const exportTargetRole = ref<'ALL' | 'TEACHER' | 'STUDENT'>('ALL')
const autoEnrollCourses = ref(true)
const defaultPassword = ref('Password123!')
const exportSummary = ref<Record<string, unknown> | null>(null)

// Password Mode & CSV Export State
const isUpdatingPasswords = ref(false)
const isExportingCsv = ref(false)
const passwordMode = ref<'HARIAN' | 'EXAM_STS_SAS'>('HARIAN')
const passwordClassroomId = ref('ALL')
const classroomOptions = ref<{ value: string, label: string }[]>([])
const passwordUpdateSummary = ref<Record<string, unknown> | null>(null)

const roleOptions = [
  { value: 'ALL', label: 'Semua User (Guru & Siswa)' },
  { value: 'TEACHER', label: 'Khusus Guru' },
  { value: 'STUDENT', label: 'Khusus Siswa' }
]

async function loadClassroomsDropdown() {
  try {
    const res = await $fetch<{ data?: { id: string, name: string, level: string | number }[] }>('/api/classes', { credentials: 'include' })
    if (res?.data) {
      classroomOptions.value = [
        { value: 'ALL', label: 'Semua Kelas' },
        ...(res.data || []).map((c: { id: string, name: string, level: string | number }) => ({
          value: c.id,
          label: `${c.name} (Tingkat ${c.level})`
        }))
      ]
    }
  } catch (err) {
    console.error('Gagal memuat dropdown kelas:', err)
  }
}

async function loadLogs() {
  pendingLogs.value = true
  try {
    const res = await $fetch<{ data?: Record<string, unknown>[] }>('/api/moodle/logs?limit=15', {
      credentials: 'include'
    })
    if (res?.data) {
      logs.value = res.data
    }
  } catch (err) {
    console.error('Gagal mengambil logs Moodle:', err)
  } finally {
    pendingLogs.value = false
  }
}

async function triggerSync(resource: string) {
  syncingResource.value = resource
  try {
    const res = await $fetch<{ message?: string }>(`/api/moodle?resource=${resource}`, {
      method: 'POST',
      credentials: 'include'
    })
    toast.add({
      title: 'Sinkronisasi Selesai',
      description: res.message || `Sinkronisasi resource [${resource}] selesai.`,
      color: 'success'
    })
    await loadLogs()
  } catch (e) {
    const err = e as { data?: { statusMessage?: string, message?: string }, message?: string }
    const errorMsg = err.data?.statusMessage || err.data?.message || err.message || 'Gagal menjalankan sinkronisasi.'
    toast.add({
      title: 'Sinkronisasi Gagal',
      description: errorMsg,
      color: 'error'
    })
  } finally {
    syncingResource.value = null
  }
}

// Trigger User Export & Auto-Enrollment
async function handleExportUsers() {
  isExportingUsers.value = true
  exportSummary.value = null
  try {
    const res = await $fetch<{ message?: string, summary?: Record<string, unknown> }>('/api/moodle/export-users', {
      method: 'POST',
      body: {
        targetRole: exportTargetRole.value,
        autoEnroll: autoEnrollCourses.value,
        defaultPassword: defaultPassword.value
      },
      credentials: 'include'
    })

    toast.add({
      title: 'Ekspor User Selesai',
      description: res.message || 'Berhasil mengimpor user dan melakukan enrollment Moodle.',
      color: 'success'
    })

    if (res.summary) {
      exportSummary.value = res.summary
    }

    await loadLogs()
  } catch (e) {
    const err = e as { data?: { statusMessage?: string, message?: string }, message?: string }
    const errorMsg = err.data?.statusMessage || err.data?.message || err.message || 'Gagal mengekspor user ke Moodle.'
    toast.add({
      title: 'Ekspor User Gagal',
      description: errorMsg,
      color: 'error'
    })
  } finally {
    isExportingUsers.value = false
  }
}

// Trigger Password Mode Update & Moodle Sync
async function handleUpdatePasswords() {
  isUpdatingPasswords.value = true
  passwordUpdateSummary.value = null
  try {
    const res = await $fetch<{ message?: string, summary?: Record<string, unknown> }>('/api/moodle/update-passwords', {
      method: 'POST',
      body: {
        mode: passwordMode.value,
        classroomId: passwordClassroomId.value
      },
      credentials: 'include'
    })

    toast.add({
      title: 'Update Password Selesai',
      description: res.message || 'Berhasil memperbarui password siswa di Moodle & database.',
      color: 'success'
    })

    if (res.summary) {
      passwordUpdateSummary.value = res.summary
    }

    await loadLogs()
  } catch (e) {
    const err = e as { data?: { statusMessage?: string, message?: string }, message?: string }
    const errorMsg = err.data?.statusMessage || err.data?.message || err.message || 'Gagal memperbarui password Moodle.'
    toast.add({
      title: 'Update Password Gagal',
      description: errorMsg,
      color: 'error'
    })
  } finally {
    isUpdatingPasswords.value = false
  }
}

// Download CSV Credentials for Students
function downloadStudentCsv() {
  isExportingCsv.value = true
  try {
    const url = `/api/students/export-csv?classroomId=${passwordClassroomId.value}`
    const a = document.createElement('a')
    a.href = url
    a.download = `Kredensial_Moodle_Siswa_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    toast.add({
      title: 'Mengunduh CSV',
      description: 'File CSV kredensial siswa sedang diunduh...',
      color: 'info'
    })
  } catch (err) {
    console.error('Gagal mengunduh CSV:', err)
  } finally {
    isExportingCsv.value = false
  }
}

onMounted(() => {
  loadLogs()
  loadClassroomsDropdown()
})

const searchLog = ref('')
const pageLog = ref(1)
const pageCountLog = ref(10)

const columnsLog: { accessorKey: string, header: string, class?: string }[] = [
  { accessorKey: 'resource', header: 'Resource' },
  { accessorKey: 'status', header: 'Status' },
  { accessorKey: 'message', header: 'Pesan Log' },
  { accessorKey: 'syncedAt', header: 'Waktu Eksekusi' }
]

const filteredLogs = computed(() => {
  let list = logs.value
  if (searchLog.value) {
    const kw = searchLog.value.toLowerCase()
    list = list.filter((r: Record<string, unknown>) => {
      const details = r.details as string | undefined
      const message = r.message as string | undefined
      const resource = r.resource as string | undefined
      return (details || message || '').toLowerCase().includes(kw)
        || (resource || '').toLowerCase().includes(kw)
    })
  }
  return list
})

const paginatedLogs = computed(() => {
  const start = (pageLog.value - 1) * pageCountLog.value
  const end = start + pageCountLog.value
  return filteredLogs.value.slice(start, end)
})

watch(searchLog, () => {
  pageLog.value = 1
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
        <UIcon
          name="i-lucide-refresh-cw"
          class="hidden sm:inline-block w-7 h-7 text-emerald-500"
        />
        Sinkronisasi & Integrasi Moodle
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Kelola sinkronisasi dua arah antara aplikasi dan Moodle (Impor user app ke Moodle, mode password harian vs STS/SAS, dan sync nilai).
      </p>
    </div>

    <!-- FEATURE 1: Export App Users to Moodle Card -->
    <UCard class="border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-md">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="hidden sm:inline-block p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <UIcon
                name="i-lucide-user-plus"
                class="w-6 h-6 "
              />
            </div>
            <div>
              <h2 class="text-base font-bold text-gray-900 dark:text-white">
                Ekspor User App & Auto-Enroll ke Moodle
              </h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Buat akun Moodle untuk Guru & Siswa dari aplikasi secara otomatis, lalu enroll ke Course Moodle sesuai rombel/penugasan.
              </p>
            </div>
          </div>
          <UBadge
            color="success"
            variant="subtle"
            size="sm"
            class="font-bold hidden sm:inline-block"
          >
            Pendaftaran Massal
          </UBadge>
        </div>
      </template>

      <div class="space-y-4 py-1">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Target Role Select -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-700 dark:text-gray-300">1. Target User</label>
            <USelect
              v-model="exportTargetRole"
              :items="roleOptions"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </div>

          <!-- Password Default -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-700 dark:text-gray-300">2. Password Awal Moodle</label>
            <UInput
              v-model="defaultPassword"
              placeholder="Contoh: Password123!"
              class="w-full font-mono text-xs"
            />
          </div>

          <!-- Auto Enroll Checkbox -->
          <div class="space-y-1 flex flex-col justify-end">
            <label class="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                v-model="autoEnrollCourses"
                type="checkbox"
                class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              >
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
                Auto-Enroll ke Course Moodle
              </span>
            </label>
          </div>
        </div>

        <!-- Summary Result Badge / Alert -->
        <div
          v-if="exportSummary"
          class="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2"
        >
          <div class="flex items-center gap-2 text-sm font-bold text-emerald-900 dark:text-emerald-200">
            <UIcon
              name="i-lucide-check-circle"
              class="w-5 h-5 text-emerald-600 dark:text-emerald-400"
            />
            <span>Hasil Ekspor User & Enroll Selesai:</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div class="bg-white dark:bg-gray-900 p-2 rounded-lg border text-center">
              <div class="text-gray-400">
                Total Diproses
              </div>
              <div class="text-base font-bold text-gray-900 dark:text-white">
                {{ exportSummary.totalProcessed }}
              </div>
            </div>
            <div class="bg-white dark:bg-gray-900 p-2 rounded-lg border text-center">
              <div class="text-gray-400">
                Akun Baru Dibuat
              </div>
              <div class="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {{ exportSummary.usersCreated }}
              </div>
            </div>
            <div class="bg-white dark:bg-gray-900 p-2 rounded-lg border text-center">
              <div class="text-gray-400">
                Akun Sudah Ada
              </div>
              <div class="text-base font-bold text-blue-600 dark:text-blue-400">
                {{ exportSummary.usersExisting }}
              </div>
            </div>
            <div class="bg-white dark:bg-gray-900 p-2 rounded-lg border text-center">
              <div class="text-gray-400">
                Enrollment Course
              </div>
              <div class="text-base font-bold text-amber-600 dark:text-amber-400">
                {{ exportSummary.enrolmentsCount }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton
            color="success"
            size="md"
            icon="i-lucide-send"
            class="cursor-pointer font-bold shadow-sm"
            :loading="isExportingUsers"
            @click="handleExportUsers"
          >
            Ekspor User & Enroll ke Moodle
          </UButton>
        </div>
      </template>
    </UCard>

    <!-- FEATURE 2: Password Mode & CSV Export Card -->
    <UCard class="border-2 border-amber-500/30 dark:border-amber-500/20 shadow-md">
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="hidden sm:inline-block p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <UIcon
                name="i-lucide-key-round"
                class="w-6 h-6 "
              />
            </div>
            <div>
              <h2 class="text-base font-bold text-gray-900 dark:text-white">
                Mode Password Moodle Siswa & Ekspor CSV
              </h2>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Atur mode password Moodle (Mode Harian vs Mode Ujian STS/SAS 6-angka random), lalu unduh daftar kredensial CSV siswa.
              </p>
            </div>
          </div>
          <UBadge
            color="warning"
            variant="subtle"
            size="sm"
            class="font-bold hidden sm:inline-block"
          >
            Manajemen Akses Ujian
          </UBadge>
        </div>
      </template>

      <div class="space-y-4 py-1">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Mode Password Radio Selection -->
          <div class="space-y-1 sm:col-span-2">
            <label class="text-xs font-semibold text-gray-700 dark:text-gray-300">1. Pilih Mode Password Moodle Siswa</label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <!-- Mode Harian -->
              <label
                class="flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all"
                :class="passwordMode === 'HARIAN' ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/30' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'"
              >
                <input
                  v-model="passwordMode"
                  type="radio"
                  name="pwdMode"
                  value="HARIAN"
                  class="mt-1 text-emerald-600 focus:ring-emerald-500"
                >
                <div>
                  <div class="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span>Mode Harian</span>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Password: <code class="font-bold text-emerald-600 dark:text-emerald-400">bilie + NIS</code> (Misal: <code class="font-mono">bilie12345</code>)
                  </p>
                </div>
              </label>

              <!-- Mode Ujian STS/SAS -->
              <label
                class="flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all"
                :class="passwordMode === 'EXAM_STS_SAS' ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-2 ring-amber-500/30' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'"
              >
                <input
                  v-model="passwordMode"
                  type="radio"
                  name="pwdMode"
                  value="EXAM_STS_SAS"
                  class="mt-1 text-amber-600 focus:ring-amber-500"
                >
                <div>
                  <div class="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span>Mode Ujian STS/SAS</span>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Password: <code class="font-bold text-amber-600 dark:text-amber-400">bilie + 6 Angka Acak</code> (Misal: <code class="font-mono">bilie892301</code>)
                  </p>
                </div>
              </label>
            </div>
          </div>

          <!-- Target Classroom Filter -->
          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-700 dark:text-gray-300">2. Target Kelas (Opsional)</label>
            <USelect
              v-model="passwordClassroomId"
              :items="classroomOptions"
              value-key="value"
              label-key="label"
              class="w-full"
            />
          </div>
        </div>

        <!-- Summary Result Badge / Alert -->
        <div
          v-if="passwordUpdateSummary"
          class="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2"
        >
          <div class="flex items-center gap-2 text-sm font-bold text-amber-900 dark:text-amber-200">
            <UIcon
              name="i-lucide-check-circle"
              class="w-5 h-5 text-amber-600 dark:text-amber-400"
            />
            <span>Hasil Update & Sync Password Selesai:</span>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div class="bg-white dark:bg-gray-900 p-2 rounded-lg border text-center">
              <div class="text-gray-400">
                Total Siswa
              </div>
              <div class="text-base font-bold text-gray-900 dark:text-white">
                {{ passwordUpdateSummary.totalStudents }}
              </div>
            </div>
            <div class="bg-white dark:bg-gray-900 p-2 rounded-lg border text-center">
              <div class="text-gray-400">
                Di-sync ke Moodle
              </div>
              <div class="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {{ passwordUpdateSummary.moodleUpdated }}
              </div>
            </div>
            <div class="bg-white dark:bg-gray-900 p-2 rounded-lg border text-center">
              <div class="text-gray-400">
                Mode Password
              </div>
              <div class="text-base font-bold text-amber-600 dark:text-amber-400">
                {{ passwordUpdateSummary.mode }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            *Gunakan mode Ujian STS/SAS sebelum ujian dimulai dan cetak file CSV untuk dibagikan ke siswa.
          </p>

          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            <UButton
              color="neutral"
              variant="soft"
              size="md"
              icon="i-lucide-download"
              class="cursor-pointer font-bold"
              :loading="isExportingCsv"
              @click="downloadStudentCsv"
            >
              Download CSV Siswa
            </UButton>

            <UButton
              color="warning"
              size="md"
              icon="i-lucide-refresh-cw"
              class="cursor-pointer font-bold shadow-sm"
              :loading="isUpdatingPasswords"
              @click="handleUpdatePasswords"
            >
              Sync Password ke Moodle
            </UButton>
          </div>
        </div>
      </template>
    </UCard>

    <!-- FEATURE 3: Sync Trigger Action Cards (PULL Moodle to App) -->
    <div>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <h2 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon
            name="i-lucide-download-cloud"
            class="w-5 h-5 text-blue-500"
          />
          Tarik Data Dari Moodle ke Aplikasi (Pull Sync)
        </h2>
        <NuxtLink
          to="/super-admin/akademik/teaching-assignments"
          class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          <UIcon
            name="i-lucide-zap"
            class="w-4 h-4 text-emerald-500"
          />
          <span>Sync Nilai Cepat Per-Course (di Penugasan Mengajar) &rarr;</span>
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <UCard class="text-center">
          <div class="space-y-3 py-2">
            <UIcon
              name="i-lucide-layers"
              class="w-8 h-8 mx-auto text-primary-500"
            />
            <div>
              <h3 class="font-semibold text-sm">
                Semua Resource
              </h3>
              <p class="text-xs text-gray-400 mt-0.5">
                Sync Kategori, Course, User, & Nilai
              </p>
            </div>
            <UButton
              block
              color="primary"
              size="xs"
              class="cursor-pointer"
              :loading="syncingResource === 'ALL'"
              @click="triggerSync('ALL')"
            >
              Sync Semua
            </UButton>
          </div>
        </UCard>

        <UCard class="text-center">
          <div class="space-y-3 py-2">
            <UIcon
              name="i-lucide-folder-tree"
              class="w-8 h-8 mx-auto text-info-500"
            />
            <div>
              <h3 class="font-semibold text-sm">
                Kategori
              </h3>
              <p class="text-xs text-gray-400 mt-0.5">
                Sync CourseCategory
              </p>
            </div>
            <UButton
              block
              color="info"
              size="xs"
              class="cursor-pointer"
              :loading="syncingResource === 'CATEGORY'"
              @click="triggerSync('CATEGORY')"
            >
              Sync Kategori
            </UButton>
          </div>
        </UCard>

        <UCard class="text-center">
          <div class="space-y-3 py-2">
            <UIcon
              name="i-lucide-book-open"
              class="w-8 h-8 mx-auto text-success-500"
            />
            <div>
              <h3 class="font-semibold text-sm">
                Course
              </h3>
              <p class="text-xs text-gray-400 mt-0.5">
                Sync Course Moodle
              </p>
            </div>
            <UButton
              block
              color="success"
              size="xs"
              class="cursor-pointer"
              :loading="syncingResource === 'COURSE'"
              @click="triggerSync('COURSE')"
            >
              Sync Course
            </UButton>
          </div>
        </UCard>

        <UCard class="text-center">
          <div class="space-y-3 py-2">
            <UIcon
              name="i-lucide-user-check"
              class="w-8 h-8 mx-auto text-warning-500"
            />
            <div>
              <h3 class="font-semibold text-sm">
                Enrollment
              </h3>
              <p class="text-xs text-gray-400 mt-0.5">
                Sync Pendaftaran Siswa
              </p>
            </div>
            <UButton
              block
              color="warning"
              size="xs"
              class="cursor-pointer"
              :loading="syncingResource === 'USER'"
              @click="triggerSync('USER')"
            >
              Sync Enrollment
            </UButton>
          </div>
        </UCard>

        <UCard class="text-center">
          <div class="space-y-3 py-2">
            <UIcon
              name="i-lucide-award"
              class="w-8 h-8 mx-auto text-error-500"
            />
            <div>
              <h3 class="font-semibold text-sm">
                Nilai / Grade
              </h3>
              <p class="text-xs text-gray-400 mt-0.5">
                Sync GradeItem & Skor
              </p>
            </div>
            <UButton
              block
              color="error"
              size="xs"
              class="cursor-pointer"
              :loading="syncingResource === 'GRADE'"
              @click="triggerSync('GRADE')"
            >
              Sync Nilai
            </UButton>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Sync Logs Table -->
    <UCard>
      <template #header>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-2 font-semibold">
            <UIcon
              name="i-lucide-history"
              class="w-5 h-5 text-primary-500 hidden sm:inline-block"
            />
            <span>Log Sinkronisasi</span>
          </div>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <UInput
              v-model="searchLog"
              icon="i-lucide-search"
              placeholder="Cari log..."
              class="w-full sm:w-64"
              size="sm"
            />
            <UButton
              icon="i-lucide-rotate-cw"
              color="neutral"
              variant="outline"
              size="sm"
              class="cursor-pointer whitespace-nowrap"
              :loading="pendingLogs"
              @click="loadLogs"
            >
              Refresh Log
            </UButton>
          </div>
        </div>
      </template>

      <div
        v-if="pendingLogs"
        class="py-8 text-center text-sm text-gray-400"
      >
        Memuat riwayat log...
      </div>

      <div
        v-else-if="logs.length === 0"
        class="py-8 text-center text-sm text-gray-400"
      >
        Belum ada entri log sinkronisasi.
      </div>

      <div v-else>
        <UTable
          :data="paginatedLogs"
          :columns="columnsLog"
          class="w-full"
        >
          <template #resource-cell="{ row }">
            <UBadge
              color="neutral"
              variant="soft"
              size="xs"
            >
              {{ (row as any).original.resource }}
            </UBadge>
          </template>

          <template #status-cell="{ row }">
            <UBadge
              :color="(row as any).original.status === 'SUCCESS' ? 'success' : 'error'"
              variant="subtle"
              size="xs"
            >
              {{ (row as any).original.status }}
            </UBadge>
          </template>

          <template #message-cell="{ row }">
            <span class="text-gray-700 dark:text-gray-300">
              {{ (row as any).original.details || (row as any).original.message || '-' }}
            </span>
          </template>

          <template #syncedAt-cell="{ row }">
            <div class="text-right text-xs text-gray-400">
              {{ (row as any).original.syncedAt ? new Date((row as any).original.syncedAt).toLocaleString('id-ID') : '-' }}
            </div>
          </template>
        </UTable>
      </div>

      <template
        v-if="filteredLogs.length > 0"
        #footer
      >
        <div class="flex justify-between items-center text-xs text-gray-500">
          <span>Menampilkan {{ paginatedLogs.length }} dari {{ filteredLogs.length }} log</span>
          <UPagination
            v-model:page="pageLog"
            :total="filteredLogs.length"
            :items-per-page="pageCountLog"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
