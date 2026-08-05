<script setup lang="ts">
const toast = useToast()

const {
  page,
  limit,
  searchQuery,
  searchInput,
  filterSemesterId,
  filterClassroomId,
  pendingSC,
  studentClasses,
  pagination,
  filterClassOptions,
  filterSemesterOptions,
  classOptions,
  refreshSC,
  resetFilter
} = useStudentClasses()

const { openSingleEditModal } = useStudentClassDialogs()
const { handleDelete } = useStudentClassActions()

// Multi-select state
const selectedItems = ref<any[]>([])
const selectedIds = computed(() => selectedItems.value.map((i: any) => i.id))
const targetMoveClassroomId = ref('')
const isBatchMoving = ref(false)
const isBatchDeleting = ref(false)

const columns: any[] = [
  { accessorKey: 'student', header: 'Siswa' },
  { accessorKey: 'nis', header: 'NIS' },
  { accessorKey: 'classroom', header: 'Kelas Target' },
  { accessorKey: 'semester', header: 'Semester' },
  { accessorKey: 'actions', header: 'Aksi' }
]

const debounceSearch = useDebounceFn(() => {
  searchQuery.value = searchInput.value
  page.value = 1
}, 400)

watch(searchInput, debounceSearch)

watch([filterSemesterId, filterClassroomId, page, searchQuery], () => {
  selectedItems.value = []
  refreshSC()
})

// Batch Move Selected Students to New Classroom
async function batchMoveSelected() {
  if (!targetMoveClassroomId.value) {
    toast.add({ title: 'Peringatan', description: 'Silakan pilih kelas tujuan terlebih dahulu.', color: 'warning' })
    return
  }

  const selectedStudentItems = studentClasses.value.filter((sc: any) => selectedIds.value.includes(sc.id))
  const studentIds = selectedStudentItems.map((sc: any) => sc.studentId)
  const activeSemesterId = selectedItems.value[0]?.semesterId || filterSemesterId.value

  if (studentIds.length === 0) return

  isBatchMoving.value = true
  try {
    const res: any = await $fetch('/api/student-classes/bulk', {
      method: 'POST',
      body: {
        classroomId: targetMoveClassroomId.value,
        semesterId: activeSemesterId,
        studentIds
      },
      credentials: 'include'
    })

    toast.add({
      title: 'Berhasil',
      description: res.message || 'Siswa berhasil dipindahkan ke kelas baru.',
      color: 'success'
    })

    selectedItems.value = []
    targetMoveClassroomId.value = ''
    await refreshSC()
  } catch (err: any) {
    toast.add({
      title: 'Gagal',
      description: err.statusMessage || 'Gagal memindahkan siswa.',
      color: 'error'
    })
  } finally {
    isBatchMoving.value = false
  }
}

import { LazyModalConfirm } from '#components'

const overlay = useOverlay()
const confirmModal = overlay.create(LazyModalConfirm)

// Batch Delete Selected Students from Classes
async function batchDeleteSelected() {
  if (selectedIds.value.length === 0) return

  const confirmed = await confirmModal.open({
    title: 'Keluarkan Siswa Terpilih',
    message: `Apakah Anda yakin ingin mengeluarkan ${selectedIds.value.length} siswa terpilih dari kelas ini?`,
    confirmText: 'Ya, Keluarkan',
    color: 'error'
  })
  if (!confirmed) return

  isBatchDeleting.value = true
  try {
    const res: any = await $fetch('/api/student-classes/batch-delete', {
      method: 'POST',
      body: { ids: selectedIds.value },
      credentials: 'include'
    })

    toast.add({
      title: 'Berhasil',
      description: res.message || 'Siswa berhasil dikeluarkan dari kelas.',
      color: 'success'
    })

    selectedItems.value = []
    await refreshSC()
  } catch (err: any) {
    toast.add({
      title: 'Gagal',
      description: err.statusMessage || 'Gagal menghapus pembagian kelas.',
      color: 'error'
    })
  } finally {
    isBatchDeleting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar Filter & Search -->
    <UCard>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Search Input -->
        <UInput
          v-model="searchInput"
          icon="i-lucide-search"
          placeholder="Cari NIS atau Nama Siswa..."
          class="w-full"
        />

        <!-- Semester Filter -->
        <USelect
          v-model="filterSemesterId"
          :items="filterSemesterOptions"
          value-key="value"
          label-key="label"
          placeholder="Filter Semester"
          class="w-full"
        />

        <!-- Classroom Filter -->
        <USelect
          v-model="filterClassroomId"
          :items="filterClassOptions"
          value-key="value"
          label-key="label"
          placeholder="Filter Kelas"
          class="w-full"
        />

        <!-- Action Buttons -->
        <div class="flex items-center gap-2">
          <UButton
            type="button"
            icon="i-lucide-filter-x"
            color="neutral"
            variant="soft"
            class="flex-1 cursor-pointer"
            @click="resetFilter"
          >
            Reset Filter
          </UButton>

          <UButton
            type="button"
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="ghost"
            class="cursor-pointer"
            :loading="pendingSC"
            @click="refreshSC"
          />
        </div>
      </div>
    </UCard>

    <!-- Floating Batch Action Bar -->
    <div
      v-if="selectedIds.length > 0"
      class="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-in fade-in slide-in-from-top-2"
    >
      <div class="flex items-center gap-2 text-sm font-bold text-emerald-900 dark:text-emerald-200">
        <UIcon name="i-lucide-check-square" class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <span>{{ selectedIds.length }} Siswa Terpilih</span>
      </div>

      <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        <!-- Target Move Select -->
        <USelect
          v-model="targetMoveClassroomId"
          :items="classOptions"
          value-key="value"
          label-key="label"
          placeholder="Pilih Kelas Tujuan..."
          class="w-48 text-xs"
        />

        <UButton
          color="success"
          size="xs"
          icon="i-lucide-arrow-right-left"
          class="cursor-pointer font-bold"
          :loading="isBatchMoving"
          :disabled="!targetMoveClassroomId"
          @click="batchMoveSelected"
        >
          Pindahkan ke Kelas
        </UButton>

        <UButton
          color="error"
          variant="soft"
          size="xs"
          icon="i-lucide-trash-2"
          class="cursor-pointer font-medium"
          :loading="isBatchDeleting"
          @click="batchDeleteSelected"
        >
          Hapus Terpilih
        </UButton>
      </div>
    </div>

    <!-- Data Table Card -->
    <UCard :ui="{ body: 'p-0 sm:p-0' }">
      <div v-if="pendingSC" class="py-8 text-center text-sm text-gray-400">
        Memuat data pembagian kelas...
      </div>

      <div v-else-if="studentClasses.length === 0" class="py-8 text-center text-sm text-gray-400">
        Belum ada data pembagian kelas yang sesuai dengan filter.
      </div>

      <div v-else>
        <UTable
          :data="studentClasses"
          :columns="columns"
          class="w-full"
        >
          <template #student-cell="{ row }">
            <span class="font-semibold text-gray-900 dark:text-white">
              {{ (row as any).original.student?.user?.fullname || (row as any).original.studentId }}
            </span>
          </template>

          <template #nis-cell="{ row }">
            <span class="text-xs font-mono text-gray-500">
              {{ (row as any).original.student?.nis || '-' }}
            </span>
          </template>

          <template #classroom-cell="{ row }">
            <UBadge color="success" variant="subtle" size="xs" class="font-bold">
              {{ (row as any).original.classroom?.name || (row as any).original.classroomId }}
            </UBadge>
          </template>

          <template #semester-cell="{ row }">
            <span class="text-xs text-gray-500">
              Semester {{ (row as any).original.semester?.type }} ({{ (row as any).original.semester?.academicYear?.name || '-' }})
            </span>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex justify-end gap-1">
              <UButton
                type="button"
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                size="xs"
                class="cursor-pointer"
                @click="openSingleEditModal((row as any).original)"
              />
              <UButton
                type="button"
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="xs"
                class="cursor-pointer"
                @click="handleDelete((row as any).original.id)"
              />
            </div>
          </template>
        </UTable>
      </div>
    </UCard>

    <!-- Pagination -->
    <div v-if="pagination.pages > 1" class="flex items-center justify-between pt-2">
      <span class="text-xs text-gray-500">
        Menampilkan {{ studentClasses.length }} dari {{ pagination.total }} data (Halaman {{ pagination.page }} dari {{ pagination.pages }})
      </span>

      <UPagination
        v-model:page="page"
        :items-per-page="limit"
        :total="pagination.total"
      />
    </div>
  </div>
</template>
