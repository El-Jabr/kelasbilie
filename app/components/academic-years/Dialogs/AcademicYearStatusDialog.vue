<script setup lang="ts">
const {
  selectedAcademicYear,
  statusDialogOpen,
  closeStatusDialog
} = useAcademicYearDialogs()

const {
  updatingStatus,
  updateStatus
} = useAcademicYearActions()

async function confirm() {
  if (!selectedAcademicYear.value) {
    return
  }

  await updateStatus(
    !selectedAcademicYear.value.isActive
  )
}
</script>

<template>
  <UModal v-model:open="statusDialogOpen">
    <template #content>
      <UCard v-if="selectedAcademicYear">
        <template #header>
          <h2 class="text-lg font-semibold">
            {{
              selectedAcademicYear.isActive
                ? 'Nonaktifkan Tahun Ajaran'
                : 'Aktifkan Tahun Ajaran'
            }}
          </h2>
        </template>

        <p class="text-sm text-muted">
          Apakah Anda yakin ingin
          <strong>
            {{
              selectedAcademicYear.isActive
                ? 'menonaktifkan'
                : 'mengaktifkan'
            }}
          </strong>
          tahun ajaran
          <strong>{{ selectedAcademicYear.name }}</strong>?
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
                selectedAcademicYear.isActive
                  ? 'error'
                  : 'success'
              "
              :loading="updatingStatus"
              @click="confirm"
            >
              {{
                selectedAcademicYear.isActive
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
