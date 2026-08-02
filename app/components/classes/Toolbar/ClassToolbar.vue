<script setup lang="ts">
const {
  search,
  level,
  loading,
  refresh,
  resetFilter
} = useClasses()

const { openCreateDialog } = useClassDialogs()

const debouncedRefresh = useDebounceFn(() => {
  refresh()
}, 500)

watch([search, level], debouncedRefresh)
</script>

<template>
  <UCard :ui="{ body: 'p-4 sm:p-5' }">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <!-- Left Side: Inputs -->
      <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center w-full lg:w-auto">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Cari kelas..."
          class="w-full sm:w-60"
          size="md"
        />

        <UInput
          v-model="level"
          type="number"
          min="0"
          icon="i-lucide-layers"
          placeholder="Tingkat kelas"
          class="w-full sm:w-44"
          size="md"
        />
      </div>

      <!-- Right Side: Action Buttons -->
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
          Tambah Kelas
        </UButton>
      </div>
    </div>
  </UCard>
</template>
