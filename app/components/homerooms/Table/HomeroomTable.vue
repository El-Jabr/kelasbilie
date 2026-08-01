<script setup lang="ts">
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'

const {
  homerooms,
  loading,
  search
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

const filteredHomerooms = computed(() => {
  if (!search.value) return homerooms.value
  const kw = search.value.toLowerCase()
  return homerooms.value.filter((h: any) =>
    (h.classroom?.name || '').toLowerCase().includes(kw) ||
    (h.teacher?.user?.fullname || '').toLowerCase().includes(kw) ||
    (h.teacher?.nip || '').toLowerCase().includes(kw) ||
    (h.semester?.type || '').toLowerCase().includes(kw)
  )
})

function getActionItems(row: any): DropdownMenuItem[][] {
  return [
    [
      {
        label: 'Edit Wali Kelas',
        icon: 'i-lucide-pencil',
        onSelect: () => openEditDialog(row)
      }
    ],
    [
      {
        label: 'Hapus',
        icon: 'i-lucide-trash-2',
        color: 'error',
        onSelect: () => openDeleteDialog(row)
      }
    ]
  ]
}
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
    <UTable
      :data="filteredHomerooms"
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
        <div class="flex items-center">
          <UDropdownMenu :items="getActionItems(row.original)">
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
  </UCard>
</template>
