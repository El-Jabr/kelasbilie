<script setup lang="ts">
import { vMaska } from 'maska/vue'
import type {
  AcademicYearSchema
} from '~~/shared/schemas/academic-year'

defineProps<{
  mode: 'create' | 'edit'
}>()

const model = defineModel<AcademicYearSchema>({
  required: true
})
</script>

<template>
  <div class="space-y-5">
    <UFormField
      label="Tahun Ajaran"
      required
      description="Contoh: 2026/2027"
    >
      <UInput
        v-model="model.name"
        v-maska="'####/####'"
        class="w-full"
        placeholder="2026/2027"
      />
    </UFormField>
  </div>
</template>
