<script setup lang="ts">
const open = defineModel<boolean>({
  default: false
})

const {
  importResult,
  reset
} = useUserImport()

function close() {
  open.value = false

  // reset state setelah dialog ditutup
  reset()
}
</script>

<template>
  <UModal v-model:open="open">
    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon
            name="i-lucide-circle-check-big"
            class="size-8 text-success"
          />

          <div>
            <h2 class="text-lg font-semibold">
              Import Selesai
            </h2>

            <p class="text-sm text-muted">
              Proses import user telah selesai.
            </p>
          </div>
        </div>
      </template>

      <div
        v-if="importResult"
        class="space-y-6"
      >
        <div class="grid gap-4 sm:grid-cols-3">
          <UCard>
            <div class="text-center">
              <p class="text-sm text-muted">
                Total
              </p>

              <h2 class="text-3xl font-bold">
                {{ importResult.summary.total }}
              </h2>
            </div>
          </UCard>

          <UCard>
            <div class="text-center">
              <p class="text-sm text-muted">
                Berhasil
              </p>

              <h2 class="text-3xl font-bold text-success">
                {{ importResult.summary.success }}
              </h2>
            </div>
          </UCard>

          <UCard>
            <div class="text-center">
              <p class="text-sm text-muted">
                Gagal
              </p>

              <h2 class="text-3xl font-bold text-error">
                {{ importResult.summary.failed }}
              </h2>
            </div>
          </UCard>
        </div>

        <UAlert
          v-if="importResult.summary.failed === 0"
          color="success"
          variant="soft"
          title="Semua data berhasil diimport."
          icon="i-lucide-check-circle"
        />

        <UAlert
          v-else
          color="warning"
          variant="soft"
          title="Sebagian data gagal diimport."
          :description="`${importResult.summary.failed} data gagal diimport.`"
          icon="i-lucide-triangle-alert"
        />
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton
            icon="i-lucide-check"
            @click="close"
          >
            Selesai
          </UButton>
        </div>
      </template>
    </UCard>
  </UModal>
</template>
