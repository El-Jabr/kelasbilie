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
const selectedIds = ref<string[]>([])
const selectAll = ref(false)
const targetMoveClassroomId = ref('')
const isBatchMoving = ref(false)
const isBatchDeleting = ref(false)

const debounceSearch = useDebounceFn(() => {
  searchQuery.value = searchInput.value
  page.value = 1
}, 400)

watch(searchInput, debounceSearch)

watch([filterSemesterId, filterClassroomId, page, searchQuery], () => {
  selectedIds.value = []
  selectAll.value = false
  refreshSC()
})

function toggleSelectAll() {
  if (selectAll.value) {
    selectedIds.value = studentClasses.value.map((item: any) => item.id)
  } else {
    selectedIds.value = []
  }
}

// Batch Move Selected Students to New Classroom
async function batchMoveSelected() {
  if (!targetMoveClassroomId.value) {
    toast.add({ title: 'Peringatan', description: 'Silakan pilih kelas tujuan terlebih dahulu.', color: 'warning' })
    return
  }

  const selectedItems = studentClasses.value.filter((sc: any) => selectedIds.value.includes(sc.id))
  const studentIds = selectedItems.map((sc: any) => sc.studentId)
  const activeSemesterId = selectedItems[0]?.semesterId || filterSemesterId.value

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

    selectedIds.value = []
    selectAll.value = false
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

    selectedIds.value = []
    selectAll.value = false
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

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm border-collapse">
          <thead class="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th class="py-3 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  v-model="selectAll"
                  @change="toggleSelectAll"
                  class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </th>
              <th class="py-3 px-4">Siswa</th>
              <th class="py-3 px-4">NIS</th>
              <th class="py-3 px-4">Kelas Target</th>
              <th class="py-3 px-4">Semester</th>
              <th class="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="item in studentClasses"
              :key="item.id"
              class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
              :class="{ 'bg-emerald-50/30 dark:bg-emerald-950/10': selectedIds.includes(item.id) }"
            >
              <td class="py-3 px-4 text-center">
                <input
                  type="checkbox"
                  :value="item.id"
                  v-model="selectedIds"
                  class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </td>
              <td class="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                {{ item.student?.user?.fullname || item.studentId }}
              </td>
              <td class="py-3 px-4 text-xs font-mono text-gray-500">
                {{ item.student?.nis || '-' }}
              </td>
              <td class="py-3 px-4">
                <UBadge color="success" variant="subtle" size="xs" class="font-bold">
                  {{ item.classroom?.name || item.classroomId }}
                </UBadge>
              </td>
              <td class="py-3 px-4 text-xs text-gray-500">
                Semester {{ item.semester?.type }} ({{ item.semester?.academicYear?.name || '-' }})
              </td>
              <td class="py-3 px-4 text-right flex justify-end gap-1">
                <UButton
                  type="button"
                  icon="i-lucide-pencil"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  class="cursor-pointer"
                  @click="openSingleEditModal(item)"
                />
                <UButton
                  type="button"
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="xs"
                  class="cursor-pointer"
                  @click="handleDelete(item.id)"
                />
              </td>
            </tr>
          </tbody>
        </table>
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
