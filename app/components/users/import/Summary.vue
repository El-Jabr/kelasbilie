<script setup lang="ts">
const {
  total,
  totalValid,
  totalInvalid
} = useUserImport()

const cards = computed(() => [
  {
    title: 'Total Data',
    value: total.value,
    icon: 'i-lucide-files',
    color: 'neutral'
  },
  {
    title: 'Data Valid',
    value: totalValid.value,
    icon: 'i-lucide-circle-check-big',
    color: 'success'
  },
  {
    title: 'Data Invalid',
    value: totalInvalid.value,
    icon: 'i-lucide-circle-x',
    color: 'error'
  }
])
</script>

<template>
  <div
    v-if="total > 0"
    class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
  >
    <UCard
      v-for="card in cards"
      :key="card.title"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-muted">
            {{ card.title }}
          </p>

          <h2 class="mt-2 text-3xl font-bold">
            {{ card.value }}
          </h2>
        </div>

        <div
          class="rounded-full p-3"
          :class="{
            'bg-green-100 text-green-600 dark:bg-green-900/30': card.color === 'success',
            'bg-red-100 text-red-600 dark:bg-red-900/30': card.color === 'error',
            'bg-gray-100 text-gray-600 dark:bg-gray-800': card.color === 'neutral'
          }"
        >
          <UIcon
            :name="card.icon"
            class="size-7"
          />
        </div>
      </div>
    </UCard>
  </div>
</template>
