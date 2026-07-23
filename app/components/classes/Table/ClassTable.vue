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
    header: 'Created'
  },
  {
    accessorKey: 'updatedAt',
    header: 'Update'
  },
  {
    id: 'action'
  }
]
</script>

<template>
  <UCard>
    <UTable
      :data="classes"
      :columns="columns"
      :loading="loading"
    >
      <template #action-cell="{ row }">
        <ClassesTableClassActions :classroom="row.original" />
      </template>
    </UTable>
  </UCard>
</template>
