<script setup lang="ts">
const props = defineProps<{
  open: boolean
  users: any[]
  action: 'activate' | 'deactivate'
}>()

const emit = defineEmits<{
  'update:open': [boolean]
  'confirm': []
}>()

const isActivate = computed(() => props.action === 'activate')

const previewUsers = computed(() => props.users.slice(0, 5))

const remainCount = computed(() =>
  Math.max(props.users.length - 5, 0)
)
</script>

<template>
  <UModal
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon
              :name="
                isActivate
                  ? 'i-lucide-user-check'
                  : 'i-lucide-user-x'
              "
              :class="
                isActivate
                  ? 'text-success'
                  : 'text-error'
              "
              class="size-7"
            />

            <div>
              <h2 class="font-semibold">
                {{
                  isActivate
                    ? 'Aktifkan User'
                    : 'Nonaktifkan User'
                }}
              </h2>

              <p class="text-sm text-muted">
                {{ users.length }} user dipilih
              </p>
            </div>
          </div>
        </template>

        <div class="space-y-4">
          <UAlert
            :color="isActivate ? 'success' : 'error'"
            variant="soft"
            :title="
              isActivate
                ? 'User akan diaktifkan.'
                : 'User akan dinonaktifkan.'
            "
          />

          <div class="rounded-lg border p-3">
            <p class="mb-2 text-sm font-medium">
              User yang dipilih
            </p>

            <ul class="space-y-1">
              <li
                v-for="user in previewUsers"
                :key="user.id"
                class="text-sm"
              >
                • {{ user.fullname }}
              </li>
            </ul>

            <p
              v-if="remainCount"
              class="mt-2 text-sm text-muted"
            >
              + {{ remainCount }} user lainnya
            </p>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="soft"
              @click="emit('update:open', false)"
            >
              Batal
            </UButton>

            <UButton
              :color="
                isActivate
                  ? 'success'
                  : 'error'
              "
              @click="emit('confirm')"
            >
              {{
                isActivate
                  ? 'Aktifkan'
                  : 'Nonaktifkan'
              }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
