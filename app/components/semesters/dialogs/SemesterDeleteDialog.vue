<script setup lang="ts">
const {
  selectedSemester,
  deleteDialogOpen,
  closeDeleteDialog
} = useSemesterDialogs()

const {
  deleting,
  deleteSemester
} = useSemesterActions()

async function confirm() {
  if (!selectedSemester.value) {
    return
  }

  await deleteSemester()
}
</script>

<template>
  <UModal v-model:open="deleteDialogOpen">
    <template #content>
      <UCard v-if="selectedSemester">
        <template #header>
          <h2 class="text-lg font-semibold text-error">
            Hapus Semester
          </h2>
        </template>

        <div class="space-y-3">
          <p class="text-sm text-muted">
            Apakah Anda yakin ingin menghapus semester berikut?
          </p>

          <div class="rounded-lg border p-4">
            <div class="font-medium">
              {{ selectedSemester.type }}
            </div>

            <div class="mt-1 text-sm text-muted">
              {{ selectedSemester.academicYear.name }}
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
