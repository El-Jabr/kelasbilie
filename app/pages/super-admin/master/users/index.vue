<script setup lang="ts">
import { ref } from 'vue'
import { useUsers } from '~/composables/useUsers'

definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Users'
})

const bulkDialogOpen = ref(false)
const bulkAction = ref<'activate' | 'deactivate'>('activate')
const selectedUsers = ref<any[]>([])

const userTable = useTemplateRef('userTable')

const { bulkUpdateStatus } = useUserActions()

const { fetchUsers } = useUsers()

await fetchUsers()

function bulkActivate() {
  bulkAction.value = 'activate'
  bulkDialogOpen.value = true
}

function bulkDeactivate() {
  bulkAction.value = 'deactivate'
  bulkDialogOpen.value = true
}

async function confirmBulkStatus() {
  await bulkUpdateStatus(
    selectedUsers.value.map((user: any) => user.id),
    bulkAction.value === 'activate'
  )

  bulkDialogOpen.value = false

  userTable.value?.clearSelection()
}

function clearSelection() {
  userTable.value?.clearSelection()
}
</script>

<template>
  <UContainer class="space-y-6 py-6">
    <div>
      <h1 class="text-2xl font-bold">
        Users
      </h1>

      <p class="text-muted">
        Kelola seluruh pengguna aplikasi.
      </p>
    </div>

    <!-- <PageHeader
      title="Users"
      description="Kelola seluruh pengguna aplikasi."
    /> -->

    <UsersToolbarUserToolbar />
    <UsersToolbarUserBulkToolbar
      :users="selectedUsers"
      @activate="bulkActivate"
      @deactivate="bulkDeactivate"
      @clear="clearSelection"
    />
    <UsersTableUserTable
      ref="userTable"
      @selection-change="selectedUsers = $event"
    />
    <UsersTableUserPagination />
    <UsersDialogsUserRoleDialog />
    <UsersDialogsUserCreateDialog />
    <UsersDialogsUserEditDialog />
    <UsersDialogsUserStatusDialog />
    <UsersDialogsUserBulkStatusDialog
      v-model:open="bulkDialogOpen"
      :users="selectedUsers"
      :action="bulkAction"
      @confirm="confirmBulkStatus"
    />
  </UContainer>
</template>
