<script setup lang="ts">
import { UCheckbox } from '#components'
import type { TableColumn } from '@nuxt/ui'
import type { AcademicYearSchema } from '~~/shared/schemas/academic-year'

const {
  academicYears,
  loading
} = useAcademicYears()

const emit = defineEmits<{
  selectionChange: [AcademicYearSchema[]]
}>()

const rowSelection = ref({})

const table = useTemplateRef('table')

const selectedRows = computed<AcademicYearSchema[]>(() => {
  return (
    table.value?.tableApi
      ?.getSelectedRowModel()
      .rows
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((row: { original: any }) => row.original) ?? []
  )
})

watch(selectedRows, (rows) => {
  emit('selectionChange', rows)
})

const columns: TableColumn<AcademicYearSchema>[] = [
  {
    id: 'select'
  },
  {
    accessorKey: 'name',
    header: 'Tahun Ajaran'
  },
  {
    accessorKey: 'isActive',
    header: 'Status'
  },
  {
    accessorKey: 'isLocked',
    header: 'Terkunci'
  },
  {
    accessorKey: 'createdAt',
    header: 'Dibuat'
  },
  {
    id: 'action'
  }
]

function clearSelection() {
  rowSelection.value = {}
}

defineExpose({
  clearSelection
})
</script>

<template>
  <UCard>
    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      :data="academicYears"
      :columns="columns"
      :loading="loading"
    >
      <template #select-header="{ table }">
        <UCheckbox
          :model-value="table.getIsAllPageRowsSelected()"
          @update:model-value="val => table.toggleAllPageRowsSelected(val === 'indeterminate' ? false : val)"
        />
      </template>

      <template #select-cell="{ row }">
        <UCheckbox
          :model-value="row.getIsSelected()"
          @update:model-value="val => row.toggleSelected(val === 'indeterminate' ? false : val)"
        />
      </template>

      <template #isActive-cell="{ row }">
        <AcademicYearsBadgesAcademicYearStatusBadge
          :active="row.original.isActive"
        />
      </template>

      <template #isLocked-cell="{ row }">
        <AcademicYearsBadgesAcademicYearLockBadge
          :locked="row.original.isLocked"
        />
      </template>

      <template #createdAt-cell="{ row }">
        {{ new Date(row.original.createdAt).toLocaleDateString('id-ID') }}
      </template>

      <template #action-cell="{ row }">
        <AcademicYearsTableAcademicYearActions
          :academic-year="row.original"
        />
      </template>
    </UTable>
  </UCard>
</template>
