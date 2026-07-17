<script setup lang="ts">
defineProps<{
  type: 'GANJIL' | 'GENAP'
}>()
</script>

<template>
  <UBadge
    :color="type === 'GANJIL' ? 'primary' : 'secondary'"
    variant="soft"
  >
    {{ type === 'GANJIL' ? 'Ganjil' : 'Genap' }}
  </UBadge>
</template>
