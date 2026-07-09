<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ImportRow } from '~/composables/useUserImport'

const { filteredRows } = useUserImport()

const columns: TableColumn<ImportRow>[] = [
  {
    accessorKey: 'row',
    header: '#'
  },
  {
    accessorKey: 'username',
    header: 'Username'
  },
  {
    accessorKey: 'fullname',
    header: 'Nama Lengkap'
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'password',
    header: 'Password'
  },
  {
    accessorKey: 'role',
    header: 'Role'
  },
  {
    accessorKey: 'valid',
    header: 'Status',
    cell: ({ row }) => row.original.valid
  },
  {
    accessorKey: 'errors',
    header: 'Keterangan',
    cell: ({ row }) => row.original.errors
  }
]
</script>

<template>
  <UCard
    v-if="filteredRows.length"
    class="overflow-hidden"
  >
    <UTable
      :data="filteredRows"
      :columns="columns"
      sticky
    >
      <template #valid-cell="{ row }">
        <UBadge
          :color="row.original.valid ? 'success' : 'error'"
          variant="soft"
        >
          {{ row.original.valid ? 'Valid' : 'Invalid' }}
        </UBadge>
      </template>

      <template #errors-cell="{ row }">
        <div
          v-if="row.original.errors.length"
          class="flex flex-wrap gap-1"
        >
          <UBadge
            v-for="error in row.original.errors"
            :key="error"
            color="error"
            variant="soft"
          >
            {{ error }}
          </UBadge>
        </div>

        <span
          v-else
          class="text-muted"
        >
          -
        </span>
      </template>

      <template #password-cell="{ row }">
        <code class="text-xs">
          {{ row.original.password }}
        </code>
      </template>
    </UTable>
  </UCard>

  <UCard
    v-else-if="filteredRows.length === 0"
  >
    <div class="py-12 text-center">
      <UIcon
        name="i-lucide-search-x"
        class="mx-auto mb-4 size-12 text-muted"
      />

      <p class="font-medium">
        Tidak ada data
      </p>

      <p class="text-sm text-muted">
        Tidak ada data yang sesuai filter.
      </p>
    </div>
  </UCard>
</template>
