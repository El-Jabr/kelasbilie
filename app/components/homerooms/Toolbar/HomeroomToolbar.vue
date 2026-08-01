<script setup lang="ts">
const {
  loading,
  search,
  refresh,
  resetFilter
} = useHomerooms()

const { openCreateDialog } = useHomeroomDialogs()
</script>

<template>
  <UCard :ui="{ body: 'p-4 sm:p-5' }">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <!-- Search Input -->
      <div class="w-full lg:w-80">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Cari wali kelas, guru, atau kelas..."
          class="w-full"
          size="md"
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
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
          v-if="search"
          color="neutral"
          variant="subtle"
          icon="i-lucide-filter-x"
          size="md"
          class="flex-1 sm:flex-initial justify-center"
          @click="resetFilter"
        >
          Reset Filter
        </UButton>

        <UButton
          color="primary"
          icon="i-lucide-plus"
          size="md"
          class="w-full sm:w-auto justify-center font-semibold"
          @click="openCreateDialog"
        >
          Assign Wali Kelas
        </UButton>
      </div>
    </div>
  </UCard>
</template>
