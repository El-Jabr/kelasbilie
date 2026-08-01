<script setup lang="ts">
const {
  search,
  loading,
  refresh,
  resetFilter
} = useSubjects()

const { openCreateDialog } = useSubjectDialogs()

const debouncedRefresh = useDebounceFn(() => {
  refresh()
}, 500)

watch(search, debouncedRefresh)
</script>

<template>
  <UCard :ui="{ body: 'p-4 sm:p-5' }">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <!-- Search Input -->
      <div class="w-full sm:w-80">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Cari kode atau mata pelajaran..."
          class="w-full"
          size="md"
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
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
          Tambah Mata Pelajaran
        </UButton>
      </div>
    </div>
  </UCard>
</template>
