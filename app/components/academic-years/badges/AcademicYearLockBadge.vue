<script setup lang="ts">
defineProps<{
  locked: boolean
}>()
</script>

<template>
  <UBadge
    :color="locked ? 'warning' : 'success'"
    variant="soft"
  >
    {{ locked ? 'Terkunci' : 'Terbuka' }}
  </UBadge>
</template>
