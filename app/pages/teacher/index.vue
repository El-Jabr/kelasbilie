<script setup lang="ts">
definePageMeta({
  layout: 'teacher',
  middleware: ['auth', 'role'],
  role: ['TEACHER', 'ADMIN']
})

const toast = useToast()

const { data: teacherRes, pending: pendingTeacher } = await useFetch('/api/teachers/me')
const teacher = computed(() => teacherRes.value?.data)

const { data: homeroomRes } = await useFetch('/api/homerooms/my')
const homeroom = computed(() => homeroomRes.value?.data)

const { data: teachingsRes, pending: pendingTeachings } = await useFetch('/api/teaching-assignments', {
  query: computed(() => ({
    teacherId: teacher.value?.id,
    activeSemester: 'true',
    limit: 50
  })),
  immediate: !!teacher.value?.id
})

const assignments = computed(() => teachingsRes.value?.data ?? [])
</script>

<template>
  <div class="space-y-6">
    <!-- Header / Welcome Banner -->
    <div class="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span class="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            Portal Guru
          </span>
          <h1 class="text-2xl sm:text-3xl font-bold">
            Selamat Datang, {{ teacher?.user?.fullname || 'Guru' }}!
          </h1>
          <p class="text-emerald-100 text-sm mt-1">
            NIP: {{ teacher?.nip || '-' }} • Kelola kelas mengajar dan penilaian siswa di semester aktif.
          </p>
        </div>
        <UButton
          to="/teacher/profile"
          color="neutral"
          variant="solid"
          icon="i-lucide-user-cog"
          size="md"
          class="shrink-0"
        >
          Edit Profil
        </UButton>
      </div>
    </div>

    <!-- Section Wali Kelas (Jika Ada) -->
    <div v-if="homeroom" class="p-6 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
          <UIcon name="i-lucide-user-check" class="w-7 h-7 text-white" />
        </div>
        <div>
          <span class="inline-block text-xs font-bold uppercase tracking-wider text-amber-100">Penugasan Wali Kelas</span>
          <h3 class="text-xl font-bold">
            Wali Kelas: {{ homeroom.classroom?.name }}
          </h3>
          <p class="text-xs text-amber-100 mt-0.5">
            Tingkat {{ homeroom.classroom?.level }} • Semester {{ homeroom.semester?.type }} ({{ homeroom.semester?.academicYear?.name }})
          </p>
        </div>
      </div>

      <UButton
        to="/teacher/homeroom"
        color="neutral"
        variant="solid"
        icon="i-lucide-file-text"
        size="md"
        class="shrink-0"
      >
        Lihat Rekap Nilai Kelas
      </UButton>
    </div>

    <!-- Section Title -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-lucide-book-open" class="w-5 h-5 text-emerald-500" />
          Kelas Mengajar Anda (Semester Aktif)
        </h2>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Pilih kelas di bawah untuk melihat siswa, memasukkan nilai, atau melihat rekapitulasi.
        </p>
      </div>
      <UBadge color="primary" variant="subtle" size="lg">
        {{ assignments.length }} Kelas
      </UBadge>
    </div>

    <!-- Loading State -->
    <div v-if="pendingTeacher || pendingTeachings" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <USkeleton v-for="i in 3" :key="i" class="h-48 rounded-xl" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!assignments.length" class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
      <UIcon name="i-lucide-folder-open" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">Belum Ada Kelas Mengajar</h3>
      <p class="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
        Anda belum ditugaskan mengajar di kelas manapun untuk semester aktif ini. Silakan hubungi kurikulum atau admin sekolah.
      </p>
    </div>

    <!-- Card Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="item in assignments"
        :key="item.id"
        class="hover:shadow-md transition-shadow flex flex-col justify-between"
      >
        <template #header>
          <div class="flex items-start justify-between">
            <div>
              <UBadge color="neutral" variant="subtle" size="sm" class="mb-1">
                {{ item.subject?.code }}
              </UBadge>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white line-clamp-1">
                {{ item.subject?.name }}
              </h3>
            </div>
            <UBadge color="success" variant="solid" size="md">
              {{ item.classroom?.name }}
            </UBadge>
          </div>
        </template>

        <div class="space-y-2 text-xs text-gray-600 dark:text-gray-300 py-1">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-layers" class="w-4 h-4 text-gray-400" />
            <span>Tingkat {{ item.classroom?.level }} (Ruang {{ item.classroom?.room }})</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-calendar" class="w-4 h-4 text-gray-400" />
            <span>{{ item.semester?.academicYear?.name }} - Semester {{ item.semester?.type }}</span>
          </div>
          <div v-if="item.course" class="flex items-center gap-2">
            <UIcon name="i-lucide-server" class="w-4 h-4 text-emerald-500" />
            <span class="text-emerald-600 dark:text-emerald-400 font-medium">Linked Moodle Course</span>
          </div>
        </div>

        <template #footer>
          <div class="flex gap-2">
            <UButton
              :to="`/teacher/classes/${item.id}`"
              color="primary"
              variant="soft"
              block
              icon="i-lucide-users"
            >
              Detail Kelas
            </UButton>
            <UButton
              :to="`/teacher/classes/${item.id}/grades`"
              color="success"
              variant="solid"
              icon="i-lucide-edit-3"
            >
              Nilai
            </UButton>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>
