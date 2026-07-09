<script setup lang="ts">
const {
  search,
  role,
  active,
  loading,
  refresh,
  resetFilter
} = useUsers()

const roleOptions = [
  {
    label: 'Semua Role',
    value: ''
  },
  {
    label: 'Admin',
    value: 'ADMIN'
  },
  {
    label: 'Teacher',
    value: 'TEACHER'
  },
  {
    label: 'Student',
    value: 'STUDENT'
  }
]

const statusOptions = [
  {
    label: 'Semua Status',
    value: 'all'
  },
  {
    label: 'Aktif',
    value: 'true'
  },
  {
    label: 'Nonaktif',
    value: 'false'
  }
]

const debouncedRefresh = useDebounceFn(() => {
  refresh()
}, 500)

watch(search, debouncedRefresh)

watch([role, active], () => {
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
          placeholder="Cari username, nama atau email..."
          class="flex-1"
        />

        <USelect
          v-model="role"
          :items="roleOptions"
          value-key="value"
          label-key="label"
          class="w-full md:w-52"
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
          icon="i-lucide-upload"
          to="/super-admin/master/users/import"
        >
          Import User
        </UButton>

        <UButton
          color="primary"
          variant="outline"
          icon="i-lucide-plus"
          disabled
        >
          Tambah User
        </UButton>

      </div>

    </div>
  </UCard>
</template>
