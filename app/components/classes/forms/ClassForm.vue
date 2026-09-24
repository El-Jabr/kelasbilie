<script setup lang="ts">
import type { CreateClassSchema } from '~~/shared/schemas/class'

const model = defineModel<CreateClassSchema>({
  required: true
})

// Opsi tingkat kelas (7/8/9 untuk SMP, bisa diperluas)
const levelOptions = [
  { label: 'VII', value: 7 },
  { label: 'VIII', value: 8 },
  { label: 'IX', value: 9 }
]
</script>

<template>
  <div class="space-y-5">
    <!-- Nama Kelas -->
    <UFormField
      label="Nama Kelas / Rombel"
      required
      description="Contoh: IPA A, SKT B, VII-1"
    >
      <UInput
        v-model="model.name"
        class="w-full"
        placeholder="Contoh: VII A"
      />
    </UFormField>

    <!-- Tingkat — Radio Visual -->
    <UFormField
      label="Tingkat Kelas"
      required
    >
      <div class="flex gap-3 mt-1">
        <button
          v-for="opt in levelOptions"
          :key="opt.value"
          type="button"
          class="flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer"
          :class="model.level === opt.value
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
            : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400 dark:hover:border-gray-500'"
          @click="model.level = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </UFormField>

    <!-- Lokasi: Ruangan, Gedung, Lantai dalam grid -->
    <div class="pt-2">
      <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Lokasi
      </p>
      <div class="grid grid-cols-2 gap-3">
        <UFormField label="Ruangan">
          <UInput
            v-model="model.room"
            class="w-full"
            placeholder="Contoh: Ruang 1"
          />
        </UFormField>

        <UFormField label="Lantai">
          <UInput
            v-model.number="model.floor"
            type="number"
            min="0"
            class="w-full"
            placeholder="Contoh: 1"
          />
        </UFormField>

        <UFormField
          label="Gedung"
          class="col-span-2"
        >
          <UInput
            v-model="model.building"
            class="w-full"
            placeholder="Contoh: Al-Hikmah (opsional)"
          />
        </UFormField>
      </div>
    </div>
  </div>
</template>
