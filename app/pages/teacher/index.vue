<script setup lang="ts">
definePageMeta({
  layout: 'teacher',
  middleware: ['auth', 'role'],
  role: ['TEACHER', 'ADMIN']
})

useSeoMeta({
  title: 'Dashboard Guru'
})

const user = ref<any>(null)
const activeSemester = ref<any>(null)
const teacherProfile = ref<any>(null)
const pending = ref(true)

async function loadData() {
  pending.value = true
  try {
    const [authRes, teacherRes, semRes]: [any, any, any] = await Promise.all([
      ($fetch as any)('/api/auth/me').catch(() => null),
      ($fetch as any)('/api/teachers/me').catch(() => null),
      ($fetch as any)('/api/semesters/active').catch(() => null)
    ])

    if (authRes) user.value = authRes
    if (teacherRes?.data) teacherProfile.value = teacherRes.data
    if (semRes?.data) activeSemester.value = semRes.data
  } catch (err) {
    console.error('Error loading teacher dashboard data:', err)
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  loadData()
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
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome Banner -->
    <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 sm:p-8 text-white shadow-xl">
      <div class="relative z-10 space-y-2">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-emerald-100 border border-white/20">
          <UIcon name="i-lucide-sparkles" class="w-3.5 h-3.5 text-amber-300" />
          <span>Portal Pengajar • Kelas Bilie</span>
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Selamat Datang, {{ user?.fullname || 'Bapak/Ibu Guru' }}! 👋
        </h1>
        <p class="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
          Kelola penugasan mengajar, input nilai harian, STS, SAS, serta pantau pendaftaran siswa Moodle dalam satu tempat.
        </p>
      </div>

      <!-- Decorative shapes -->
      <div class="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div class="absolute right-40 -top-10 w-48 h-48 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />
    </div>

    <!-- Active Semester Bar -->
    <UCard v-if="activeSemester" class="border border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-950/20">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">
            <UIcon name="i-lucide-calendar" class="w-4 h-4" />
          </div>
          <div>
            <p class="font-bold text-gray-900 dark:text-white">
              Tahun Ajaran {{ activeSemester.academicYear?.name }} — {{ activeSemester.type }}
            </p>
            <p class="text-gray-500 dark:text-gray-400">
              Semester Aktif Sistem Akademik
            </p>
          </div>
        </div>

        <UBadge color="success" variant="subtle" size="sm" class="font-bold">
          SEMESTER AKTIF
        </UBadge>
      </div>
    </UCard>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Penugasan Mengajar</p>
            <p class="text-2xl font-black text-gray-900 dark:text-white mt-1">{{ assignments.length }}</p>
            <p class="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">Kelas yang Anda Ajar</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <UIcon name="i-lucide-book-open" class="w-6 h-6" />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">NIP Pengajar</p>
            <p class="text-lg font-bold font-mono text-gray-900 dark:text-white mt-1">{{ teacherProfile?.nip || '-' }}</p>
            <p class="text-[11px] text-gray-500 mt-1">Nomor Induk Pegawai</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <UIcon name="i-lucide-badge-check" class="w-6 h-6" />
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Status Akun</p>
            <p class="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">Aktif & Terverifikasi</p>
            <p class="text-[11px] text-gray-500 mt-1">Role: {{ user?.role }}</p>
          </div>
          <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <UIcon name="i-lucide-user-check" class="w-6 h-6" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Classes Section -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-lucide-layers" class="w-5 h-5 text-emerald-500" />
          Daftar Penugasan Mengajar (Kelas Saya)
        </h2>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="py-12 text-center text-sm text-gray-400">
        Memuat data penugasan...
      </div>

      <!-- Empty State -->
      <div v-else-if="!assignments.length" class="py-12 text-center bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
        <UIcon name="i-lucide-folder-open" class="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Belum Ada Penugasan Mengajar</h3>
        <p class="text-xs text-gray-500 max-w-sm mx-auto mt-1">
          Bapak/Ibu belum ditugaskan mengajar pada semester ini. Silakan hubungi Super Admin jika terdapat ketidaksesuaian.
        </p>
      </div>

      <!-- Card Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <UCard
          v-for="item in assignments"
          :key="item.id"
          class="hover:shadow-xl transition-all duration-300 border-transparent hover:border-emerald-500/30 group flex flex-col justify-between"
        >
          <template #header>
            <div class="flex items-start justify-between">
              <div>
                <UBadge color="neutral" variant="solid" size="xs" class="mb-2 font-mono bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  KODE: {{ item.subject?.code }}
                </UBadge>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {{ item.subject?.name }}
                </h3>
              </div>
              <div class="my-auto w-auto px-3 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex flex-col items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/50">
                <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">KELAS</span>
                <span class="text-sm font-black text-gray-900 dark:text-white leading-none mt-0.5">{{ item.classroom?.name.split(' ').pop() || item.classroom?.name }}</span>
              </div>
            </div>
          </template>

          <div class="space-y-3 py-2">
            <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-map-pin" class="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">Tingkat {{ item.classroom?.level }}</p>
                <p class="text-xs">Ruang {{ item.classroom?.room }}</p>
              </div>
            </div>

            <div v-if="item.course" class="flex items-center gap-3 text-sm">
              <div class="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                <UIcon name="i-lucide-cloud-download" class="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p class="font-medium text-blue-700 dark:text-blue-400">Sinkron Moodle Aktif</p>
                <p class="text-xs text-blue-600/70 dark:text-blue-400/70">ID Course: {{ item.courseId }}</p>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex gap-3">
              <UButton
                :to="`/teacher/classes/${item.id}`"
                color="neutral"
                variant="solid"
                class="flex-1 justify-center rounded-xl"
                icon="i-lucide-users"
              >
                Siswa
              </UButton>
              <UButton
                :to="`/teacher/classes/${item.id}/grades`"
                color="success"
                variant="solid"
                class="flex-1 justify-center rounded-xl shadow-md shadow-emerald-500/20"
                icon="i-lucide-edit-3"
              >
                Isi Nilai
              </UButton>
            </div>
          </template>
        </UCard>
      </div>
    </div>
  </div>
</template>
