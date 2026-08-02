<script setup lang="ts">
import { useHomerooms } from '~/composables/useHomerooms'

definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Wali Kelas'
})

const { fetchHomerooms } = useHomerooms()

onMounted(() => {
  fetchHomerooms()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold">
        Penetapan Wali Kelas (Homeroom)
      </h1>

      <p class="text-muted text-sm text-gray-500">
        Kelola wali kelas untuk masing-masing rombongan belajar pada semester aktif.
      </p>
    </div>

    <HomeroomsToolbarHomeroomToolbar />
    <HomeroomsTableHomeroomTable />
    <HomeroomsTableHomeroomPagination />
    
    <HomeroomsDialogsHomeroomCreateDialog />
    <HomeroomsDialogsHomeroomEditDialog />
    <HomeroomsDialogsHomeroomDeleteDialog />
  </div>
</template>
