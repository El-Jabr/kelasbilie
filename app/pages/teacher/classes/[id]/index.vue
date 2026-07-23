<script setup lang="ts">
definePageMeta({
  layout: 'teacher',
  middleware: ['auth', 'role'],
  role: ['TEACHER', 'ADMIN']
})

const route = useRoute()
const teachingId = route.params.id as string

const { data: teachingRes, pending: pendingTeaching } = await useFetch(`/api/teaching-assignments/${teachingId}`)
const teaching = computed(() => teachingRes.value?.data)

const search = ref('')
const page = ref(1)

const { data: studentsRes, pending: pendingStudents } = await useFetch('/api/student-classes', {
  query: computed(() => ({
    classroomId: teaching.value?.classroomId,
    semesterId: teaching.value?.semesterId,
    page: page.value,
    limit: 50
  })),
  immediate: !!teaching.value?.classroomId
})

const studentClasses = computed(() => studentsRes.value?.data ?? [])
const pagination = computed(() => studentsRes.value?.pagination ?? { page: 1, limit: 50, total: 0, pages: 1 })

const columns = [
  { accessorKey: 'no', header: 'No' },
  { accessorKey: 'nis', header: 'NIS' },
  { accessorKey: 'fullname', header: 'Nama Siswa' },
  { accessorKey: 'username', header: 'Username' },
  { accessorKey: 'email', header: 'Email' }
]
</script>

<template>
  <div class="space-y-6">
    <!-- Back & Action Bar -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <UButton
          to="/teacher/classes"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
        />
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Detail Kelas & Siswa
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Mata Pelajaran: {{ teaching?.subject?.name }} ({{ teaching?.subject?.code }})
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          :to="`/teacher/classes/${teachingId}/grades`"
          color="success"
          variant="solid"
          icon="i-lucide-edit-3"
        >
          Input Nilai Siswa
        </UButton>
        <UButton
          :to="`/teacher/classes/${teachingId}/summary`"
          color="primary"
          variant="soft"
          icon="i-lucide-bar-chart-3"
        >
          Lihat Rekap Nilai
        </UButton>
      </div>
    </div>

    <!-- Overview Card -->
    <div v-if="teaching" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UCard>
        <div class="text-xs text-gray-500">Kelas / Ruang</div>
        <div class="text-lg font-bold text-gray-900 dark:text-white mt-1">
          {{ teaching.classroom?.name }}
        </div>
        <div class="text-xs text-emerald-600 mt-0.5">Tingkat {{ teaching.classroom?.level }} • Ruang {{ teaching.classroom?.room }}</div>
      </UCard>

      <UCard>
        <div class="text-xs text-gray-500">Semester & Tahun Ajaran</div>
        <div class="text-lg font-bold text-gray-900 dark:text-white mt-1">
          Semester {{ teaching.semester?.type }}
        </div>
        <div class="text-xs text-gray-500 mt-0.5">{{ teaching.semester?.academicYear?.name }}</div>
      </UCard>

      <UCard>
        <div class="text-xs text-gray-500">Moodle Course</div>
        <div class="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1 line-clamp-1">
          {{ teaching.course?.fullname || 'Belum Terhubung' }}
        </div>
        <div class="text-xs text-gray-500 mt-0.5">{{ teaching.course ? `${teaching.course.gradeItems?.length || 0} Grade Items` : '-' }}</div>
      </UCard>
    </div>

    <!-- Student Table -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UIcon name="i-lucide-users" class="w-5 h-5 text-emerald-500" />
            Daftar Siswa Terdaftar ({{ studentClasses.length }})
          </h2>
        </div>
      </template>

      <UTable
        :data="studentClasses"
        :columns="columns"
        :loading="pendingTeaching || pendingStudents"
      >
        <template #no-cell="{ row }">
          <span class="text-xs text-gray-400">{{ row.index + 1 }}</span>
        </template>

        <template #nis-cell="{ row }">
          <span class="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">
            {{ row.original.student?.nis || '-' }}
          </span>
        </template>

        <template #fullname-cell="{ row }">
          <span class="font-medium text-gray-900 dark:text-white">
            {{ row.original.student?.user?.fullname }}
          </span>
        </template>

        <template #username-cell="{ row }">
          <span class="text-xs text-gray-500 font-mono">
            {{ row.original.student?.user?.username }}
          </span>
        </template>

        <template #email-cell="{ row }">
          <span class="text-xs text-gray-500">
            {{ row.original.student?.user?.email || '-' }}
          </span>
        </template>
      </UTable>

      <template v-if="pagination.pages > 1" #footer>
        <div class="flex justify-between items-center px-4 py-2">
          <span class="text-xs text-gray-500">
            Total {{ pagination.total }} siswa
          </span>
          <UPagination
            v-model:page="page"
            :total="pagination.total"
            :items-per-page="pagination.limit"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
