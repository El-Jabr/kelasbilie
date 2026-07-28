<script setup lang="ts">
import type { CreateHomeroomAssignmentSchema } from '~~/shared/schemas/homeroom-assignment'

const model = defineModel<CreateHomeroomAssignmentSchema>({
  required: true
})

const pending = ref(true)
const teacherOptions = ref<{ value: string, label: string }[]>([])
const classOptions = ref<{ value: string, label: string }[]>([])
const semesterOptions = ref<{ value: string, label: string }[]>([])

onMounted(async () => {
  pending.value = true
  try {
    const [tRes, cRes, sRes]: any = await Promise.all([
      $fetch('/api/teachers', { credentials: 'include' }).catch(() => null),
      $fetch('/api/classes', { credentials: 'include' }).catch(() => null),
      $fetch('/api/semesters', { credentials: 'include' }).catch(() => null)
    ])

    if (tRes?.data) {
      teacherOptions.value = tRes.data.map((t: any) => ({
        value: t.id,
        label: `${t.user?.fullname || 'Guru'} (NIP: ${t.nip || '-'})`
      }))
    }
    
    if (cRes?.data) {
      classOptions.value = cRes.data.map((c: any) => ({
        value: c.id,
        label: `${c.name} (Level ${c.level})`
      }))
    }

    if (sRes?.data) {
      semesterOptions.value = sRes.data.map((sem: any) => ({
        value: sem.id,
        label: `${sem.type} ${sem.academicYear?.name ? `(${sem.academicYear.name})` : ''} ${sem.isActive ? '• [Aktif]' : ''}`
      }))
    }
  } catch (err) {
    console.error('Gagal mengambil data form:', err)
  } finally {
    pending.value = false
  }
})
</script>

<template>
  <div class="space-y-4">
    <UFormField label="Semester" name="semesterId" required>
      <USelect
        v-model="model.semesterId"
        :items="semesterOptions"
        value-key="value"
        label-key="label"
        :disabled="pending"
        :loading="pending"
        placeholder="-- Pilih Semester --"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Kelas" name="classroomId" required>
      <USelect
        v-model="model.classroomId"
        :items="classOptions"
        value-key="value"
        label-key="label"
        :disabled="pending"
        :loading="pending"
        placeholder="-- Pilih Kelas --"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Guru Wali Kelas" name="teacherId" required>
      <USelect
        v-model="model.teacherId"
        :items="teacherOptions"
        value-key="value"
        label-key="label"
        :disabled="pending"
        :loading="pending"
        placeholder="-- Pilih Guru --"
        class="w-full"
      />
    </UFormField>
  </div>
</template>
