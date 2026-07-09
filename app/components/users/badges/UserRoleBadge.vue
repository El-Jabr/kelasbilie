<script setup lang="ts">
type Role = 'ADMIN' | 'TEACHER' | 'STUDENT'

defineProps<{
  role: Role
}>()

const colorMap: Record<Role, 'primary' | 'warning' | 'error' | 'neutral'> = {
  ADMIN: 'error',
  TEACHER: 'warning',
  STUDENT: 'primary'
}

const labelMap: Record<Role, string> = {
  ADMIN: 'Admin',
  TEACHER: 'Teacher',
  STUDENT: 'Student'
}
</script>

<template>
  <UBadge
    :color="colorMap[role]"
    variant="soft"
  >
    {{ labelMap[role] }}
  </UBadge>
</template>
