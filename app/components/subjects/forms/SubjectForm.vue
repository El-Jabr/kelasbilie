<script setup lang="ts">
import type { CreateSubjectSchema } from '~~/shared/schemas/subject'

const model = defineModel<CreateSubjectSchema>({
  required: true
})


</script>

<template>
  <div class="space-y-4">
    <!-- Kode Mata Pelajaran -->
    <UFormField
      label="Kode Mata Pelajaran"
      name="code"
      required
    >
      <UInput
        v-model="model.code"
        class="w-full"
        placeholder="Contoh: MTK8, IPA7"
      />
    </UFormField>

    <!-- Nama Mata Pelajaran -->
    <UFormField
      label="Nama Mata Pelajaran"
      name="name"
      required
    >
      <UInput
        v-model="model.name"
        class="w-full"
        placeholder="Contoh: Matematika Kelas 8"
      />
    </UFormField>


  </div>
</template>
