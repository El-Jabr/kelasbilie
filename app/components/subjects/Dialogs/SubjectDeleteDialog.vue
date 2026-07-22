<script setup lang="ts">
const {
  selectedSubject,
  deleteDialogOpen,
  closeDeleteDialog
} = useSubjectDialogs()

const {
  deleting,
  deleteSubject
} = useSubjectActions()

async function confirm() {
  if (!selectedSubject.value) {
    return
  }

  await deleteSubject()
}
</script>

<template>
  <UModal v-model:open="deleteDialogOpen">
    <template #content>
      <UCard v-if="selectedSubject">
        <template #header>
          <h2 class="text-lg font-semibold text-error">
            Hapus Mata Pelajaran
          </h2>
        </template>

        <div class="space-y-3">
          <p class="text-sm text-muted">
            Apakah Anda yakin ingin menghapus mata pelajaran berikut?
          </p>

          <div class="rounded-lg border p-4">
            <div class="font-medium">
              {{ selectedSubject.name }}
            </div>

            <div class="mt-1 text-sm text-muted">
              Kode: {{ selectedSubject.code }} · Tindakan ini tidak dapat dibatalkan.
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
