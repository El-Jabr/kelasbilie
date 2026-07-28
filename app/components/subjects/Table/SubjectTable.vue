<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const {
  subjects,
  loading
} = useSubjects()

const columns: TableColumn<any>[] = [
  {
    accessorKey: 'code',
    header: 'Kode'
  },
  {
    accessorKey: 'name',
    header: 'Nama Mata Pelajaran'
  },
  {
    id: 'classroom',
    header: 'Kelas'
  },
  {
    id: 'course',
    header: 'Course Moodle'
  },
  {
    id: 'action',
    header: 'Aksi'
  }
]
</script>

<template>
  <UCard :ui="{ body:'p-0 sm:p-0'}">
    <UTable
      :data="subjects"
      :columns="columns"
      :loading="loading"
    >
      <!-- Kode -->
      <template #code-cell="{ row }">
        <UBadge color="primary" variant="subtle" size="xs" class="font-mono font-bold">
          {{ row.original.code }}
        </UBadge>
      </template>

      <!-- Nama Mata Pelajaran -->
      <template #name-cell="{ row }">
        <span class="font-bold text-gray-900 dark:text-white">
          {{ row.original.name }}
        </span>
      </template>

      <!-- Kelas (Classroom) -->
      <template #classroom-cell="{ row }">
        <div v-if="row.original.teachings?.length" class="flex flex-wrap gap-1">
          <UBadge
            v-for="t in row.original.teachings"
            :key="t.id"
            color="neutral"
            variant="soft"
            size="xs"
          >
            {{ t.classroom?.name || 'Kelas' }}
          </UBadge>
        </div>
        <span v-else class="text-xs text-gray-400 italic">Belum di-assign ke kelas</span>
      </template>

      <!-- Course Moodle -->
      <template #course-cell="{ row }">
        <div v-if="row.original.teachings?.length" class="space-y-1">
          <div
            v-for="t in row.original.teachings"
            :key="t.id"
            class="text-xs flex items-center gap-1.5"
          >
            <UIcon name="i-lucide-book-open text-blue-500 shrink-0" />
            <span v-if="t.course" class="font-medium text-gray-800 dark:text-gray-200">
              {{ t.course.fullname }} <span class="text-gray-400 text-[10px] font-mono">(ID: {{ t.course.id }})</span>
            </span>
            <span v-else class="text-gray-400 italic text-[11px]">Belum terhubung Moodle</span>
          </div>
        </div>
        <span v-else class="text-xs text-gray-400 italic">Belum terhubung Moodle</span>
      </template>

      <!-- Actions -->
      <template #action-cell="{ row }">
        <SubjectsTableSubjectActions :subject="row.original" />
      </template>
    </UTable>
  </UCard>
</template>
