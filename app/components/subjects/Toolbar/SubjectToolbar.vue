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
  <UCard>
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Cari kode atau mata pelajaran..."
        class="flex-1"
      />

      <div class="flex flex-wrap gap-2">
        <UButton
          color="neutral"
          variant="soft"
          icon="i-lucide-refresh-cw"
          :loading="loading"
          @click="refresh"
        >
          Refresh
        </UButton>

        <UButton
          color="neutral"
          variant="soft"
          icon="i-lucide-filter-x"
          @click="resetFilter"
        >
          Reset Filter
        </UButton>

        <UButton
          color="primary"
          variant="outline"
          icon="i-lucide-plus"
          @click="openCreateDialog"
        >
          Tambah Mata Pelajaran
        </UButton>
      </div>
    </div>
  </UCard>
</template>
