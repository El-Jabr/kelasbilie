<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const {
  homerooms,
  loading
} = useHomerooms()

const {
  openEditDialog,
  openDeleteDialog
} = useHomeroomDialogs()

const columns: TableColumn<any>[] = [
  { accessorKey: 'classroom', header: 'Kelas' },
  { accessorKey: 'teacher', header: 'Guru Wali Kelas' },
  { accessorKey: 'semester', header: 'Semester' },
  { id: 'actions', header: 'Aksi' }
]
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
    <UTable
      :data="homerooms"
      :columns="columns"
      :loading="loading"
      :empty-state="{ icon: 'i-lucide-users', label: 'Belum ada data wali kelas.' }"
    >
      <template #classroom-cell="{ row }">
        <UBadge color="neutral" variant="soft" size="xs">
          {{ row.original.classroom?.name || row.original.classroomId }}
        </UBadge>
      </template>

      <template #teacher-cell="{ row }">
        {{ row.original.teacher?.user?.fullname || row.original.teacherId }} (NIP: {{ row.original.teacher?.nip }})
      </template>

      <template #semester-cell="{ row }">
        <span class="text-xs text-gray-500">
          {{ row.original.semester?.type }} ({{ row.original.semester?.academicYear?.name || '-' }})
        </span>
      </template>

      <template #actions-cell="{ row }">
        <div class="flex justify-end gap-1">
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="ghost"
            size="xs"
            @click="openEditDialog(row.original)"
          />
          <UButton
            icon="i-lucide-trash-2"
            color="error"
            variant="ghost"
            size="xs"
            @click="openDeleteDialog(row.original)"
          />
        </div>
      </template>
    </UTable>
  </UCard>
</template>
