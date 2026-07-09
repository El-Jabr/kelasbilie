<script setup lang="ts">
defineProps<{
  active: boolean
}>()
</script>

<template>
  <UBadge
    :color="active ? 'success' : 'error'"
    variant="soft"
  >
    {{ active ? 'Aktif' : 'Nonaktif' }}
  </UBadge>
</template>
