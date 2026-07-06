<script setup lang="ts">
defineProps<{
  loading: boolean
}>()
const emit = defineEmits<{ close: [boolean] }>()
</script>

<template>
  <UModal
    :close="{ onClick: () => emit('close', false) }"
    :title="`LOG OUT`"
  >
    <template #body>
      <div class="flex justify-items-normal mb-4 items-center gap-6">
        <Icon
          name="i-lucide-badge-alert"
          class="w-12 h-12 text-red-500"
        />
        <p class="text-md text-neutral-500">
          Are you sure, you want to log out?
        </p>
      </div>
    </template>
    <template #footer>
      <div class="flex gap-2">
        <UButton
          color="neutral"
          label="Dismiss"
          @click="emit('close', false)"
        />
        <UButton
          :loading="loading"
          label="Log Out"
          @click="emit('close', true)"
        />
      </div>
    </template>
  </UModal>
</template>
