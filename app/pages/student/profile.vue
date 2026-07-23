<script setup lang="ts">
definePageMeta({
  layout: 'student',
  middleware: ['auth', 'role'],
  role: 'STUDENT'
})

const { data: studentRes, status, refresh } = await useFetch<any>('/api/students/me')
const student = computed(() => studentRes.value?.data ?? null)

const currentClass = computed(() => student.value?.studentClasses?.[0] ?? null)
const classroom = computed(() => currentClass.value?.classroom ?? null)
const homeroom = computed(() => classroom.value?.homeroomAssignments?.[0]?.teacher ?? null)
const semester = computed(() => currentClass.value?.semester ?? null)
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Profil Saya</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Informasi biodata dan status keanggotaan akademik siswa.
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="status === 'pending'" class="flex items-center justify-center py-16">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
      <span class="ml-2 text-gray-500">Memuat profil siswa...</span>
    </div>

    <template v-else-if="student">
      <!-- Profile Header Card -->
      <UCard>
        <div class="flex flex-col sm:flex-row items-center gap-6">
          <UAvatar
            src="https://i.pravatar.cc/150?u=student"
            alt="Avatar Siswa"
            size="3xl"
            class="ring-4 ring-primary-100 dark:ring-primary-950"
          />
          <div class="text-center sm:text-left space-y-1">
            <div class="flex items-center justify-center sm:justify-start gap-2">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ student.user?.fullname }}
              </h2>
              <UBadge color="info" variant="subtle" size="xs">SISWA</UBadge>
            </div>
            <p class="text-sm text-gray-500 font-mono">NIS: {{ student.nis || '-' }}</p>
            <p class="text-xs text-gray-400">{{ student.user?.email }}</p>
          </div>
        </div>
      </UCard>

      <!-- Grid Detail Information -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Card 1: Informasi Akun -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-user-check" class="w-5 h-5 text-primary-500" />
              <h3 class="font-semibold text-gray-900 dark:text-white">Informasi Akun</h3>
            </div>
          </template>

          <dl class="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
            <div class="py-3 flex justify-between">
              <dt class="text-gray-500">Nama Lengkap</dt>
              <dd class="font-medium text-gray-900 dark:text-white">{{ student.user?.fullname }}</dd>
            </div>
            <div class="py-3 flex justify-between">
              <dt class="text-gray-500">Email</dt>
              <dd class="font-medium text-gray-900 dark:text-white font-mono">{{ student.user?.email }}</dd>
            </div>
            <div class="py-3 flex justify-between">
              <dt class="text-gray-500">Username</dt>
              <dd class="font-medium text-gray-900 dark:text-white font-mono">{{ student.user?.username }}</dd>
            </div>
            <div class="py-3 flex justify-between">
              <dt class="text-gray-500">Nomor Induk Siswa (NIS)</dt>
              <dd class="font-bold text-primary-600 dark:text-primary-400 font-mono">{{ student.nis }}</dd>
            </div>
            <div class="py-3 flex justify-between">
              <dt class="text-gray-500">Status Akun</dt>
              <dd>
                <UBadge :color="student.user?.isActive ? 'success' : 'neutral'" variant="subtle" size="xs">
                  {{ student.user?.isActive ? 'Aktif' : 'Non-Aktif' }}
                </UBadge>
              </dd>
            </div>
          </dl>
        </UCard>

        <!-- Card 2: Informasi Rombel & Wali Kelas -->
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-school" class="w-5 h-5 text-primary-500" />
              <h3 class="font-semibold text-gray-900 dark:text-white">Rombel & Wali Kelas</h3>
            </div>
          </template>

          <dl class="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
            <div class="py-3 flex justify-between">
              <dt class="text-gray-500">Kelas Aktif</dt>
              <dd class="font-bold text-gray-900 dark:text-white">{{ classroom?.name || '-' }}</dd>
            </div>
            <div class="py-3 flex justify-between">
              <dt class="text-gray-500">Ruang & Gedung</dt>
              <dd class="font-medium text-gray-900 dark:text-white">
                {{ classroom ? `${classroom.room} (${classroom.building})` : '-' }}
              </dd>
            </div>
            <div class="py-3 flex justify-between">
              <dt class="text-gray-500">Wali Kelas</dt>
              <dd class="font-medium text-gray-900 dark:text-white">{{ homeroom?.user?.fullname || '-' }}</dd>
            </div>
            <div class="py-3 flex justify-between">
              <dt class="text-gray-500">NIP Wali Kelas</dt>
              <dd class="font-mono text-gray-700 dark:text-gray-300">{{ homeroom?.nip || '-' }}</dd>
            </div>
            <div class="py-3 flex justify-between">
              <dt class="text-gray-500">Tahun Ajaran / Semester</dt>
              <dd class="font-medium text-gray-900 dark:text-white">
                {{ semester ? `${semester.academicYear?.name} (${semester.type})` : '-' }}
              </dd>
            </div>
          </dl>
        </UCard>
      </div>
    </template>
  </div>
</template>
