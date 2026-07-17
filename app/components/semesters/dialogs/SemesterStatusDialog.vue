<script setup lang="ts">
const {
  selectedSemester,
  statusDialogOpen,
  closeStatusDialog
} = useSemesterDialogs()

const {
  updatingStatus,
  updateStatus
} = useSemesterActions()

async function confirm() {
  if (!selectedSemester.value) {
    return
  }

  await updateStatus(
    !selectedSemester.value.isActive
  )
}
</script>

<template>
  <UModal v-model:open="statusDialogOpen">
    <template #content>
      <UCard v-if="selectedSemester">
        <template #header>
          <h2 class="text-lg font-semibold">
            {{
              selectedSemester.isActive
                ? 'Nonaktifkan Semester'
                : 'Aktifkan Semester'
            }}
          </h2>
        </template>

        <p class="text-sm text-muted">
          Apakah Anda yakin ingin
          <strong>
            {{
              selectedSemester.isActive
                ? 'menonaktifkan'
                : 'mengaktifkan'
            }}
          </strong>
          semester
          <strong>
            {{ selectedSemester.type === 'GANJIL' ? 'Ganjil' : 'Genap' }}
          </strong>
          tahun ajaran
          <strong>{{ selectedSemester.academicYear.name }}</strong>?
        </p>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="soft"
              @click="closeStatusDialog"
            >
              Batal
            </UButton>

            <UButton
              :color="
                selectedSemester.isActive
                  ? 'error'
                  : 'success'
              "
              :loading="updatingStatus"
              @click="confirm"
            >
              {{
                selectedSemester.isActive
                  ? 'Nonaktifkan'
                  : 'Aktifkan'
              }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
