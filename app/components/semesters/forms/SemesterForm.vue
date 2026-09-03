<script setup lang="ts">
import type {
  SemesterSchema
} from '~~/shared/schemas/semester'

defineProps<{
  mode: 'create' | 'edit'
}>()

const model = defineModel<SemesterSchema>({
  required: true
})

const { academicYears } = useAcademicYears()

const academicYearOptions = computed(() =>
  academicYears.value.map(item => ({
    label: item.name,
    value: item.id
  }))
)

const semesterOptions = [
  {
    label: 'Ganjil',
    value: 'GANJIL'
  },
  {
    label: 'Genap',
    value: 'GENAP'
  }
]
</script>

<template>
  <div class="space-y-5">
    <UFormField
      label="Tahun Ajaran"
      required
    >
      <USelect
        v-model="model.academicYearId"
        :items="academicYearOptions"
        value-key="value"
        label-key="label"
        class="w-full"
        placeholder="Pilih Tahun Ajaran"
      />
    </UFormField>

    <UFormField
      label="Tipe Semester"
      required
    >
      <div class="flex gap-3 mt-1" :class="{ 'opacity-60 pointer-events-none': mode === 'edit' }">
        <button
          type="button"
          class="flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer"
          :class="model.type === 'GANJIL'
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
            : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400'"
          @click="model.type = 'GANJIL'"
        >
          Ganjil
        </button>
        <button
          type="button"
          class="flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all cursor-pointer"
          :class="model.type === 'GENAP'
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
            : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-gray-400'"
          @click="model.type = 'GENAP'"
        >
          Genap
        </button>
      </div>
      <p v-if="mode === 'edit'" class="text-xs text-gray-400 mt-1">Tipe semester tidak dapat diubah setelah dibuat.</p>
    </UFormField>


    <UFormField label="Status">
      <div class="space-y-3">
        <USwitch
          v-model="model.isActive"
          label="Semester Aktif"
          description="Jadikan semester ini sebagai semester aktif."
        />

        <USwitch
          v-model="model.isLocked"
          label="Kunci Semester"
          description="Semester yang terkunci tidak dapat diubah."
        />
      </div>
    </UFormField>
  </div>
</template>
