<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { SubjectSchema } from '~~/shared/schemas/subject'

const { subject } = defineProps<{
  subject: SubjectSchema
}>()

const {
  openEditDialog,
  openDeleteDialog
} = useSubjectDialogs()

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Edit Mata Pelajaran',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        openEditDialog(subject)
      }
    }
  ],
  [
    {
      label: 'Hapus',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        openDeleteDialog(subject)
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
