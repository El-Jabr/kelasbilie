<script setup lang="ts">
import { UCheckbox } from '#components'
import type { TableColumn } from '@nuxt/ui'
import type { SemesterTableSchema } from '~~/shared/schemas/semester'

const {
  semesters,
  loading
} = useSemesters()

const emit = defineEmits<{
  selectionChange: [SemesterTableSchema[]]
}>()

const rowSelection = ref({})

const table = useTemplateRef('table')

const selectedRows = computed<SemesterTableSchema[]>(() => {
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

const columns: TableColumn<SemesterTableSchema>[] = [
  {
    id: 'select'
  },
  {
    accessorKey: 'type',
    header: 'Semester'
  },
  {
    accessorKey: 'academicYear.name',
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
      :data="semesters"
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

      <template #type-cell="{ row }">
        <SemestersBadgesSemesterTypeBadge
          :type="row.original.type"
        />
      </template>

      <template #isActive-cell="{ row }">
        <SemestersBadgesSemesterStatusBadge
          :active="row.original.isActive"
        />
      </template>

      <template #isLocked-cell="{ row }">
        <SemestersBadgesSemesterLockBadge
          :locked="row.original.isLocked"
        />
      </template>

      <template #createdAt-cell="{ row }">
        {{ new Date(row.original.createdAt).toLocaleDateString('id-ID') }}
      </template>

      <template #action-cell="{ row }">
        <SemestersTableSemesterActions
          :semester="row.original"
        />
      </template>
    </UTable>
  </UCard>
</template>
