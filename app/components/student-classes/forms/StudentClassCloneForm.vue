<script setup lang="ts">
const emit = defineEmits(['success'])

const { semesterOptions } = useStudentClasses()
const { isCloneSubmitting, handleCloneSemester } = useStudentClassActions()

const cloneForm = reactive({
  fromSemesterId: '',
  toSemesterId: '',
  promoteLevel: true
})

async function onSubmit() {
  await handleCloneSemester(cloneForm, () => {
    emit('success')
  })
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-copy" class="w-6 h-6 text-primary-500" />
          <div>
            <h3 class="text-base font-bold">Clone Pembagian Kelas Antar Semester</h3>
            <p class="text-xs text-gray-500">Salin seluruh pembagian kelas dari semester sebelumnya tanpa perlu mendaftarkan siswa satu per satu.</p>
          </div>
        </div>
      </template>

      <div class="space-y-4 py-2">
        <UFormField label="Dari Semester (Sumber Data)" required>
          <USelect
            v-model="cloneForm.fromSemesterId"
            :items="semesterOptions"
            value-key="value"
            label-key="label"
            placeholder="-- Pilih Semester Asal --"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Ke Semester (Tujuan)" required>
          <USelect
            v-model="cloneForm.toSemesterId"
            :items="semesterOptions"
            value-key="value"
            label-key="label"
            placeholder="-- Pilih Semester Tujuan --"
            class="w-full"
          />
        </UFormField>

        <div class="p-4 bg-primary-50 dark:bg-primary-950/30 rounded-xl border border-primary-100 dark:border-primary-900/50 flex items-start gap-3">
          <input
            type="checkbox"
            id="promoteToggle"
            v-model="cloneForm.promoteLevel"
            class="mt-1 rounded border-gray-300 text-primary-600"
          />
          <div>
            <label for="promoteToggle" class="text-sm font-bold text-primary-900 dark:text-primary-100 cursor-pointer">
              Naik Kelas Otomatis (+1 Level)
            </label>
            <p class="text-xs text-primary-700 dark:text-primary-300 mt-0.5">
              Jika diaktifkan, siswa tingkat VII akan otomatis dipindahkan ke VIII, VIII ke IX. Siswa tingkat akhir (IX) yang lulus akan dilewati.
            </p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            type="submit"
            color="primary"
            icon="i-lucide-arrow-right-left"
            class="cursor-pointer"
            :loading="isCloneSubmitting"
          >
            Jalankan Clone Semester
          </UButton>
        </div>
      </template>
    </UCard>
  </form>
</template>
