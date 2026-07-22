<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { SubjectSchema } from '~~/shared/schemas/subject'

const {
  subjects,
  loading
} = useSubjects()

const columns: TableColumn<SubjectSchema>[] = [
  {
    accessorKey: 'code',
    header: 'Kode'
  },
  {
    accessorKey: 'name',
    header: 'Mata Pelajaran'
  },
  {
    id: 'action'
  }
]
</script>

<template>
  <UCard>
    <UTable
      :data="subjects"
      :columns="columns"
      :loading="loading"
    >
      <template #action-cell="{ row }">
        <SubjectsTableSubjectActions :subject="row.original" />
      </template>
    </UTable>
  </UCard>
</template>
