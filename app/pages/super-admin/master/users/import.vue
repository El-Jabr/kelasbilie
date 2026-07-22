<script setup lang="ts">
const {
  preview,
  loadingImport,
  importUsers,
  reset,
  totalValid,
  importResult
} = useUserImport()

const showResult = ref(false)

async function handleImport() {
  await importUsers()

  if (importResult.value) {
    showResult.value = true
    console.log('import-result', importResult.value)
  }
}
</script>

<template>
  <UContainer class="py-6 space-y-6">
    <div class="flex flex-col-reverse gap-4 md:flex-row md:items-start md:justify-between">
      <div class="max-w-4xl">
        <h1 class="text-2xl font-bold">
          Import Users
        </h1>
        <p class="text-muted">
          Import data user menggunakan file Excel atau CSV.
        </p>
      </div>

      <UButton
        icon="i-lucide-chevron-left"
        to="/super-admin/master/users"
        color="neutral"
        variant="subtle"
        size="xl"
        class="self-start md:self-auto rounded-full"
      />
    </div>

    <!-- Upload -->
    <UsersImportUploader />

    <!-- Summary -->
    <UsersImportSummary v-if="preview" />

    <!-- Toolbar -->
    <UsersImportToolbar v-if="preview" />

    <!-- Table -->
    <UsersImportTable v-if="preview" />

    <!-- Sticky Footer -->
    <div
      v-if="preview"
      class="sticky bottom-0 z-10 border-t bg-default/90 backdrop-blur"
    >
      <div
        class="flex items-center justify-between px-6 py-4"
      >
        <div class="text-sm text-muted">
          {{ totalValid }} data siap diimport
        </div>

        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-rotate-ccw"
            @click="reset"
          >
            Import File Baru
          </UButton>

          <UButton
            color="primary"
            icon="i-lucide-upload"
            :loading="loadingImport"
            :disabled="totalValid === 0"
            @click="handleImport"
          >
            Import {{ totalValid }} User
          </UButton>
        </div>
      </div>
    </div>

    <!-- Result -->

    <!-- <UsersImportResultDialog
      v-model="showResult"
    /> -->
  </UContainer>
</template>
