<script setup lang="ts">
definePageMeta({
  layout: 'teacher',
  middleware: ['auth', 'role'],
  role: ['TEACHER', 'ADMIN']
})

const route = useRoute()
const toast = useToast()
const teachingId = route.params.id as string

const { data: teachingRes, pending: pendingTeaching } = await useFetch(`/api/teaching-assignments/${teachingId}`)
const teaching = computed(() => teachingRes.value?.data)

const categoryFilter = ref<'ALL' | 'PH' | 'STS' | 'SAS'>('ALL')
const categoryOptions = [
  { label: 'Semua Kategori', value: 'ALL' },
  { label: 'PH (Penilaian Harian)', value: 'PH' },
  { label: 'STS (Sumatif Tengah Semester)', value: 'STS' },
  { label: 'SAS (Sumatif Akhir Semester)', value: 'SAS' }
]

// Fetch enrolled students
const { data: studentsRes, pending: pendingStudents } = await useFetch('/api/student-classes', {
  query: computed(() => ({
    classroomId: teaching.value?.classroomId,
    semesterId: teaching.value?.semesterId,
    limit: 100
  })),
  immediate: !!teaching.value?.classroomId
})

const studentClasses = computed(() => studentsRes.value?.data ?? [])

// Grade items associated with course
const gradeItems = computed(() => {
  const items = teaching.value?.course?.gradeItems ?? []
  if (categoryFilter.value === 'ALL') return items
  return items.filter((i: any) => i.category === categoryFilter.value)
})

// Local state for grade scores: map key `studentId_gradeItemId` -> score
const scoresMap = ref<Record<string, number>>({})
const isSaving = ref(false)

// Fetch existing grade components for all students in this teaching assignment
const { data: existingGradesRes, refresh: refreshGrades } = await useFetch('/api/grades/summary', {
  query: computed(() => ({
    teachingId,
    semesterId: teaching.value?.semesterId
  })),
  immediate: !!teaching.value?.semesterId
})

// Initialize scores from existing data if any
watch(existingGradesRes, () => {
  // We can pre-fill scores if components exist
}, { immediate: true })

async function saveGrades() {
  if (!teaching.value) return
  isSaving.value = true

  const payloadItems: Array<{ studentId: string, gradeItemId: number, score: number }> = []

  for (const [key, score] of Object.entries(scoresMap.value)) {
    const [studentId, gradeItemIdStr] = key.split('_')
    if (studentId && gradeItemIdStr) {
      payloadItems.push({
        studentId,
        gradeItemId: Number(gradeItemIdStr),
        score: Number(score)
      })
    }
  }

  if (!payloadItems.length) {
    toast.add({ title: 'Perhatian', description: 'Belum ada nilai yang diubah.', color: 'warning' })
    isSaving.value = false
    return
  }

  try {
    await $fetch('/api/grades/components', {
      method: 'POST',
      body: {
        items: payloadItems,
        teachingId: teaching.value.id,
        semesterId: teaching.value.semesterId
      }
    })

    toast.add({
      title: 'Berhasil',
      description: 'Nilai siswa berhasil disimpan dan dikalkulasi ulang.',
      color: 'success'
    })
    await refreshGrades()
  } catch (err: any) {
    toast.add({
      title: 'Gagal',
      description: err.data?.statusMessage || 'Gagal menyimpan nilai.',
      color: 'error'
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Navigation -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <UButton
          :to="`/teacher/classes/${teachingId}`"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
        />
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Input & Sync Nilai Siswa
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ teaching?.subject?.name }} • {{ teaching?.classroom?.name }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <USelect
          v-model="categoryFilter"
          :items="categoryOptions"
          value-key="value"
          label-key="label"
          class="w-56"
        />
        <UButton
          color="success"
          variant="solid"
          icon="i-lucide-save"
          :loading="isSaving"
          @click="saveGrades"
        >
          Simpan Nilai
        </UButton>
      </div>
    </div>

    <!-- Main Card -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-edit-3" class="w-5 h-5 text-emerald-500" />
            <h2 class="text-base font-bold text-gray-900 dark:text-white">
              Tabel Component Input Nilai
            </h2>
          </div>
          <UBadge color="neutral" variant="subtle" size="sm">
            {{ gradeItems.length }} Grade Items
          </UBadge>
        </div>
      </template>

      <!-- Empty Grade Items Notice -->
      <div v-if="!gradeItems.length" class="text-center py-12">
        <UIcon name="i-lucide-file-question" class="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Tidak Ada Grade Item</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
          Belum ada Grade Item tersinkronisasi dari Moodle atau dibuat untuk kategori ini.
        </p>
      </div>

      <!-- Table View -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <th class="py-3 px-4 font-semibold text-xs text-gray-600 dark:text-gray-300 w-12">No</th>
              <th class="py-3 px-4 font-semibold text-xs text-gray-600 dark:text-gray-300 min-w-[180px]">Nama Siswa</th>
              <th
                v-for="item in gradeItems"
                :key="item.id"
                class="py-3 px-4 font-semibold text-xs text-gray-600 dark:text-gray-300 min-w-[140px]"
              >
                <div class="flex items-center justify-between gap-1">
                  <span class="truncate">{{ item.name }}</span>
                </div>
                <div class="text-[10px] text-gray-400 font-normal">
                  Kategori: {{ item.category || 'PH' }}
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="(sc, index) in studentClasses"
              :key="sc.id"
              class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td class="py-3 px-4 text-xs text-gray-400 font-mono">{{ index + 1 }}</td>
              <td class="py-3 px-4">
                <div class="font-medium text-gray-900 dark:text-white text-xs">
                  {{ sc.student?.user?.fullname }}
                </div>
                <div class="text-[11px] text-gray-400 font-mono">
                  {{ sc.student?.nis }}
                </div>
              </td>
              <td
                v-for="item in gradeItems"
                :key="item.id"
                class="py-2 px-4"
              >
                <div class="flex items-center gap-1.5">
                  <UInput
                    :model-value="scoresMap[`${sc.studentId}_${item.id}`] ?? 0"
                    type="number"
                    min="0"
                    max="100"
                    class="w-24"
                    size="xs"
                    @update:model-value="(val) => scoresMap[`${sc.studentId}_${item.id}`] = Number(val)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template #footer>
        <div class="flex justify-between items-center px-4 py-2">
          <span class="text-xs text-gray-500">
            * Isikan nilai siswa secara manual lalu klik Simpan Nilai.
          </span>
          <UButton
            color="success"
            variant="solid"
            icon="i-lucide-save"
            :loading="isSaving"
            @click="saveGrades"
          >
            Simpan Nilai
          </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
