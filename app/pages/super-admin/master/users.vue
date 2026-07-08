<script setup lang="ts">
import UserImportSummary from '~/components/users/UserImportSummary.vue'
import UserImportTable from '~/components/users/UserImportTable.vue'
import UserImportToolbar from '~/components/users/UserImportToolbar.vue'
import UserImportUploader from '~/components/users/UserImportUploader.vue'

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
  }
}
</script>

<template>
  <UContainer class="py-6 space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold">
        Import Users
      </h1>

      <p class="text-muted">
        Import data user menggunakan file Excel atau CSV.
      </p>
    </div>

    <!-- Upload -->
    <UserImportUploader />

    <!-- Summary -->
    <UserImportSummary v-if="preview" />

    <!-- Toolbar -->
    <UserImportToolbar v-if="preview" />

    <!-- Table -->
    <UserImportTable v-if="preview" />

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

    <UserImportResultDialog
      v-model="showResult"
    />
  </UContainer>
</template>
