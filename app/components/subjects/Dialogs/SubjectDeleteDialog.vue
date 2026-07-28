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
  <UModal
    v-model:open="deleteDialogOpen"
    title="Hapus Mata Pelajaran"
    description="Tindakan ini tidak dapat dibatalkan."
  >
    <template #body>
      <div v-if="selectedSubject" class="space-y-3">
        <p class="text-sm text-gray-500">
          Apakah Anda yakin ingin menghapus mata pelajaran berikut?
        </p>

        <div class="rounded-lg border border-gray-200 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/40">
          <div class="font-bold text-gray-900 dark:text-white">
            {{ selectedSubject.name }}
          </div>

          <div class="mt-1 text-sm text-gray-500 font-mono">
            Kode: {{ selectedSubject.code }}
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="soft"
          class="cursor-pointer"
          @click="closeDeleteDialog"
        >
          Batal
        </UButton>

        <UButton
          color="error"
          class="cursor-pointer"
          :loading="deleting"
          @click="confirm"
        >
          Hapus
        </UButton>
      </div>
    </template>
  </UModal>
</template>
