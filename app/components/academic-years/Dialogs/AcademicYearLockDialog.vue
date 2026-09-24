<script setup lang="ts">
const {
  selectedAcademicYear,
  lockDialogOpen,
  closeLockDialog
} = useAcademicYearDialogs()

const {
  updatingLock,
  updateLock
} = useAcademicYearActions()

async function confirm() {
  if (!selectedAcademicYear.value) {
    return
  }

  await updateLock(
    !selectedAcademicYear.value.isLocked
  )
}
</script>

<template>
  <UModal v-model:open="lockDialogOpen">
    <template #content>
      <UCard v-if="selectedAcademicYear">
        <template #header>
          <h2 class="text-lg font-semibold">
            {{
              selectedAcademicYear.isLocked
                ? 'Buka Kunci Tahun Ajaran'
                : 'Kunci Tahun Ajaran'
            }}
          </h2>
        </template>

        <p class="text-sm text-muted">
          Apakah Anda yakin ingin
          <strong>
            {{
              selectedAcademicYear.isLocked
                ? 'membuka kunci'
                : 'mengunci'
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
              @click="closeLockDialog"
            >
              Batal
            </UButton>

            <UButton
              :color="
                selectedAcademicYear.isLocked
                  ? 'warning'
                  : 'neutral'
              "
              :loading="updatingLock"
              @click="confirm"
            >
              {{
                selectedAcademicYear.isLocked
                  ? 'Buka Kunci'
                  : 'Kunci'
              }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
