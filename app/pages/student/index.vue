<script setup lang="ts">
definePageMeta({
  layout: 'student',
  middleware: ['auth', 'role'],
  role: 'STUDENT'
})

const toast = useToast()

const { data, status, refresh } = await useFetch<any>('/api/students/me', {
  lazy: false
})

const studentData = computed(() => data.value?.data ?? null)
const currentStudentClass = computed(() => studentData.value?.studentClasses?.[0] ?? null)
const classroom = computed(() => currentStudentClass.value?.classroom ?? null)
const semester = computed(() => currentStudentClass.value?.semester ?? null)
const homeroomTeacher = computed(() => classroom.value?.homeroomAssignments?.[0]?.teacher ?? null)
</script>

<template>
  <div class="space-y-6">
    <!-- Header Banner -->
    <div class="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
      <div class="relative z-10 space-y-2">
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 uppercase tracking-wider">
          Student Portal
        </span>
        <h1 class="text-2xl md:text-3xl font-bold">
          Selamat Datang, {{ studentData?.user?.fullname || 'Siswa' }}!
        </h1>
        <p class="text-primary-100 text-sm max-w-xl">
          NIS: {{ studentData?.nis || '-' }} • Selamat belajar dan pantau perkembangan nilai akademikmu secara berkala.
        </p>
      </div>
    </div>

    <div v-if="status === 'pending'" class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <USkeleton class="h-40 rounded-2xl" />
      <USkeleton class="h-40 rounded-2xl" />
      <USkeleton class="h-40 rounded-2xl" />
    </div>

    <template v-else-if="studentData">
      <!-- Main Status Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Card 1: Kelas Aktif -->
        <UCard>
          <div class="flex items-start gap-4">
            <div class="p-3 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 rounded-xl">
              <UIcon name="i-lucide-users" class="w-6 h-6" />
            </div>
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Kelas Aktif</p>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {{ classroom?.name || '-' }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Ruang: {{ classroom?.room || '-' }}
              </p>
            </div>
          </div>
        </UCard>

        <!-- Card 2: Wali Kelas -->
        <UCard>
          <div class="flex items-start gap-4">
            <div class="p-3 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 rounded-xl">
              <UIcon name="i-lucide-user" class="w-6 h-6" />
            </div>
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Wali Kelas</p>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {{ homeroomTeacher?.user?.fullname || '-' }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                NIP: {{ homeroomTeacher?.nip || '-' }}
              </p>
            </div>
          </div>
        </UCard>

        <!-- Card 3: Semester & Tahun Ajaran -->
        <UCard>
          <div class="flex items-start gap-4">
            <div class="p-3 bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 rounded-xl">
              <UIcon name="i-lucide-calendar" class="w-6 h-6" />
            </div>
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Periode Akademik</p>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white mt-1">
                {{ semester?.academicYear?.name || '-' }} (Semester {{ semester?.type || '-' }})
              </h3>
              <div class="mt-1">
                <UBadge color="success" size="sm" variant="subtle">Aktif</UBadge>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Navigation Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <NuxtLink to="/student/grades" class="block group">
          <UCard class="h-full transition-all group-hover:border-primary-500 group-hover:shadow-md">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="p-3 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-xl">
                  <UIcon name="i-lucide-award" class="w-8 h-8" />
                </div>
                <div>
                  <h4 class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Nilai Saya
                  </h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Lihat rekapitulasi nilai PH, STS, dan SAS per mata pelajaran.
                  </p>
                </div>
              </div>
              <UIcon name="i-lucide-chevron-right" class="w-6 h-6 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </UCard>
        </NuxtLink>

        <NuxtLink to="/student/profile" class="block group">
          <UCard class="h-full transition-all group-hover:border-primary-500 group-hover:shadow-md">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="p-3 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-xl">
                  <UIcon name="i-lucide-user" class="w-8 h-8" />
                </div>
                <div>
                  <h4 class="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    Profil Saya
                  </h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    Lihat informasi NIS, email, dan biodata akun siswa.
                  </p>
                </div>
              </div>
              <UIcon name="i-lucide-chevron-right" class="w-6 h-6 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </UCard>
        </NuxtLink>
      </div>
    </template>

    <div v-else class="text-center py-12">
      <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-error-500 mx-auto" />
      <p class="mt-2 font-medium text-gray-700 dark:text-gray-300">Gagal memuat data profil siswa.</p>
      <UButton label="Coba Lagi" color="primary" class="mt-4" @click="() => refresh()" />
    </div>
  </div>
</template>
