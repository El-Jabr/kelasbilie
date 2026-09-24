<script setup lang="ts">
const {
  selectedSemester,
  lockDialogOpen,
  closeLockDialog
} = useSemesterDialogs()

const {
  updatingLock,
  updateLock
} = useSemesterActions()

async function confirm() {
  if (!selectedSemester.value) {
    return
  }

  await updateLock(
    !selectedSemester.value.isLocked
  )
}
</script>

<template>
  <UModal v-model:open="lockDialogOpen">
    <template #content>
      <UCard v-if="selectedSemester">
        <template #header>
          <h2 class="text-lg font-semibold">
            {{
              selectedSemester.isLocked
                ? 'Buka Kunci Semester'
                : 'Kunci Semester'
            }}
          </h2>
        </template>

        <p class="text-sm text-muted">
          Apakah Anda yakin ingin
          <strong>
            {{
              selectedSemester.isLocked
                ? 'membuka kunci'
                : 'mengunci'
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
              @click="closeLockDialog"
            >
              Batal
            </UButton>

            <UButton
              :color="
                selectedSemester.isLocked
                  ? 'warning'
                  : 'neutral'
              "
              :loading="updatingLock"
              @click="confirm"
            >
              {{
                selectedSemester.isLocked
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
