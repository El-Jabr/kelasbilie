<script setup lang="ts">
const toast = useToast()
const { teachingAssignments, loading } = useTeachingAssignments()
const { openEditDialog } = useTeachingAssignmentDialogs()
const { deleteTeachingAssignment } = useTeachingAssignmentActions()

const syncingCourseId = ref<number | null>(null)

const search = ref('')
const page = ref(1)
const pageCount = ref(10)

const columns: any[] = [
  { key: 'teacher', label: 'Guru', sortable: true },
  { key: 'subject', label: 'Mata Pelajaran', sortable: true },
  { key: 'classroom', label: 'Kelas', sortable: true },
  { key: 'semester', label: 'Semester' },
  { key: 'course', label: 'Moodle Course' },
  { key: 'actions', label: 'Aksi', class: 'text-right' }
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
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex justify-between items-center gap-4">
        <h3 class="font-bold text-gray-900 dark:text-white">Daftar Penugasan</h3>
        <UInput v-model="search" icon="i-lucide-search" placeholder="Cari guru, mapel, kelas..." class="w-full sm:w-64" size="sm" />
      </div>
    </template>

    <div v-if="loading" class="py-8 text-center text-sm text-gray-400">
      Memuat data penugasan mengajar...
    </div>

    <div v-else-if="teachingAssignments.length === 0" class="py-8 text-center text-sm text-gray-400">
      Belum ada penugasan mengajar. Klik tombol "Tambah Penugasan" untuk membuat baru.
    </div>

    <div v-else>
      <UTable
        :rows="paginatedRows"
        :columns="columns"
        :empty-state="{ icon: 'i-lucide-file-x', text: 'Tidak ada data penugasan mengajar yang cocok.' }"
      >
        <template #teacher-data="{ row }">
          <span class="font-medium">
            {{ (row as any).teacher?.user?.fullname || (row as any).teacherId }}
          </span>
        </template>
        
        <template #subject-data="{ row }">
          <UBadge color="info" variant="soft" size="xs">
            {{ (row as any).subject?.name || (row as any).subjectId }}
          </UBadge>
        </template>
        
        <template #classroom-data="{ row }">
          <UBadge color="neutral" variant="soft" size="xs">
            {{ (row as any).classroom?.name || (row as any).classroomId }}
          </UBadge>
        </template>
        
        <template #semester-data="{ row }">
          <span class="text-xs text-gray-500">
            {{ (row as any).semester?.type }} ({{ (row as any).semester?.academicYear?.name || '-' }})
          </span>
        </template>
        
        <template #course-data="{ row }">
          <span v-if="(row as any).course" class="text-emerald-600 dark:text-emerald-400 font-semibold text-xs font-mono">
            {{ (row as any).course.fullname }}
          </span>
          <span v-else-if="(row as any).courseId" class="text-gray-600 dark:text-gray-400 text-xs font-mono">
            ID: {{ (row as any).courseId }}
          </span>
          <span v-else class="text-amber-500 italic text-xs">
            Belum terhubung
          </span>
        </template>
        
        <template #actions-data="{ row }">
          <div class="flex items-center justify-end gap-1">
            <UButton
              v-if="(row as any).courseId"
              icon="i-lucide-refresh-cw"
              color="success"
              variant="soft"
              size="xs"
              title="Sync Nilai Moodle Mapel Ini"
              class="cursor-pointer font-medium"
              :loading="syncingCourseId === (row as any).courseId"
              @click="syncCourseGrades((row as any).courseId, (row as any).subject?.name, (row as any).classroom?.name)"
            >
              Sync Nilai
            </UButton>

            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              size="xs"
              title="Edit Penugasan"
              @click="openEditDialog(row)"
            />
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="xs"
              title="Hapus Penugasan"
              @click="handleDelete((row as any).id)"
            />
          </div>
        </template>
      </UTable>
    </div>

    <template v-if="filteredRows.length > 0" #footer>
      <div class="flex justify-between items-center text-xs text-gray-500">
        <span>Menampilkan {{ paginatedRows.length }} dari {{ filteredRows.length }} penugasan</span>
        <UPagination
          v-model="page"
          :page-count="pageCount"
          :total="filteredRows.length"
        />
      </div>
    </template>
  </UCard>
</template>
