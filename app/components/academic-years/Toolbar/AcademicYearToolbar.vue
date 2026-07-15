<script setup lang="ts">
const {
  search,
  active,
  loading,
  refresh,
  resetFilter
} = useAcademicYears()

const {
  openCreateDialog
} = useAcademicYearDialogs()

const statusOptions = [
  {
    label: 'Semua Status',
    value: 'ALL'
  },
  {
    label: 'Aktif',
    value: 'true'
  },
  {
    label: 'Tidak Aktif',
    value: 'false'
  }
]

const debouncedRefresh = useDebounceFn(() => {
  refresh()
}, 500)

watch(search, debouncedRefresh)

watch(active, () => {
  refresh()
})
</script>

<template>
  <UCard>
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex flex-1 flex-col gap-3 md:flex-row">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Cari Tahun Ajaran..."
          class="flex-1"
        />

        <USelect
          v-model="active"
          :items="statusOptions"
          value-key="value"
          label-key="label"
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
          Tambah Tahun Ajaran
        </UButton>
      </div>
    </div>
  </UCard>
</template>
