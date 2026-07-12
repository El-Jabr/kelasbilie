<script setup lang="ts">
import { UCheckbox } from '#components'
import type { TableColumn } from '@nuxt/ui'

const {
  users,
  loading
} = useUsers()

const rowSelection = ref ({})
const table = useTemplateRef('table')
const selectedRows = computed<UserItem[]>(() => {
  return (
    table.value?.tableApi
      ?.getSelectedRowModel()
      .rows
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((row: { original: any }) => row.original) ?? []
  )
})

watch(selectedRows, (rows) => {
  console.log('selectedRows', rows)
  emit('selectionChange', rows)
})

const columns: TableColumn<UserItem>[] = [
  {
    id: 'select'
  },
  {
    accessorKey: 'username',
    header: 'Username'
  },
  {
    accessorKey: 'fullname',
    header: 'Nama'
  },
  {
    accessorKey: 'email',
    header: 'Email'
  },
  {
    accessorKey: 'role',
    header: 'Role'
  },
  {
    accessorKey: 'moodle',
    header: 'Moodle'
  },
  {
    accessorKey: 'status',
    header: 'Status'
  },
  {
    accessorKey: 'createdAt',
    header: 'Dibuat'
  },
  {
    id: 'action'
  }
]

const emit = defineEmits<{
  selectionChange: [UserItem[]]
}>()

function clearSelection() {
  rowSelection.value = {}
}

defineExpose({
  clearSelection
})
</script>

<template>
  <UCard>
    <UTable
      ref="table"
      v-model:row-selection="rowSelection"
      :data="users"
      :columns="columns"
      :loading="loading"
      class="flex-1"
    >
      <template #select-header="{ table }">
        <UCheckbox
          :model-value="table.getIsAllPageRowsSelected()"
          @update:model-value="val => table.toggleAllPageRowsSelected(val === 'indeterminate' ? false : val)"
        />
      </template>

      <template #select-cell="{ row }">
        <UCheckbox
          :model-value="row.getIsSelected()"
          @update:model-value="val => row.toggleSelected(val === 'indeterminate' ? false : val)"
        />
      </template>
      <template #role-cell="{ row }">
        <UsersBadgesUserRoleBadge :role="row.original.role" />
      </template>

      <template #status-cell="{ row }">
        <UsersBadgesUserStatusBadge :active="row.original.isActive" />
      </template>

      <template #moodle-cell="{ row }">
        <UsersBadgesUserMoodleBadge :moodle-user-id="row.original.moodleUserId" />
      </template>
      <template #createdAt-cell="{ row }">
        {{ new Date(row.original.createdAt).toLocaleDateString('id-ID') }}
      </template>

      <template #action-cell="{ row }">
        <UsersTableUserActions :user="row.original" />
      </template>
    </UTable>
  </UCard>
</template>
