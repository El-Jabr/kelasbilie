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
      label="Semester"
      required
    >
      <USelect
        v-model="model.type"
        :items="semesterOptions"
        value-key="value"
        label-key="label"
        class="w-full"
        placeholder="Pilih Semester"
        :disabled="mode === 'edit'"
      />
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
