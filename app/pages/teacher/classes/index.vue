<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'
import { storeToRefs } from 'pinia'
import { useTeacherClassStore } from '~~/app/stores/teacherClass'

definePageMeta({
  layout: 'teacher',
  middleware: ['auth', 'role'],
  role: ['TEACHER', 'ADMIN', 'SUPER_ADMIN']
})

const router = useRouter()
const store = useTeacherClassStore()
const {
  assignments,
  pagination,
  search,
  page,
  pendingAssignments: pending,
  selectedSemesterId,
  semesterOptions
} = storeToRefs(store)

onMounted(async () => {
  await Promise.all([
    store.fetchSemesters(),
    store.fetchAssignments()
  ])
})

watch([search, page, selectedSemesterId], () => {
  store.fetchAssignments(true)
})

const columns: TableColumn<Record<string, unknown>>[] = [
  { accessorKey: 'subject', header: 'Mata Pelajaran' },
  { accessorKey: 'classroom', header: 'Kelas' },
  { accessorKey: 'semester', header: 'Semester' },
  { accessorKey: 'course', header: 'Course Moodle' },
  { accessorKey: 'actions', header: 'Aksi' }
]

function getActionItems(id: string): DropdownMenuItem[][] {
  return [
    [
      {
        label: 'Detail Siswa',
        icon: 'i-lucide-users',
        onSelect: () => {
          router.push(`/teacher/classes/${id}`)
        }
      },
      {
        label: 'Input Nilai',
        icon: 'i-lucide-edit-3',
        onSelect: () => {
          router.push(`/teacher/classes/${id}/grades`)
        }
      },
      {
        label: 'Rekap Nilai',
        icon: 'i-lucide-bar-chart-3',
        onSelect: () => {
          router.push(`/teacher/classes/${id}/summary`)
        }
      }
    ]
  ]
}

const isRefreshing = ref(false)
const toast = useToast()

async function handleRefresh() {
  isRefreshing.value = true
  try {
    await store.fetchAssignments(true)
    toast.add({
      title: 'Data Diperbarui',
      description: 'Daftar penugasan kelas berhasil dimuat ulang.',
      color: 'success'
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat ulang data.'
    toast.add({
      title: 'Gagal Memperbarui',
      description: message,
      color: 'error'
    })
  } finally {
    isRefreshing.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Daftar Kelas Mengajar
        </h1>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Daftar seluruh penugasan mengajar Anda di berbagai semester.
        </p>
      </div>
      <div class="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <USelect
          v-model="selectedSemesterId"
          :items="semesterOptions"
          label-key="label"
          value-key="value"
          class="w-full sm:w-56"
        />
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Cari mata pelajaran atau kelas..."
          class="w-full sm:w-64"
        />
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          :loading="isRefreshing"
          class="cursor-pointer shrink-0"
          title="Muat ulang data penugasan"
          @click="handleRefresh"
        >
          Refresh
        </UButton>
      </div>
    </div>

    <UCard>
      <UTable
        :data="assignments"
        :columns="columns"
        :loading="pending"
      >
        <template #subject-cell="{ row }">
          <div>
            <div class="font-medium text-gray-900 dark:text-white">
              {{ (row as any).original.subject?.name }}
            </div>
            <div class="text-xs text-gray-500 font-mono">
              {{ (row as any).original.subject?.code }}
            </div>
          </div>
        </template>

        <template #classroom-cell="{ row }">
          <UBadge
            color="success"
            variant="subtle"
          >
            {{ (row as any).original.classroom?.name }} (Lt {{ (row as any).original.classroom?.floor }})
          </UBadge>
        </template>

        <template #semester-cell="{ row }">
          <div class="text-xs">
            <div>{{ (row as any).original.semester?.academicYear?.name }}</div>
            <UBadge
              :color="(row as any).original.semester?.isActive ? 'success' : 'neutral'"
              size="sm"
            >
              {{ (row as any).original.semester?.type }} {{ (row as any).original.semester?.isActive ? '(Aktif)' : '' }}
            </UBadge>
          </div>
        </template>

        <template #course-cell="{ row }">
          <span
            v-if="(row as any).original.course"
            class="text-xs text-emerald-600 dark:text-emerald-400 font-medium"
          >
            {{ (row as any).original.course?.shortname }}
          </span>
          <span
            v-else
            class="text-xs text-gray-400"
          >Tidak ada</span>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center">
            <UDropdownMenu :items="getActionItems((row as any).original.id)">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-ellipsis"
              />
            </UDropdownMenu>
          </div>
        </template>
      </UTable>

      <template
        v-if="pagination.pages > 1"
        #footer
      >
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
