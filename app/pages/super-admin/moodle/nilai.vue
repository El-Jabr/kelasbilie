<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  role: ['SUPER_ADMIN', 'ADMIN']
})

useSeoMeta({
  title: 'Inspeksi & Rekap Nilai Siswa'
})

const route = useRoute()
const selectedClassroomId = ref<string>((route.query.classroomId as string) || 'ALL')
const selectedTeachingId = ref<string>((route.query.teachingId as string) || 'ALL')
const searchInput = ref<string>('')

// Dropdown Options State
const classroomOptions = ref<{ label: string, value: string }[]>([])
const teachingOptions = ref<{ label: string, value: string }[]>([])
const pendingDropdowns = ref(false)

// 1. Fetch Classrooms Dropdown
async function loadClassrooms() {
  pendingDropdowns.value = true
  try {
    const res: any = await $fetch('/api/classes', { credentials: 'include' })
    if (res?.data) {
      classroomOptions.value = [
        { label: '-- Pilih Kelas --', value: 'ALL' },
        ...res.data.map((c: any) => ({
          label: `Kelas ${c.name} (Tingkat ${c.level})`,
          value: c.id
        }))
      ]
    }
  } catch (err) {
    console.error('Gagal memuat daftar kelas:', err)
  } finally {
    pendingDropdowns.value = false
  }
}

// 2. Fetch Teaching Assignments Dropdown when Classroom Changes
async function loadTeachingsForClassroom(classroomId: string) {
  if (!classroomId || classroomId === 'ALL') {
    teachingOptions.value = [{ label: 'Semua Mata Pelajaran (Rekap Nilai)', value: 'ALL' }]
    selectedTeachingId.value = 'ALL'
    return
  }

  try {
    const activeSem: any = await $fetch('/api/semesters/active')
    const activeSemId = activeSem?.data?.id

    const res: any = await $fetch('/api/teaching-assignments', {
      query: {
        classroomId,
        semesterId: activeSemId,
        limit: 100
      },
      credentials: 'include'
    })

    if (res?.data) {
      teachingOptions.value = [
        { label: 'Semua Mata Pelajaran (Rekap Nilai)', value: 'ALL' },
        ...res.data.map((t: any) => ({
          label: `${t.subject?.code} - ${t.subject?.name} (${t.teacher?.user?.fullname || 'No Teacher'})`,
          value: t.id
        }))
      ]
    }
  } catch (err) {
    console.error('Gagal memuat mata pelajaran kelas:', err)
  }
}

// Watchers for reactive toolbar navigation
watch(selectedClassroomId, (newClassroomId) => {
  loadTeachingsForClassroom(newClassroomId)
}, { immediate: true })

function resetFilter() {
  selectedClassroomId.value = 'ALL'
  selectedTeachingId.value = 'ALL'
  searchInput.value = ''
}

// 3. Fetch Inspection Grades Table Data
const { data: inspectionRes, pending, refresh } = await useFetch('/api/grades/inspection', {
  query: computed(() => ({
    classroomId: selectedClassroomId.value,
    teachingId: selectedTeachingId.value,
    search: searchInput.value
  })),
  immediate: true
})

const inspectionData = computed<any>(() => inspectionRes.value)

onMounted(() => {
  loadClassrooms()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Page -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-lucide-award" class="w-7 h-7 text-emerald-500" />
          Inspeksi & Rekap Nilai Siswa Per Kelas
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Inspeksi nilai Rata-rata PH, STS, SAS, dan Nilai Akhir siswa per mata pelajaran atau rekap seluruh kelas.
        </p>
      </div>

      <UBadge v-if="inspectionData?.semester" color="success" variant="subtle" size="md" class="font-bold">
        Semester {{ inspectionData.semester?.type }} ({{ inspectionData.semester?.academicYear?.name }})
      </UBadge>
    </div>

    <!-- Toolbar Filter -->
    <UCard>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Select Kelas (Classroom) -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-gray-600 dark:text-gray-400">1. Pilih Kelas</label>
          <USelect
            v-model="selectedClassroomId"
            :items="classroomOptions"
            value-key="value"
            label-key="label"
            :disabled="pendingDropdowns"
            class="w-full"
          />
        </div>

        <!-- Select Mapel (Teaching Assignment) -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-gray-600 dark:text-gray-400">2. Pilih Mata Pelajaran</label>
          <USelect
            v-model="selectedTeachingId"
            :items="teachingOptions"
            value-key="value"
            label-key="label"
            :disabled="selectedClassroomId === 'ALL'"
            class="w-full"
          />
        </div>

        <!-- Search Siswa -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-gray-600 dark:text-gray-400">3. Cari Siswa</label>
          <UInput
            v-model="searchInput"
            icon="i-lucide-search"
            placeholder="Cari Nama / NIS..."
            :disabled="selectedClassroomId === 'ALL'"
            class="w-full"
          />
        </div>

        <!-- Reset Button -->
        <div class="space-y-1 flex flex-col justify-end">
          <UButton
            type="button"
            icon="i-lucide-filter-x"
            color="neutral"
            variant="soft"
            block
            class="cursor-pointer"
            @click="resetFilter"
          >
            Reset Toolbar
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- State 1: Belum Pilih Kelas -->
    <div v-if="selectedClassroomId === 'ALL'" class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-lucide-mouse-pointer-click" class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-bold text-gray-900 dark:text-white">Pilih Kelas Terlebih Dahulu</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1">
        Gunakan dropdown <strong>"1. Pilih Kelas"</strong> pada toolbar di atas untuk menampilkan rincian tabel nilai siswa.
      </p>
    </div>

    <!-- State 2: Loading State -->
    <UCard v-else-if="pending">
      <div class="py-16 text-center space-y-3">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
        <p class="text-sm font-medium text-gray-600 dark:text-gray-300">Memuat rincian tabel nilai kelas...</p>
      </div>
    </UCard>

    <!-- State 3: Mode SUBJECT_DETAIL (Detail Mapel Spesifik) -->
    <UCard v-else-if="inspectionData?.mode === 'SUBJECT_DETAIL'">
      <template #header>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <UBadge color="primary" variant="subtle" size="sm" class="font-mono">
                {{ inspectionData.teaching?.subject?.code }}
              </UBadge>
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Mata Pelajaran: {{ inspectionData.teaching?.subject?.name }}
              </h2>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Guru Pengajar: {{ inspectionData.teaching?.teacher?.user?.fullname || '-' }} • 
              Kelas: {{ inspectionData.teaching?.classroom?.name }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <UBadge color="success" variant="subtle" size="sm" class="font-bold">
              Formula: 50% Avg PH + 25% STS + 25% SAS
            </UBadge>
            <UBadge color="neutral" variant="subtle" size="sm">
              {{ inspectionData.students?.length || 0 }} Siswa
            </UBadge>
          </div>
        </div>
      </template>

      <!-- Empty Students -->
      <div v-if="!inspectionData.students?.length" class="py-12 text-center text-gray-500">
        Tidak ada siswa ditemukan di kelas ini.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm border-collapse min-w-[750px]">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              <th class="py-3 px-4 w-12 text-center">No</th>
              <th class="py-3 px-4 w-32">NIS</th>
              <th class="py-3 px-4 min-w-[180px]">Nama Siswa</th>

              <!-- Individual PH 1, PH 2, PH 3... Columns (Jika Ada) -->
              <th
                v-for="(gi, pIdx) in inspectionData.phGradeItems"
                :key="gi.id"
                class="py-3 px-4 text-center min-w-[100px]"
              >
                <div class="font-bold text-blue-700 dark:text-blue-300">
                  PH {{ Number(pIdx) + 1 }}
                </div>
                <div class="text-[10px] text-gray-400 font-normal truncate max-w-[100px] mx-auto" :title="gi.name">
                  {{ gi.name }}
                </div>
              </th>

              <!-- Summary Columns -->
              <th class="py-3 px-4 text-center bg-blue-100/50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 font-bold min-w-[120px]">
                AVERAGE PH
                <div class="text-[10px] text-blue-600 dark:text-blue-400 font-normal">Bobot 50%</div>
              </th>

              <th class="py-3 px-4 text-center bg-amber-100/50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 font-bold min-w-[100px]">
                STS
                <div class="text-[10px] text-amber-600 dark:text-amber-400 font-normal">Bobot 25%</div>
              </th>

              <th class="py-3 px-4 text-center bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 font-bold min-w-[100px]">
                SAS
                <div class="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Bobot 25%</div>
              </th>

              <th class="py-3 px-4 text-center bg-gray-200 dark:bg-gray-700 font-extrabold text-gray-900 dark:text-white min-w-[120px]">
                NILAI AKHIR
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            <tr
              v-for="(st, idx) in inspectionData.students"
              :key="st.studentId"
              class="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
            >
              <td class="py-3 px-4 text-center text-xs text-gray-400">{{ Number(idx) + 1 }}</td>
              <td class="py-3 px-4 font-mono text-xs text-gray-500 dark:text-gray-400">{{ st.nis || '-' }}</td>
              <td class="py-3 px-4 font-medium text-gray-900 dark:text-white">{{ st.fullname }}</td>

              <!-- Scores for PH 1, PH 2, PH 3... -->
              <td
                v-for="gi in inspectionData.phGradeItems"
                :key="gi.id"
                class="py-3 px-4 text-center font-mono"
              >
                <span v-if="st.phScores[gi.id] !== undefined" class="font-bold text-gray-800 dark:text-gray-200">
                  {{ st.phScores[gi.id] }}
                </span>
                <span v-else class="text-gray-300 dark:text-gray-600 text-xs">-</span>
              </td>

              <!-- AVERAGE PH -->
              <td class="py-3 px-4 text-center bg-blue-50/30 dark:bg-blue-950/10 font-bold text-blue-600 dark:text-blue-400 font-mono">
                {{ st.averagePh !== null ? st.averagePh : '-' }}
              </td>

              <!-- STS -->
              <td class="py-3 px-4 text-center bg-amber-50/30 dark:bg-amber-950/10 font-bold text-amber-600 dark:text-amber-400 font-mono">
                {{ st.stsScore !== null ? st.stsScore : '-' }}
              </td>

              <!-- SAS -->
              <td class="py-3 px-4 text-center bg-emerald-50/30 dark:bg-emerald-950/10 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {{ st.sasScore !== null ? st.sasScore : '-' }}
              </td>

              <!-- NILAI AKHIR (Integer rounded without decimal) -->
              <td class="py-3 px-4 text-center bg-gray-50 dark:bg-gray-800/40">
                <template v-if="st.finalGrade !== null">
                  <UBadge
                    :color="st.finalGrade >= 75 ? 'success' : 'warning'"
                    variant="solid"
                    size="md"
                    class="font-extrabold"
                  >
                    {{ st.finalGrade }}
                  </UBadge>
                </template>
                <span v-else class="text-gray-400 text-xs font-mono">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- State 4: Mode CLASSROOM_OVERVIEW (Rekap Seluruh Mapel per Kelas) -->
    <UCard v-else-if="inspectionData?.mode === 'CLASSROOM_OVERVIEW'">
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              Rekap Nilai Akhir Seluruh Mata Pelajaran
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Menampilkan hasil kalkulasi Nilai Akhir (50% Avg PH + 25% STS + 25% SAS) per mata pelajaran.
            </p>
          </div>
          <UBadge color="primary" variant="subtle" size="sm">
            {{ inspectionData.teachings?.length || 0 }} Mata Pelajaran
          </UBadge>
        </div>
      </template>

      <!-- Empty Teachings -->
      <div v-if="!inspectionData.teachings?.length" class="py-12 text-center text-gray-500">
        Belum ada penugasan mata pelajaran terdaftar untuk kelas ini.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              <th class="py-3 px-4 w-12 text-center">No</th>
              <th class="py-3 px-4 w-32">NIS</th>
              <th class="py-3 px-4 min-w-[180px]">Nama Siswa</th>

              <!-- Dynamic Subject Columns -->
              <th
                v-for="t in inspectionData.teachings"
                :key="t.id"
                class="py-3 px-4 text-center min-w-[140px]"
              >
                <div class="font-bold text-gray-900 dark:text-white truncate max-w-[140px] mx-auto" :title="t.subjectName">
                  {{ t.subjectName }}
                </div>
                <div class="text-[10px] text-gray-400 font-mono">
                  {{ t.subjectCode }}
                </div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            <tr
              v-for="(st, idx) in inspectionData.students"
              :key="st.studentId"
              class="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
            >
              <td class="py-3 px-4 text-center text-xs text-gray-400">{{ Number(idx) + 1 }}</td>
              <td class="py-3 px-4 font-mono text-xs text-gray-500 dark:text-gray-400">{{ st.nis || '-' }}</td>
              <td class="py-3 px-4 font-medium text-gray-900 dark:text-white">{{ st.fullname }}</td>

              <!-- Subject Final Scores (Rounded Integer without decimal) -->
              <td
                v-for="t in inspectionData.teachings"
                :key="t.id"
                class="py-3 px-4 text-center font-mono"
              >
                <template v-if="st.subjectGrades[t.id]?.final !== null">
                  <UBadge
                    color="success"
                    variant="subtle"
                    size="md"
                    class="font-extrabold text-sm"
                  >
                    {{ st.subjectGrades[t.id].final }}
                  </UBadge>
                </template>
                <span v-else class="text-gray-300 dark:text-gray-600 text-xs">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
