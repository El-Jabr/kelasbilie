<script setup lang="ts">
import type { CreateSubjectSchema } from '~~/shared/schemas/subject'

defineProps<{ mode?: 'create' | 'edit' }>()

const model = defineModel<CreateSubjectSchema>({
  required: true
})

const codeManuallyEdited = ref(false)

// Auto-generate code dari nama mapel saat mode create
function generateCode(name: string): string {
  if (!name) return ''
  // Ambil huruf kapital atau huruf pertama setiap kata (maks 4 karakter)
  const words = name.trim().split(/\s+/)
  if (words.length === 1 && words[0]) {
    // Satu kata: ambil 3 huruf pertama uppercase
    return words[0].slice(0, 3).toUpperCase()
  }
  // Multi kata: inisial setiap kata, maks 4 karakter
  return words.map(w => w[0] || '').join('').toUpperCase().slice(0, 4)
}

watch(() => model.value.name, (newName) => {
  if (!codeManuallyEdited.value) {
    model.value.code = generateCode(newName)
  }
})

function onCodeInput() {
  codeManuallyEdited.value = true
}
</script>

<template>
  <div class="space-y-4">
    <!-- Nama Mata Pelajaran — diisi pertama agar kode bisa auto-generate -->
    <UFormField
      label="Nama Mata Pelajaran"
      name="name"
      required
    >
      <UInput
        v-model="model.name"
        class="w-full"
        placeholder="Contoh: Matematika, Bahasa Indonesia"
      />
    </UFormField>

    <!-- Kode Mata Pelajaran — auto-generate, bisa di-override -->
    <UFormField
      label="Kode Mata Pelajaran"
      name="code"
      required
      description="Diisi otomatis dari nama, bisa diubah secara manual."
    >
      <div class="flex gap-2 items-center">
        <UInput
          v-model="model.code"
          class="w-full font-mono uppercase"
          placeholder="Contoh: MTK, IPA"
          @input="onCodeInput"
        />
        <UButton
          v-if="codeManuallyEdited"
          type="button"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-rotate-ccw"
          title="Reset ke auto-generate"
          @click="() => { codeManuallyEdited = false; model.code = generateCode(model.name) }"
        />
      </div>
    </UFormField>

    <!-- KKM -->
    <UFormField
      label="KKM"
      name="kkm"
      required
      description="Nilai minimum kelulusan (biasanya 75)"
    >
      <div class="flex items-center gap-3">
        <UInput
          v-model.number="model.kkm"
          type="number"
          min="0"
          max="100"
          class="w-24"
          placeholder="75"
        />
        <span class="text-sm text-gray-500">dari 100</span>
      </div>
    </UFormField>
  </div>
</template>

