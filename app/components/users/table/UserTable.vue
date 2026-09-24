<script setup lang="ts">
import { UCheckbox } from '#components'
import type { TableColumn } from '@nuxt/ui'
import type { UserSchema } from '~~/shared/schemas/user'

const {
  users,
  loading
} = useUsers()

const rowSelection = ref({})
const table = useTemplateRef('table')
const selectedRows = computed<UserSchema[]>(() => {
  return (
    table.value?.tableApi
      ?.getSelectedRowModel()
      .rows
      .map((row: { original: UserSchema }) => row.original) ?? []
  )
})

watch(selectedRows, (rows) => {
  console.log('selectedRows', rows)
  emit('selectionChange', rows)
})

const columns: TableColumn<UserSchema>[] = [
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
    accessorKey: 'isActive',
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
  selectionChange: [UserSchema[]]
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
      <template #select-header="{ table: tableApi }">
        <UCheckbox
          :model-value="tableApi.getIsAllPageRowsSelected()"
          @update:model-value="val => tableApi.toggleAllPageRowsSelected(val === 'indeterminate' ? false : val)"
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

      <template #isActive-cell="{ row }">
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
