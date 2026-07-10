<script setup lang="ts">
import { useUsers } from '~/composables/useUsers'

const {
  users,
  loading
} = useUsers()

const columns = [
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
</script>

<template>
  <UCard>
    <UTable
      :data="users"
      :columns="columns"
      :loading="loading"
      class="flex-1"
    >
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
