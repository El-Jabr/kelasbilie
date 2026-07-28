<script setup lang="ts">
interface FormState {
  teacherId: string
  subjectId: string
  classroomId: string
  semesterId: string
  courseId?: number
}

const model = defineModel<FormState>({
  required: true
})

const {
  teacherOptions,
  subjectOptions,
  classOptions,
  semesterOptions,
  courseOptions
} = useTeachingAssignments()
</script>

<template>
  <div class="space-y-4">
    <UFormField label="Guru Pengampu" required>
      <USelect
        v-model="model.teacherId"
        :items="teacherOptions"
        value-key="value"
        label-key="label"
        placeholder="-- Pilih Guru --"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Mata Pelajaran" required>
      <USelect
        v-model="model.subjectId"
        :items="subjectOptions"
        value-key="value"
        label-key="label"
        placeholder="-- Pilih Mata Pelajaran --"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Kelas" required>
      <USelect
        v-model="model.classroomId"
        :items="classOptions"
        value-key="value"
        label-key="label"
        placeholder="-- Pilih Kelas --"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Semester" required>
      <USelect
        v-model="model.semesterId"
        :items="semesterOptions"
        value-key="value"
        label-key="label"
        placeholder="-- Pilih Semester --"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Course Moodle Terkait" required>
      <USelect
        v-model="model.courseId"
        :items="courseOptions"
        value-key="value"
        label-key="label"
        placeholder="-- Pilih Course Moodle --"
        class="w-full"
      />
    </UFormField>
  </div>
</template>
