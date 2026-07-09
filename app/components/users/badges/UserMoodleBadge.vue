<script setup lang="ts">
defineProps<{
  moodleUserId: number | null
}>()
</script>

<template>
  <UBadge
    :color="moodleUserId ? 'success' : 'neutral'"
    variant="soft"
  >
    {{ moodleUserId ? 'Sinkron' : 'Belum Sinkron' }}
  </UBadge>
</template>
