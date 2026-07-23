<script setup lang="ts">
import type { CreateClassSchema } from '~~/shared/schemas/class'

const model = defineModel<CreateClassSchema>({
  required: true
})
</script>

<template>
  <div class="space-y-5">
    <UFormField
      label="Nama Kelas"
      required
    >
      <UInput
        v-model="model.name"
        class="w-full"
        placeholder="Contoh: SKT A"
      />
    </UFormField>

    <UFormField
      label="Tingkat"
      required
      description="Masukkan tingkat kelas, misalnya 10, 11, atau 12."
    >
      <UInput
        v-model.number="model.level"
        type="number"
        min="0"
        class="w-full"
        placeholder="Contoh: 10"
      />
    </UFormField>
    <UFormField
      label="Ruang"
      required
      description="Masukkan nama ruang, contoh: ruang 1"
    >
      <UInput
        v-model.number="model.room"
        class="w-full"
        placeholder="Contoh: Ruang 1"
      />
    </UFormField>
    <UFormField
      label="Gedung"
      required
      description="Masukkan nama gedung, misalnya Al-Hikmah"
    >
      <UInput
        v-model.number="model.building"
        class="w-full"
        placeholder="Contoh: Al-Hikmah"
      />
    </UFormField>
    <UFormField
      label="Lantai"
      required
      description="Masukkan nomor lantai, misalnya 1, 2"
    >
      <UInput
        v-model.number="model.floor"
        type="number"
        min="0"
        class="w-full"
        placeholder="Contoh: 1"
      />
    </UFormField>
  </div>
</template>
