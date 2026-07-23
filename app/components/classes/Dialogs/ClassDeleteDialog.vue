<script setup lang="ts">
const {
  selectedClass,
  deleteDialogOpen,
  closeDeleteDialog
} = useClassDialogs()

const {
  deleting,
  deleteClass
} = useClassActions()

async function confirm() {
  if (!selectedClass.value) {
    return
  }

  await deleteClass()
}
</script>

<template>
  <UModal v-model:open="deleteDialogOpen">
    <template #content>
      <UCard v-if="selectedClass">
        <template #header>
          <h2 class="text-lg font-semibold text-error">
            Hapus Kelas
          </h2>
        </template>

        <div class="space-y-3">
          <p class="text-sm text-muted">
            Apakah Anda yakin ingin menghapus kelas berikut?
          </p>

          <div class="rounded-lg border p-4">
            <div class="font-medium">
              {{ selectedClass.name }}
            </div>

            <div class="mt-1 text-sm text-muted">
              Tingkat {{ selectedClass.level }} · Tindakan ini tidak dapat dibatalkan.
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="soft"
              @click="closeDeleteDialog"
            >
              Batal
            </UButton>

            <UButton
              color="error"
              :loading="deleting"
              @click="confirm"
            >
              Hapus
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
