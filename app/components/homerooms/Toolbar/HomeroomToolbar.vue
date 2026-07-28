<script setup lang="ts">
const {
  loading,
  refresh
} = useHomerooms()

const { openCreateDialog } = useHomeroomDialogs()

</script>

<template>
  <UCard>
    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div class="flex-1"></div>

      <div class="flex flex-wrap gap-2">
        <UButton
          color="neutral"
          variant="soft"
          icon="i-lucide-refresh-cw"
          :loading="loading"
          @click="refresh"
        >
          Refresh
        </UButton>

        <UButton
          color="primary"
          variant="outline"
          icon="i-lucide-plus"
          @click="openCreateDialog"
        >
          Assign Wali Kelas
        </UButton>
      </div>
    </div>
  </UCard>
</template>
