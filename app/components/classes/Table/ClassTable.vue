<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ClassSchema } from '~~/shared/schemas/class'

const {
  classes,
  loading
} = useClasses()

const columns: TableColumn<ClassSchema>[] = [
  {
    accessorKey: 'name',
    header: 'Nama Kelas'
  },
  {
    accessorKey: 'level',
    header: 'Tingkat'
  },
  {
    accessorKey: 'room',
    header: 'Ruang'
  },
  {
    accessorKey: 'building',
    header: 'Gedung'
  },
  {
    accessorKey: 'floor',
    header: 'Lantai'
  },
  {
    accessorKey: 'createdAt',
    header: 'Waktu Dibuat'
  },
  {
    accessorKey: 'updatedAt',
    header: 'Waktu Diubah'
  },
  {
    id: 'action',
    header: 'Aksi'
  }
]

function formatDate(dateStr?: string | Date) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }">
    <UTable
      :data="classes"
      :columns="columns"
      :loading="loading"
    >
      <template #name-cell="{ row }">
        <span class="font-bold text-gray-900 dark:text-white">
          {{ row.original.name }}
        </span>
      </template>

      <template #level-cell="{ row }">
        <UBadge color="primary" variant="subtle" size="xs">
          Tingkat {{ row.original.level }}
        </UBadge>
      </template>

      <template #createdAt-cell="{ row }">
        <span class="text-xs text-gray-600 dark:text-gray-400 font-mono">
          {{ formatDate(row.original.createdAt) }}
        </span>
      </template>

      <template #updatedAt-cell="{ row }">
        <span class="text-xs text-gray-600 dark:text-gray-400 font-mono">
          {{ formatDate(row.original.updatedAt) }}
        </span>
      </template>

      <template #action-cell="{ row }">
        <ClassesTableClassActions :classroom="row.original" />
      </template>
    </UTable>
  </UCard>
</template>
