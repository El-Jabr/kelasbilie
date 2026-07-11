<script setup lang="ts">
const {
  selectedUser,
  statusDialogOpen,
  closeStatusDialog
} = useUserDialogs()

const {
  updatingStatus,
  updateStatus
} = useUserActions()

async function save() {
  if (!selectedUser.value) {
    return
  }

  await updateStatus(!selectedUser.value.isActive)
}
</script>

<template>
  <UModal v-model:open="statusDialogOpen">
    <template #content>
      <UCard v-if="selectedUser">
        <template #header>
          <div class="flex items-center gap-3">
            <div
              class="flex size-10 items-center justify-center rounded-full"
              :class="
                selectedUser.isActive
                  ? 'bg-error/10'
                  : 'bg-success/10'
              "
            >
              <UIcon
                :name="
                  selectedUser.isActive
                    ? 'i-lucide-user-x'
                    : 'i-lucide-user-check'
                "
                :class="
                  selectedUser.isActive
                    ? 'text-error'
                    : 'text-success'
                "
                class="size-6"
              />
            </div>

            <div>
              <h2 class="text-lg font-semibold">
                {{
                  selectedUser.isActive
                    ? 'Nonaktifkan User'
                    : 'Aktifkan User'
                }}
              </h2>

              <p class="text-sm text-muted">
                Konfirmasi perubahan status user.
              </p>
            </div>
          </div>
        </template>

        <div class="space-y-5">
          <UAlert
            :color="selectedUser.isActive ? 'error' : 'success'"
            variant="soft"
            :icon="
              selectedUser.isActive
                ? 'i-lucide-triangle-alert'
                : 'i-lucide-circle-check'
            "
            :title="
              selectedUser.isActive
                ? 'User akan dinonaktifkan.'
                : 'User akan diaktifkan.'
            "
            :description="
              selectedUser.isActive
                ? 'User tidak dapat login sampai diaktifkan kembali.'
                : 'User dapat kembali login ke sistem.'
            "
          />

          <UFormField label="Username">
            <UInput
              :model-value="selectedUser.username"
              disabled
              class="w-full"
            />
          </UFormField>

          <UFormField label="Nama Lengkap">
            <UInput
              :model-value="selectedUser.fullname"
              disabled
              class="w-full"
            />
          </UFormField>

          <UFormField label="Role">
            <UInput
              :model-value="selectedUser.role"
              disabled
              class="w-full"
            />
          </UFormField>
        </div>

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
              :color="selectedUser.isActive ? 'error' : 'success'"
              :loading="updatingStatus"
              @click="save"
            >
              {{
                selectedUser.isActive
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
