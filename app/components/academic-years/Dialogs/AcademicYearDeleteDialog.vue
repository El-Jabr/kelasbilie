<script setup lang="ts">
const {
  selectedAcademicYear,
  deleteDialogOpen,
  closeDeleteDialog
} = useAcademicYearDialogs()

const {
  deleting,
  deleteAcademicYear
} = useAcademicYearActions()

async function confirm() {
  if (!selectedAcademicYear.value) {
    return
  }

  await deleteAcademicYear()
}
</script>

<template>
  <UModal v-model:open="deleteDialogOpen">
    <template #content>
      <UCard v-if="selectedAcademicYear">
        <template #header>
          <h2 class="text-lg font-semibold text-error">
            Hapus Tahun Ajaran
          </h2>
        </template>

        <div class="space-y-3">
          <p class="text-sm text-muted">
            Apakah Anda yakin ingin menghapus tahun ajaran berikut?
          </p>

          <div class="rounded-lg border p-4">
            <div class="font-medium">
              {{ selectedAcademicYear.name }}
            </div>

            <div class="mt-1 text-sm text-muted">
              Tindakan ini tidak dapat dibatalkan.
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
