<script setup lang="ts">
const {
  loading,
  search,
  refresh
} = useHomerooms()

const { openCreateDialog } = useHomeroomDialogs()
</script>

<template>
  <UCard :ui="{ body: 'p-4 sm:p-5' }">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <!-- Search Input -->
      <div class="w-full sm:w-80">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Cari wali kelas, guru, atau kelas..."
          class="w-full"
          size="md"
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2 justify-end w-full sm:w-auto">
        <UButton
          color="neutral"
          variant="subtle"
          icon="i-lucide-refresh-cw"
          size="md"
          :loading="loading"
          class="flex-1 sm:flex-initial justify-center"
          @click="refresh"
        >
          Refresh
        </UButton>

        <UButton
          color="primary"
          icon="i-lucide-plus"
          size="md"
          class="flex-1 sm:flex-initial justify-center"
          @click="openCreateDialog"
        >
          Assign Wali Kelas
        </UButton>
      </div>
    </div>
  </UCard>
</template>
