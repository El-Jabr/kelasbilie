<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { SemesterSchema } from '~~/shared/schemas/semester'

const {
  semester
} = defineProps<{
  semester: SemesterSchema
}>()

const {
  openEditDialog,
  openStatusDialog,
  // openLockDialog,
  openDeleteDialog
} = useSemesterDialogs()

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Edit Semester',
      icon: 'i-lucide-pencil',
      disabled: semester.isLocked,
      onSelect: () => {
        openEditDialog(semester)
      }
    }
  ],
  [
    {
      label: semester.isActive
        ? 'Nonaktifkan'
        : 'Aktifkan',

      icon: semester.isActive
        ? 'i-lucide-circle-off'
        : 'i-lucide-circle-check',

      color: semester.isActive
        ? 'error'
        : 'success',

      onSelect: () => {
        openStatusDialog(semester)
      }
    },
    {
      label: semester.isLocked
        ? 'Buka Kunci'
        : 'Kunci',

      icon: semester.isLocked
        ? 'i-lucide-lock-open'
        : 'i-lucide-lock',

      color: semester.isLocked
        ? 'warning'
        : 'neutral'

      // onSelect: () => {
      //   openLockDialog(semester)
      // }
    }
  ],
  [
    {
      label: 'Hapus',
      icon: 'i-lucide-trash-2',
      color: 'error',
      disabled: semester.isLocked,
      onSelect: () => {
        openDeleteDialog(semester)
      }
    }
  ]
])
</script>

<template>
  <UDropdownMenu :items="items">
    <UButton
      icon="i-lucide-ellipsis"
      color="neutral"
      variant="ghost"
    />
  </UDropdownMenu>
</template>
