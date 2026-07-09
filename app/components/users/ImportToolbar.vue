<script setup lang="ts">
const {
  search,
  statusFilter,
  preview,
  previewFile,
  loadingPreview,
  invalidRows
} = useUserImport()

const statusOptions = [
  {
    label: 'Semua',
    value: 'all'
  },
  {
    label: 'Valid',
    value: 'valid'
  },
  {
    label: 'Invalid',
    value: 'invalid'
  }
]

function exportErrors() {
  if (!invalidRows.value.length)
    return

  const headers = [
    'Row',
    'Username',
    'Fullname',
    'Email',
    'Role',
    'Errors'
  ]

  const rows = invalidRows.value.map(row => [
    row.row,
    row.username,
    row.fullname,
    row.email,
    row.role,
    row.errors.join('; ')
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row =>
      row.map(value => `"${value ?? ''}"`).join(',')
    )
  ].join('\n')

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;'
  })

  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')

  link.href = url
  link.download = 'import-errors.csv'

  link.click()

  URL.revokeObjectURL(url)
}
</script>

<template>
  <UCard v-if="preview">
    <div
      class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div class="flex flex-1 gap-3">
        <UInput
          v-model="search"
          class="flex-1"
          icon="i-lucide-search"
          placeholder="Cari username, nama, email..."
        />

        <USelect
          v-model="statusFilter"
          :items="statusOptions"
          value-key="value"
          label-key="label"
          class="w-44"
        />
      </div>

      <div class="flex gap-2">
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="soft"
          :loading="loadingPreview"
          @click="previewFile"
        >
          Refresh
        </UButton>

        <UButton
          icon="i-lucide-download"
          color="error"
          variant="soft"
          :disabled="!invalidRows.length"
          @click="exportErrors"
        >
          Export Error
        </UButton>
      </div>
    </div>
  </UCard>
</template>
