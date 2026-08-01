<script setup lang="ts">
definePageMeta({
  layout: 'student',
  middleware: ['auth', 'role'],
  role: 'STUDENT'
})

const { data, status, refresh } = await useAsyncData<any>(
  'student-me-dashboard',
  () => ($fetch as any)('/api/students/me', { credentials: 'include' })
)

const studentData = computed(() => data.value?.data ?? null)
const studentClassesList = computed<any[]>(() => studentData.value?.classes ?? [])

// Ambil kelas siswa di semester aktif (atau fallback ke kelas pertama)
const currentStudentClass = computed(() => {
  if (!studentClassesList.value.length) return null
  return studentClassesList.value.find((sc: any) => sc.semester?.isActive) || studentClassesList.value[0] || null
})

const classroom = computed(() => currentStudentClass.value?.classroom ?? null)
const semester = computed(() => currentStudentClass.value?.semester ?? null)

// Wali kelas: cari homeroom di semester aktif, atau fallback ke homeroom pertama
const homeroomTeacher = computed(() => {
  const homerooms = classroom.value?.homerooms
  if (!homerooms || !homerooms.length) return null
  const activeSemId = semester.value?.id
  const matched = homerooms.find((h: any) => h.semesterId === activeSemId || h.semester?.isActive)
  return (matched || homerooms[0])?.teacher ?? null
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
      <div class="absolute -right-10 -bottom-10 opacity-15 pointer-events-none">
        <UIcon name="i-lucide-graduation-cap" class="w-64 h-64 text-white" />
      </div>

      <div class="relative z-10 space-y-2">
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur uppercase tracking-wider text-emerald-100 border border-white/20">
            Portal Siswa
          </span>
          <span v-if="classroom" class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-200 border border-emerald-500/30">
            Kelas {{ classroom.name }}
          </span>
        </div>
        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight">
          Selamat Datang, {{ studentData?.user?.fullname || 'Siswa' }}!
        </h1>
        <p class="text-emerald-100 text-sm max-w-xl">
          NIS: <span class="font-mono font-bold">{{ studentData?.nis || '-' }}</span> • Selamat belajar dan pantau perkembangan nilai akademikmu secara berkala.
        </p>
      </div>
    </div>

    <!-- Skeleton Loading -->
    <div v-if="status === 'pending'" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <USkeleton class="h-44 rounded-2xl" />
      <USkeleton class="h-44 rounded-2xl" />
      <USkeleton class="h-44 rounded-2xl" />
    </div>

    <template v-else-if="studentData">
      <!-- Main Cards Grid: Rombel, Wali Kelas, Periode -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Card 1: Rombel / Kelas Aktif -->
        <UCard class="hover:shadow-md transition-shadow">
          <div class="flex items-start gap-4">
            <div class="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0 border border-emerald-200 dark:border-emerald-800/50">
              <UIcon name="i-lucide-school" class="w-7 h-7" />
            </div>
            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rombel / Kelas Aktif
                </p>
                <UBadge v-if="classroom?.level" color="success" variant="subtle" size="xs" class="font-bold">
                  Tingkat {{ classroom.level }}
                </UBadge>
              </div>

              <h3 class="text-xl font-extrabold text-gray-900 dark:text-white truncate">
                {{ classroom?.name ? `Kelas ${classroom.name}` : 'Belum Ada Kelas' }}
              </h3>

              <div class="text-xs text-gray-500 dark:text-gray-400 pt-1 space-y-0.5 font-medium">
                <p v-if="classroom?.room" class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-door-open" class="w-3.5 h-3.5 text-emerald-500" />
                  Ruangan: <span class="font-semibold text-gray-700 dark:text-gray-300">{{ classroom.room }}</span>
                </p>
                <p v-if="classroom?.building" class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-building-2" class="w-3.5 h-3.5 text-gray-400" />
                  Gedung: {{ classroom.building }} <template v-if="classroom?.floor">(Lantai {{ classroom.floor }})</template>
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Card 2: Wali Kelas -->
        <UCard class="hover:shadow-md transition-shadow">
          <div class="flex items-start gap-4">
            <div class="p-3.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl shrink-0 border border-blue-200 dark:border-blue-800/50">
              <UIcon name="i-lucide-user-check" class="w-7 h-7" />
            </div>
            <div class="min-w-0 flex-1 space-y-1">
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Wali Kelas
              </p>

              <h3 class="text-xl font-extrabold text-gray-900 dark:text-white truncate" :title="homeroomTeacher?.user?.fullname">
                {{ homeroomTeacher?.user?.fullname || 'Belum Ditentukan' }}
              </h3>

              <div class="text-xs text-gray-500 dark:text-gray-400 pt-1 space-y-0.5 font-medium">
                <p v-if="homeroomTeacher?.nip" class="flex items-center gap-1.5 font-mono">
                  <UIcon name="i-lucide-id-card" class="w-3.5 h-3.5 text-blue-500" />
                  NIP: {{ homeroomTeacher.nip }}
                </p>
                <p v-if="homeroomTeacher?.user?.email" class="flex items-center gap-1.5 truncate">
                  <UIcon name="i-lucide-mail" class="w-3.5 h-3.5 text-gray-400" />
                  {{ homeroomTeacher.user.email }}
                </p>
                <p v-else-if="!homeroomTeacher" class="text-amber-500 italic text-[11px]">
                  Pembagian wali kelas belum diatur.
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Card 3: Semester & Periode Akademik -->
        <UCard class="hover:shadow-md transition-shadow">
          <div class="flex items-start gap-4">
            <div class="p-3.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl shrink-0 border border-amber-200 dark:border-amber-800/50">
              <UIcon name="i-lucide-calendar-days" class="w-7 h-7" />
            </div>
            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex items-center justify-between">
                <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Periode Akademik
                </p>
                <UBadge :color="semester?.isActive ? 'success' : 'neutral'" variant="subtle" size="xs" class="font-bold">
                  {{ semester?.isActive ? 'Aktif' : 'Non-Aktif' }}
                </UBadge>
              </div>

              <h3 class="text-xl font-extrabold text-gray-900 dark:text-white truncate">
                {{ semester?.academicYear?.name || 'Tahun Ajaran -' }}
              </h3>

              <div class="text-xs text-gray-500 dark:text-gray-400 pt-1 space-y-0.5 font-medium">
                <p class="flex items-center gap-1.5">
                  <UIcon name="i-lucide-clock" class="w-3.5 h-3.5 text-amber-500" />
                  Semester: <span class="font-bold text-gray-800 dark:text-gray-200 uppercase">{{ semester?.type || '-' }}</span>
                </p>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Navigation Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <NuxtLink to="/student/grades" class="block group">
          <UCard class="h-full transition-all group-hover:border-emerald-500 group-hover:shadow-lg">
            <div class="flex items-center justify-between p-2">
              <div class="flex items-center gap-4">
                <div class="p-3.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-105 transition-transform">
                  <UIcon name="i-lucide-award" class="w-8 h-8" />
                </div>
                <div>
                  <h4 class="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Nilai Saya
                  </h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Lihat rekapitulasi nilai Rata-rata PH, STS, SAS, dan Nilai Akhir per mata pelajaran.
                  </p>
                </div>
              </div>
              <UIcon name="i-lucide-chevron-right" class="w-6 h-6 text-gray-400 group-hover:translate-x-1.5 group-hover:text-emerald-500 transition-all shrink-0" />
            </div>
          </UCard>
        </NuxtLink>

        <NuxtLink to="/student/profile" class="block group">
          <UCard class="h-full transition-all group-hover:border-emerald-500 group-hover:shadow-lg">
            <div class="flex items-center justify-between p-2">
              <div class="flex items-center gap-4">
                <div class="p-3.5 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-105 transition-transform">
                  <UIcon name="i-lucide-user" class="w-8 h-8" />
                </div>
                <div>
                  <h4 class="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Profil Saya
                  </h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Lihat informasi NIS, email, dan biodata akun siswa Anda.
                  </p>
                </div>
              </div>
              <UIcon name="i-lucide-chevron-right" class="w-6 h-6 text-gray-400 group-hover:translate-x-1.5 group-hover:text-blue-500 transition-all shrink-0" />
            </div>
          </UCard>
        </NuxtLink>
      </div>
    </template>

    <div v-else class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
      <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-error-500 mx-auto" />
      <p class="mt-2 font-medium text-gray-700 dark:text-gray-300">Gagal memuat data profil siswa.</p>
      <UButton label="Coba Lagi" color="primary" class="mt-4" @click="() => refresh()" />
    </div>
  </div>
</template>
