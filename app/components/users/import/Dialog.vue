<script setup lang="ts">
const open = defineModel<boolean>({
  default: false
})

const { importResult, reset } = useUserImport()

function close() {
  open.value = false
  reset()
}
</script>

<template>
  <UModal
    v-model:open="open"
    :ui="{
      content: 'max-w-2xl'
    }"
  >
    <template #content>
      <UCard v-if="importResult">
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

        <div class="space-y-6">
          <div class="grid grid-cols-3 gap-4">
            <UCard>
              <div class="text-center">
                <p class="text-sm text-muted">
                  Total
                </p>
                <p class="text-3xl font-bold">
                  {{ importResult.summary.total }}
                </p>
              </div>
            </UCard>

            <UCard>
              <div class="text-center">
                <p class="text-sm text-muted">
                  Berhasil
                </p>
                <p class="text-3xl font-bold text-success">
                  {{ importResult.summary.success }}
                </p>
              </div>
            </UCard>

            <UCard>
              <div class="text-center">
                <p class="text-sm text-muted">
                  Gagal
                </p>
                <p class="text-3xl font-bold text-error">
                  {{ importResult.summary.failed }}
                </p>
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
            <UButton @click="close">
              Selesai
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
