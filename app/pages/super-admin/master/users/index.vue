<script setup lang="ts">

useSeoMeta({
  title: 'Users'
})

const { fetchUsers } = useUsers()

await fetchUsers()
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

    <UsersToolbar />

    <UsersTable />

    <UsersPagination />

    <UsersRoleDialog />

  </UContainer>
</template>
