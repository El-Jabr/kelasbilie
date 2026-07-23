<script setup lang="ts">
import type { CreateSubjectSchema } from '~~/shared/schemas/subject'

const model = defineModel<CreateSubjectSchema>({
  required: true
})
</script>

<template>
  <div class="space-y-5">
    <UFormField
      label="Kode Mata Pelajaran"
      required
    >
      <UInput
        v-model="model.code"
        class="w-full"
        placeholder="Contoh: MAT-101"
      />
    </UFormField>

    <UFormField
      label="Nama Mata Pelajaran"
      required
    >
      <UInput
        v-model="model.name"
        class="w-full"
        placeholder="Contoh: Matematika"
      />
    </UFormField>
  </div>
</template>
