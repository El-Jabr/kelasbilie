<script setup lang="ts">
definePageMeta({
  layout: 'teacher',
  middleware: ['auth', 'role'],
  role: ['TEACHER', 'ADMIN']
})

const { data: teacherRes } = await useFetch('/api/teachers/me')
const teacher = computed(() => teacherRes.value?.data)

const search = ref('')
const page = ref(1)

const { data: teachingsRes, pending } = await useFetch('/api/teaching-assignments', {
  query: computed(() => ({
    teacherId: teacher.value?.id,
    search: search.value,
    page: page.value,
    limit: 10
  })),
  immediate: !!teacher.value?.id
})

const assignments = computed(() => teachingsRes.value?.data ?? [])
const pagination = computed(() => teachingsRes.value?.pagination ?? { page: 1, limit: 10, total: 0, pages: 1 })

const columns = [
  { accessorKey: 'subject', header: 'Mata Pelajaran' },
  { accessorKey: 'classroom', header: 'Kelas' },
  { accessorKey: 'semester', header: 'Semester' },
  { accessorKey: 'course', header: 'Course Moodle' },
  { accessorKey: 'actions', header: 'Aksi' }
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Daftar Kelas Mengajar</h1>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Daftar seluruh penugasan mengajar Anda di berbagai semester.
        </p>
      </div>
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Cari mata pelajaran atau kelas..."
        class="w-full sm:w-64"
      />
    </div>

    <UCard>
      <UTable
        :data="assignments"
        :columns="columns"
        :loading="pending"
      >
        <template #subject-cell="{ row }">
          <div>
            <div class="font-medium text-gray-900 dark:text-white">{{ row.original.subject?.name }}</div>
            <div class="text-xs text-gray-500 font-mono">{{ row.original.subject?.code }}</div>
          </div>
        </template>

        <template #classroom-cell="{ row }">
          <UBadge color="success" variant="subtle">
            {{ row.original.classroom?.name }} (Lt {{ row.original.classroom?.floor }})
          </UBadge>
        </template>

        <template #semester-cell="{ row }">
          <div class="text-xs">
            <div>{{ row.original.semester?.academicYear?.name }}</div>
            <UBadge :color="row.original.semester?.isActive ? 'success' : 'neutral'" size="sm">
              {{ row.original.semester?.type }} {{ row.original.semester?.isActive ? '(Aktif)' : '' }}
            </UBadge>
          </div>
        </template>

        <template #course-cell="{ row }">
          <span v-if="row.original.course" class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {{ row.original.course?.shortname }}
          </span>
          <span v-else class="text-xs text-gray-400">Tidak ada</span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-2">
            <UButton
              :to="`/teacher/classes/${row.original.id}`"
              color="primary"
              variant="soft"
              size="xs"
              icon="i-lucide-users"
            >
              Detail
            </UButton>
            <UButton
              :to="`/teacher/classes/${row.original.id}/grades`"
              color="success"
              variant="soft"
              size="xs"
              icon="i-lucide-edit-3"
            >
              Input Nilai
            </UButton>
            <UButton
              :to="`/teacher/classes/${row.original.id}/summary`"
              color="neutral"
              variant="soft"
              size="xs"
              icon="i-lucide-bar-chart-3"
            >
              Rekap
            </UButton>
          </div>
        </template>
      </UTable>

      <template v-if="pagination.pages > 1" #footer>
        <div class="flex justify-between items-center px-4 py-2">
          <span class="text-xs text-gray-500">
            Halaman {{ pagination.page }} dari {{ pagination.pages }} (Total {{ pagination.total }} data)
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
