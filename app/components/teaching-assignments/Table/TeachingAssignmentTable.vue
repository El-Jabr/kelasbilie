<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const toast = useToast()
const { teachingAssignments, loading } = useTeachingAssignments()
const { openEditDialog } = useTeachingAssignmentDialogs()
const { deleteTeachingAssignment } = useTeachingAssignmentActions()

const syncingCourseId = ref<number | null>(null)

const search = ref('')
const page = ref(1)
const pageCount = ref(10)

const columns: any[] = [
  { accessorKey: 'teacher', header: 'Guru' },
  { accessorKey: 'subject', header: 'Mata Pelajaran' },
  { accessorKey: 'classroom', header: 'Kelas' },
  { accessorKey: 'semester', header: 'Semester' },
  { accessorKey: 'course', header: 'Moodle Course' },
  { accessorKey: 'actions', header: 'Aksi' }
]

const filteredRows = computed(() => {
  let list = teachingAssignments.value
  if (search.value) {
    const kw = search.value.toLowerCase()
    list = list.filter((r: any) => 
      (r.teacher?.user?.fullname || '').toLowerCase().includes(kw) ||
      (r.subject?.name || '').toLowerCase().includes(kw) ||
      (r.classroom?.name || '').toLowerCase().includes(kw)
    )
  }
  return list
})

const paginatedRows = computed(() => {
  const start = (page.value - 1) * pageCount.value
  const end = start + pageCount.value
  return filteredRows.value.slice(start, end)
})

watch(search, () => {
  page.value = 1
})

import { LazyModalConfirm } from '#components'

const overlay = useOverlay()
const confirmModal = overlay.create(LazyModalConfirm)

async function handleDelete(id: string) {
  const confirmed = await confirmModal.open({
    title: 'Hapus Penugasan Mengajar',
    message: 'Apakah Anda yakin ingin menghapus penugasan mengajar ini?',
    confirmText: 'Ya, Hapus',
    color: 'error'
  })
  if (confirmed) {
    await deleteTeachingAssignment(id)
  }
}

async function syncCourseGrades(courseId: number, subjectName?: string, className?: string) {
  syncingCourseId.value = courseId
  try {
    const res: any = await $fetch('/api/moodle/grades/sync-course', {
      method: 'POST',
      body: { courseId },
      credentials: 'include'
    })

    toast.add({
      title: 'Sync Nilai Selesai',
      description: res.message || `Berhasil menyingkronkan nilai Moodle untuk ${subjectName || 'Course'} (${className || ''}).`,
      color: 'success'
    })
  } catch (err: any) {
    const errorMsg = err.data?.statusMessage || err.data?.message || err.message || 'Gagal menyingkronkan nilai course.'
    toast.add({
      title: 'Sync Nilai Gagal',
      description: errorMsg,
      color: 'error'
    })
  } finally {
    syncingCourseId.value = null
  }
}

function getActionItems(row: any): DropdownMenuItem[][] {
  const mainGroup: DropdownMenuItem[] = []

  if (row.courseId) {
    mainGroup.push({
      label: 'Sync Nilai Moodle',
      icon: 'i-lucide-refresh-cw',
      onSelect: () => syncCourseGrades(row.courseId, row.subject?.name, row.classroom?.name)
    })
  }

  mainGroup.push({
    label: 'Edit Penugasan',
    icon: 'i-lucide-pencil',
    onSelect: () => openEditDialog(row)
  })

  const dangerGroup: DropdownMenuItem[] = [
    {
      label: 'Hapus Penugasan',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => handleDelete(row.id)
    }
  ]

  return [mainGroup, dangerGroup]
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center gap-4">
        <h3 class="font-bold text-gray-900 dark:text-white">Daftar Penugasan</h3>
        <UInput v-model="search" icon="i-lucide-search" placeholder="Cari guru, mapel, kelas..." class="w-full sm:w-64" size="sm" />
      </div>
    </template>

    <div v-if="loading && teachingAssignments.length === 0" class="py-8 text-center text-sm text-gray-400">
      Memuat data penugasan mengajar...
    </div>

    <div v-else-if="!loading && teachingAssignments.length === 0" class="py-8 text-center text-sm text-gray-400">
      Belum ada penugasan mengajar. Klik tombol "Tambah Penugasan" untuk membuat baru.
    </div>

    <div v-else>
      <UTable
        :data="paginatedRows"
        :columns="columns"
        :loading="loading"
      >
        <template #teacher-cell="{ row }">
          <span class="font-medium">
            {{ (row as any).original.teacher?.user?.fullname || (row as any).original.teacherId }}
          </span>
        </template>
        
        <template #subject-cell="{ row }">
          <UBadge color="info" variant="soft" size="xs">
            {{ (row as any).original.subject?.name || (row as any).original.subjectId }}
          </UBadge>
        </template>
        
        <template #classroom-cell="{ row }">
          <UBadge color="neutral" variant="soft" size="xs">
            {{ (row as any).original.classroom?.name || (row as any).original.classroomId }}
          </UBadge>
        </template>
        
        <template #semester-cell="{ row }">
          <span class="text-xs text-gray-500">
            {{ (row as any).original.semester?.type }} ({{ (row as any).original.semester?.academicYear?.name || '-' }})
          </span>
        </template>
        
        <template #course-cell="{ row }">
          <span v-if="(row as any).original.course" class="text-emerald-600 dark:text-emerald-400 font-semibold text-xs font-mono">
            {{ (row as any).original.course.fullname }}
          </span>
          <span v-else-if="(row as any).original.courseId" class="text-gray-600 dark:text-gray-400 text-xs font-mono">
            ID: {{ (row as any).original.courseId }}
          </span>
          <span v-else class="text-amber-500 italic text-xs">
            Belum terhubung
          </span>
        </template>
        
        <template #actions-cell="{ row }">
          <div class="flex items-center">
            <UDropdownMenu :items="getActionItems((row as any).original)">
              <UButton
                icon="i-lucide-ellipsis"
                color="neutral"
                variant="ghost"
                size="sm"
              />
            </UDropdownMenu>
          </div>
        </template>
      </UTable>
    </div>

    <template v-if="filteredRows.length > 0" #footer>
      <div class="flex justify-end items-center text-xs text-gray-500">
        <UPagination
          v-model:page="page"
          :total="filteredRows.length"
          :items-per-page="pageCount"
        />
      </div>
    </template>
  </UCard>
</template>
