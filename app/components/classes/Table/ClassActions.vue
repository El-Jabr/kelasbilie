<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { ClassSchema } from '~~/shared/schemas/class'

const {
  classroom
} = defineProps<{
  classroom: ClassSchema
}>()

const {
  openEditDialog,
  openDeleteDialog
} = useClassDialogs()

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Edit Kelas',
      icon: 'i-lucide-pencil',
      onSelect: () => {
        openEditDialog(classroom)
      }
    }
  ],
  [
    {
      label: 'Hapus',
      icon: 'i-lucide-trash-2',
      color: 'error',
      onSelect: () => {
        openDeleteDialog(classroom)
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
