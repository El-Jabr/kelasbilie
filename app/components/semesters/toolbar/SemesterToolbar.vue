<script setup lang="ts">
const {
  academicYearId,
  active,
  loading,
  refresh,
  resetFilter
} = useSemesters()

const {
  academicYears
} = useAcademicYears()

const {
  openCreateDialog
} = useSemesterDialogs()

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

const academicYearOptions = computed(() => [
  {
    label: 'Semua Tahun Ajaran',
    value: ''
  },
  ...academicYears.value.map(item => ({
    label: item.name,
    value: item.id
  }))
])

watch(academicYearId, () => {
  refresh()
})

watch(active, () => {
  refresh()
})
</script>

<template>
  <UCard>
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex flex-1 flex-col gap-3 md:flex-row">
        <USelect
          v-model="academicYearId"
          :items="academicYearOptions"
          value-key="value"
          label-key="label"
          class="w-full md:w-64"
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
          Tambah Semester
        </UButton>
      </div>
    </div>
  </UCard>
</template>
