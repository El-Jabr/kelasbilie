<script setup lang="ts">
import { useUsers } from '~/composables/useUsers'

const {
  search,
  role,
  active,
  loading,
  refresh,
  resetFilter
} = useUsers()

const {
  openCreateDialog
} = useUserDialogs()

const roleOptions = [
  {
    label: 'Semua Role',
    value: 'ALL'
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
  <UCard :ui="{ body: 'p-4 sm:p-5' }">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <!-- Left Side: Inputs -->
      <div class="flex flex-col gap-2.5 sm:flex-row sm:items-center w-full lg:w-auto">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Cari user..."
          class="w-full sm:w-60"
          size="md"
        />

        <USelect
          v-model="role"
          :items="roleOptions"
          value-key="value"
          label-key="label"
          class="w-full sm:w-40"
          size="md"
        />

        <USelect
          v-model="active"
          :items="statusOptions"
          value-key="value"
          label-key="label"
          class="w-full sm:w-40"
          size="md"
        />
      </div>

      <!-- Right Side: Action Buttons -->
      <div class="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full lg:w-auto justify-end">
        <!-- 50:50 Row on mobile for Refresh & Reset Filter -->
        <div class="flex items-center gap-2 w-full sm:w-auto">
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
        </div>

        <!-- Full width on mobile for Import User -->
        <UButton
          color="primary"
          icon="i-lucide-upload"
          size="md"
          to="/super-admin/master/users/import"
          class="w-full sm:w-auto justify-center font-semibold"
        >
          Import User
        </UButton>

        <!-- Full width on mobile for Tambah User -->
        <UButton
          color="primary"
          icon="i-lucide-plus"
          size="md"
          class="w-full sm:w-auto justify-center font-semibold"
          @click="openCreateDialog"
        >
          Tambah User
        </UButton>
      </div>
    </div>
  </UCard>
</template>
