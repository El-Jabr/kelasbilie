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
  <div class="space-y-5">
    <!-- Grup 1: Konteks Pengajaran -->
    <div>
      <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Konteks Pengajaran
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <UFormField label="Semester" required>
          <USelect
            v-model="model.semesterId"
            :items="semesterOptions"
            value-key="value"
            label-key="label"
            placeholder="Pilih Semester"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Kelas" required>
          <USelect
            v-model="model.classroomId"
            :items="classOptions"
            value-key="value"
            label-key="label"
            placeholder="Pilih Kelas"
            class="w-full"
          />
        </UFormField>
      </div>
    </div>

    <USeparator />

    <!-- Grup 2: Guru & Mata Pelajaran -->
    <div>
      <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Guru & Mata Pelajaran
      </p>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <UFormField label="Guru Pengampu" required>
          <USelect
            v-model="model.teacherId"
            :items="teacherOptions"
            value-key="value"
            label-key="label"
            placeholder="Pilih Guru"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Mata Pelajaran" required>
          <USelect
            v-model="model.subjectId"
            :items="subjectOptions"
            value-key="value"
            label-key="label"
            placeholder="Pilih Mata Pelajaran"
            class="w-full"
          />
        </UFormField>
      </div>
    </div>

    <USeparator />

    <!-- Grup 3: Integrasi Moodle -->
    <div>
      <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
        Integrasi Moodle
      </p>
      <p class="text-xs text-gray-400 mb-3">Hubungkan penugasan ini dengan course di Moodle untuk sinkronisasi nilai.</p>
      <UFormField label="Course Moodle" required>
        <USelect
          v-model="model.courseId"
          :items="courseOptions"
          value-key="value"
          label-key="label"
          placeholder="Pilih Course Moodle"
          class="w-full"
        />
      </UFormField>
    </div>
  </div>
</template>

