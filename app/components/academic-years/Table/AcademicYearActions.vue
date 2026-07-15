<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { AcademicYearSchema } from '~~/shared/schemas/academic-year'

const {
  academicYear
} = defineProps<{
  academicYear: AcademicYearSchema
}>()

const {
  openEditDialog,
  openStatusDialog,
  // openLockDialog,
  openDeleteDialog
} = useAcademicYearDialogs()

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Edit Tahun Ajaran',
      icon: 'i-lucide-pencil',
      disabled: academicYear.isLocked,
      onSelect: () => {
        openEditDialog(academicYear)
      }
    }
  ],
  [
    {
      label: academicYear.isActive
        ? 'Nonaktifkan'
        : 'Aktifkan',

      icon: academicYear.isActive
        ? 'i-lucide-circle-off'
        : 'i-lucide-circle-check',

      color: academicYear.isActive
        ? 'error'
        : 'success',

      onSelect: () => {
        openStatusDialog(academicYear)
      }
    },
    {
      label: academicYear.isLocked
        ? 'Buka Kunci'
        : 'Kunci',

      icon: academicYear.isLocked
        ? 'i-lucide-lock-open'
        : 'i-lucide-lock',

      color: academicYear.isLocked
        ? 'warning'
        : 'neutral'

      // onSelect: () => {
      //   openLockDialog(academicYear)
      // }
    }
  ],
  [
    {
      label: 'Hapus',
      icon: 'i-lucide-trash-2',
      color: 'error',
      disabled: academicYear.isLocked,
      onSelect: () => {
        openDeleteDialog(academicYear)
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
