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
  <UCard>
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex flex-1 flex-col gap-3 md:flex-row">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Cari kelas..."
          class="flex-1"
        />

        <UInput
          v-model="level"
          type="number"
          min="0"
          icon="i-lucide-layers"
          placeholder="Tingkat kelas"
          class="w-full md:w-52"
        />
      </div>

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
          Tambah Kelas
        </UButton>
      </div>
    </div>
  </UCard>
</template>
