<script setup lang="ts">
defineProps<{
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  color?: 'error' | 'warning' | 'primary' | 'neutral' | 'success'
  icon?: string
  loading?: boolean
}>()

const emit = defineEmits<{ close: [boolean] }>()
</script>

<template>
  <UModal
    :close="{ onClick: () => emit('close', false) }"
    :title="title || 'Konfirmasi Tindakan'"
  >
    <template #body>
      <div class="flex items-start gap-4 py-2">
        <div
          class="p-2.5 rounded-2xl shrink-0"
          :class="[
            color === 'warning' ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' :
            color === 'primary' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400' :
            'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
          ]"
        >
          <UIcon :name="icon || (color === 'warning' ? 'i-lucide-alert-triangle' : 'i-lucide-badge-alert')" class="w-8 h-8" />
        </div>
        <div class="space-y-1">
          <p class="text-sm font-medium text-gray-800 dark:text-gray-200">
            {{ message || 'Apakah Anda yakin ingin melanjutkan tindakan ini?' }}
          </p>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="soft"
          :label="cancelText || 'Batal'"
          class="cursor-pointer"
          @click="emit('close', false)"
        />
        <UButton
          :color="color || 'error'"
          :label="confirmText || 'Ya, Lanjutkan'"
          :loading="loading"
          class="cursor-pointer font-bold"
          @click="emit('close', true)"
        />
      </div>
    </template>
  </UModal>
</template>
