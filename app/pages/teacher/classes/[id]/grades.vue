<script setup lang="ts">
definePageMeta({
  layout: 'teacher',
  middleware: ['auth', 'role'],
  role: ['TEACHER', 'ADMIN']
})

const route = useRoute()
const toast = useToast()
const teachingId = route.params.id as string

const isSaving = ref(false)
const isAddingItem = ref(false)
const showAddItemModal = ref(false)
const newItemName = ref('')

// Scores Map: key `${studentId}_${gradeItemId}` -> score
const scoresMap = ref<Record<string, number | null>>({})

// Direct fetch using teaching assignment detail
const { data: teachingRes } = await useFetch(`/api/teaching-assignments/${teachingId}`)
const teaching = computed(() => teachingRes.value?.data)

const { data: fullInspectionRes, pending: pendingData, refresh: refreshData } = await useFetch('/api/grades/inspection', {
  query: computed(() => ({
    classroomId: teaching.value?.classroomId,
    teachingId: teachingId
  })),
  immediate: !!teaching.value?.classroomId
})

const inspectionData = computed<any>(() => fullInspectionRes.value)
const students = computed<any[]>(() => inspectionData.value?.students ?? [])
const phGradeItems = computed<any[]>(() => inspectionData.value?.phGradeItems ?? [])
const stsGradeItems = computed<any[]>(() => inspectionData.value?.stsGradeItems ?? [])
const sasGradeItems = computed<any[]>(() => inspectionData.value?.sasGradeItems ?? [])

// Initialize scoresMap when data loads
watch(students, (newStudents) => {
  if (!newStudents) return
  const map: Record<string, number | null> = {}

  for (const s of newStudents) {
    if (s.itemDetails) {
      for (const [itemIdStr, details] of Object.entries(s.itemDetails as Record<string, any>)) {
        if (details && details.score !== null && details.score !== undefined) {
          map[`${s.studentId}_${itemIdStr}`] = details.score
        }
      }
    }
    if (s.stsScore !== null && s.stsScore !== undefined && stsGradeItems.value[0]) {
      map[`${s.studentId}_${stsGradeItems.value[0].id}`] = s.stsScore
    }
    if (s.sasScore !== null && s.sasScore !== undefined && sasGradeItems.value[0]) {
      map[`${s.studentId}_${sasGradeItems.value[0].id}`] = s.sasScore
    }
  }

  scoresMap.value = map
}, { immediate: true })

function getStudentPhAverage(studentId: string): number | null {
  const values: number[] = []
  for (const gi of phGradeItems.value) {
    const val = scoresMap.value[`${studentId}_${gi.id}`]
    if (val !== undefined && val !== null && !isNaN(Number(val))) {
      values.push(Number(val))
    }
  }
  if (values.length === 0) return null
  const sum = values.reduce((a, b) => a + b, 0)
  return Math.round(sum / values.length)
}

function getStudentStsScore(studentId: string): number | null {
  const gi = stsGradeItems.value[0]
  if (!gi) return null
  const val = scoresMap.value[`${studentId}_${gi.id}`]
  return val !== undefined && val !== null ? Math.round(Number(val)) : null
}

function getStudentSasScore(studentId: string): number | null {
  const gi = sasGradeItems.value[0]
  if (!gi) return null
  const val = scoresMap.value[`${studentId}_${gi.id}`]
  return val !== undefined && val !== null ? Math.round(Number(val)) : null
}

function getStudentFinalGrade(studentId: string): number | null {
  const avgPh = getStudentPhAverage(studentId)
  const sts = getStudentStsScore(studentId)
  const sas = getStudentSasScore(studentId)

  if (avgPh === null && sts === null && sas === null) return null

  const p = avgPh ?? 0
  const st = sts ?? p
  const sa = sas ?? p

  return Math.round((p * 0.50) + (st * 0.25) + (sa * 0.25))
}

async function handleAddPhItem() {
  if (!newItemName.value.trim() || !teaching.value?.courseId) {
    toast.add({ title: 'Perhatian', description: 'Nama item PH wajib diisi.', color: 'warning' })
    return
  }

  isAddingItem.value = true
  try {
    const res: any = await $fetch('/api/grades/items', {
      method: 'POST',
      body: {
        courseId: teaching.value.courseId,
        name: newItemName.value.trim(),
        category: 'PH'
      }
    })

    toast.add({
      title: 'Berhasil',
      description: res.message || 'Item PH baru berhasil ditambahkan.',
      color: 'success'
    })

    newItemName.value = ''
    showAddItemModal.value = false
    await refreshData()
  } catch (err: any) {
    toast.add({
      title: 'Gagal',
      description: err.data?.statusMessage || 'Gagal menambahkan item PH.',
      color: 'error'
    })
  } finally {
    isAddingItem.value = false
  }
}

async function saveAllGrades() {
  if (!teaching.value) return
  isSaving.value = true

  const payloadItems: Array<{ studentId: string, gradeItemId: number, score: number }> = []

  for (const [key, val] of Object.entries(scoresMap.value)) {
    if (val !== null && val !== undefined && !isNaN(Number(val))) {
      const [studentId, gradeItemIdStr] = key.split('_')
      if (studentId && gradeItemIdStr) {
        payloadItems.push({
          studentId,
          gradeItemId: Number(gradeItemIdStr),
          score: Number(val)
        })
      }
    }
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
      title: 'Berhasil Disimpan',
      description: 'Nilai siswa berhasil diperbarui dan dikalkulasi ulang.',
      color: 'success'
    })

    await refreshData()
  } catch (err: any) {
    toast.add({
      title: 'Gagal Menyimpan',
      description: err.data?.statusMessage || 'Gagal menyimpan nilai.',
      color: 'error'
    })
  } finally {
    isSaving.value = false
  }
}

function updateScore(key: string, val: any) {
  if (val === '' || val === null || val === undefined) {
    scoresMap.value[key] = null
  } else {
    scoresMap.value[key] = Number(val)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <UButton
          :to="`/teacher/classes/${teachingId}`"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
        />
        <div>
          <h1 class="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <UIcon name="i-lucide-calculator" class="w-7 h-7 text-emerald-500" />
            Tabel Inspeksi Nilai Siswa
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ teaching?.subject?.name }} • Kelas {{ teaching?.classroom?.name }}
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
        <UButton
          color="primary"
          variant="soft"
          icon="i-lucide-plus-circle"
          class="cursor-pointer font-semibold"
          @click="() => { showAddItemModal = true }"
        >
          ➕ Tambah Item PH
        </UButton>

        <UButton
          color="success"
          size="md"
          icon="i-lucide-save"
          class="cursor-pointer font-bold shadow-sm"
          :loading="isSaving"
          @click="saveAllGrades"
        >
          💾 Simpan Nilai
        </UButton>
      </div>
    </div>

    <!-- Main Card & Table -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-table" class="w-5 h-5 text-emerald-500" />
            <h2 class="text-base font-bold text-gray-900 dark:text-white">
              Tabel Input Nilai (Formula: 50% Rata PH + 25% STS + 25% SAS)
            </h2>
          </div>
          <UBadge color="success" variant="subtle" size="sm">
            {{ students.length }} Siswa
          </UBadge>
        </div>
      </template>

      <!-- Loading State -->
      <div v-if="pendingData" class="py-12 text-center text-sm text-gray-400">
        Memuat tabel inspeksi nilai...
      </div>

      <!-- Empty State -->
      <div v-else-if="!students.length" class="py-12 text-center text-gray-400">
        Belum ada siswa terdaftar di kelas ini.
      </div>

      <!-- Main Inspection Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <!-- Header Row 1 -->
            <tr class="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-700">
              <th class="py-3 px-3 w-12 text-center border-r border-gray-200 dark:border-gray-700" rowspan="2">No</th>
              <th class="py-3 px-3 w-28 border-r border-gray-200 dark:border-gray-700" rowspan="2">NIS</th>
              <th class="py-3 px-3 min-w-[180px] border-r border-gray-200 dark:border-gray-700" rowspan="2">Nama Siswa</th>

              <!-- PH Column Group -->
              <th
                :colspan="phGradeItems.length + 1"
                class="py-2 px-3 text-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-r border-gray-200 dark:border-gray-700"
              >
                PENILAIAN HARIAN (PH)
              </th>

              <!-- STS Column -->
              <th class="py-2 px-3 text-center bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-r border-gray-200 dark:border-gray-700" rowspan="2">
                STS (25%)
              </th>

              <!-- SAS Column -->
              <th class="py-2 px-3 text-center bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-r border-gray-200 dark:border-gray-700" rowspan="2">
                SAS (25%)
              </th>

              <!-- Final Grade Column -->
              <th class="py-2 px-3 text-center bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300" rowspan="2">
                NILAI AKHIR
              </th>
            </tr>

            <!-- Header Row 2 for PH Items -->
            <tr class="bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-b border-gray-200 dark:border-gray-700 font-semibold text-[11px]">
              <th
                v-for="(gi, idx) in phGradeItems"
                :key="gi.id"
                class="py-2 px-2 text-center min-w-[120px] border-r border-emerald-200/50 dark:border-emerald-800/50"
              >
                <div class="truncate font-bold" :title="gi.name">{{ gi.name || `PH ${idx + 1}` }}</div>
                <div class="text-[9px] text-gray-400 font-normal">
                  {{ gi.itemType === 'manual' ? '(Manual)' : '(Moodle)' }}
                </div>
              </th>

              <th class="py-2 px-2 text-center min-w-[110px] bg-emerald-100/70 dark:bg-emerald-900/40 font-bold border-r border-gray-200 dark:border-gray-700">
                Rata PH (50%)
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100 dark:divide-gray-800 font-mono">
            <tr
              v-for="(s, index) in students"
              :key="s.studentId"
              class="hover:bg-gray-50/60 dark:hover:bg-gray-800/60 transition-colors"
            >
              <!-- No -->
              <td class="py-2.5 px-3 text-center text-gray-400 border-r border-gray-100 dark:border-gray-800">
                {{ index + 1 }}
              </td>

              <!-- NIS -->
              <td class="py-2.5 px-3 text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-gray-800">
                {{ s.nis }}
              </td>

              <!-- Nama Siswa -->
              <td class="py-2.5 px-3 font-sans font-medium text-gray-900 dark:text-white border-r border-gray-100 dark:border-gray-800">
                {{ s.fullname }}
              </td>

              <!-- PH Items Inputs -->
              <td
                v-for="gi in phGradeItems"
                :key="gi.id"
                class="py-2 px-2 text-center border-r border-gray-100 dark:border-gray-800"
              >
                <div class="flex flex-col items-center gap-1">
                  <UInput
                    :model-value="scoresMap[`${s.studentId}_${gi.id}`] ?? undefined"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    class="w-20 font-bold text-center text-xs"
                    size="xs"
                    @update:model-value="(val) => updateScore(`${s.studentId}_${gi.id}`, val)"
                  />

                  <!-- Moodle Original Score Reference Badge -->
                  <UBadge
                    v-if="s.itemDetails?.[gi.id]?.moodleScore !== null && s.itemDetails?.[gi.id]?.moodleScore !== undefined"
                    color="info"
                    variant="subtle"
                    size="xs"
                    class="text-[9px] font-sans"
                    title="Nilai Asli dari Moodle"
                  >
                    Moodle: {{ s.itemDetails[gi.id].moodleScore }}
                  </UBadge>
                </div>
              </td>

              <!-- Rata-rata PH (50%) -->
              <td class="py-2.5 px-2 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10 border-r border-gray-100 dark:border-gray-800">
                {{ getStudentPhAverage(s.studentId) ?? '-' }}
              </td>

              <!-- STS Input -->
              <td class="py-2 px-2 text-center border-r border-gray-100 dark:border-gray-800">
                <div v-if="stsGradeItems[0]" class="flex flex-col items-center gap-1">
                  <UInput
                    :model-value="scoresMap[`${s.studentId}_${stsGradeItems[0].id}`] ?? undefined"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    class="w-20 font-bold text-center text-xs"
                    size="xs"
                    @update:model-value="(val) => updateScore(`${s.studentId}_${stsGradeItems[0].id}`, val)"
                  />
                  <UBadge
                    v-if="s.itemDetails?.[stsGradeItems[0].id]?.moodleScore !== null && s.itemDetails?.[stsGradeItems[0].id]?.moodleScore !== undefined"
                    color="info"
                    variant="subtle"
                    size="xs"
                    class="text-[9px] font-sans"
                  >
                    Moodle: {{ s.itemDetails[stsGradeItems[0].id].moodleScore }}
                  </UBadge>
                </div>
                <span v-else class="text-gray-400 font-bold">{{ s.stsScore ?? '-' }}</span>
              </td>

              <!-- SAS Input -->
              <td class="py-2 px-2 text-center border-r border-gray-100 dark:border-gray-800">
                <div v-if="sasGradeItems[0]" class="flex flex-col items-center gap-1">
                  <UInput
                    :model-value="scoresMap[`${s.studentId}_${sasGradeItems[0].id}`] ?? undefined"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    class="w-20 font-bold text-center text-xs"
                    size="xs"
                    @update:model-value="(val) => updateScore(`${s.studentId}_${sasGradeItems[0].id}`, val)"
                  />
                  <UBadge
                    v-if="s.itemDetails?.[sasGradeItems[0].id]?.moodleScore !== null && s.itemDetails?.[sasGradeItems[0].id]?.moodleScore !== undefined"
                    color="info"
                    variant="subtle"
                    size="xs"
                    class="text-[9px] font-sans"
                  >
                    Moodle: {{ s.itemDetails[sasGradeItems[0].id].moodleScore }}
                  </UBadge>
                </div>
                <span v-else class="text-gray-400 font-bold">{{ s.sasScore ?? '-' }}</span>
              </td>

              <!-- NILAI AKHIR (50% PH + 25% STS + 25% SAS) -->
              <td class="py-2.5 px-3 text-center">
                <UBadge
                  :color="getStudentFinalGrade(s.studentId) !== null && getStudentFinalGrade(s.studentId)! >= 75 ? 'success' : 'warning'"
                  variant="solid"
                  size="md"
                  class="font-bold"
                >
                  {{ getStudentFinalGrade(s.studentId) ?? '-' }}
                </UBadge>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <template #footer>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            💡 <span class="font-semibold">Catatan Guru:</span> Masukkan/edit nilai pada kolom PH, STS, atau SAS, lalu klik <span class="font-bold text-emerald-600">Simpan Nilai</span>. Nilai Moodle ditampilkan sebagai referensi.
          </div>
          <UButton
            color="success"
            size="md"
            icon="i-lucide-save"
            class="cursor-pointer font-bold shadow-sm"
            :loading="isSaving"
            @click="saveAllGrades"
          >
            💾 Simpan Nilai
          </UButton>
        </div>
      </template>
    </UCard>

    <!-- Modal Tambah Item PH Manual -->
    <UModal v-model:open="showAddItemModal" title="➕ Tambah Item PH (Penilaian Harian) Manual">
      <template #body>
        <div class="space-y-4 py-2">
          <p class="text-xs text-gray-500">
            Buat komponen penilaian harian baru untuk mata pelajaran <strong>{{ teaching?.subject?.name }}</strong>.
          </p>

          <div class="space-y-1">
            <label class="text-xs font-semibold text-gray-700 dark:text-gray-300">Nama Item PH</label>
            <UInput
              v-model="newItemName"
              placeholder="Contoh: PH 2 (Ulangan Bab 2)"
              class="w-full"
            />
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton color="neutral" variant="ghost" @click="() => { showAddItemModal = false }">
            Batal
          </UButton>
          <UButton
            color="success"
            icon="i-lucide-check"
            class="cursor-pointer font-bold"
            :loading="isAddingItem"
            @click="handleAddPhItem"
          >
            Tambah Item PH
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
