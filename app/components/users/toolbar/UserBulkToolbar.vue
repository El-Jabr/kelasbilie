<script setup lang="ts">
const { users } = defineProps<{
  users: UserItem[]
}>()

const emit = defineEmits<{
  activate: []
  deactivate: []
  clear: []
}>()
</script>

<template>
  <UAlert
    v-if="users.length"
    color="primary"
    variant="soft"
  >
    <template #title>
      {{ users.length }} user dipilih
    </template>

    <template #description>
      Pilih aksi yang ingin dilakukan.
    </template>

    <template #actions>
      <div class="flex gap-2">
        <UButton
          size="sm"
          color="success"
          icon="i-lucide-user-check"
          @click="emit('activate')"
        >
          Aktifkan
        </UButton>

        <UButton
          size="sm"
          color="error"
          icon="i-lucide-user-x"
          @click="emit('deactivate')"
        >
          Nonaktifkan
        </UButton>

        <UButton
          size="sm"
          color="neutral"
          variant="outline"
          icon="i-lucide-x"
          @click="emit('clear')"
        >
          Batal
        </UButton>
      </div>
    </template>
  </UAlert>
</template>
