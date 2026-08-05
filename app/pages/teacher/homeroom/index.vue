<script setup lang="ts">
definePageMeta({
  layout: 'teacher',
  middleware: ['auth', 'role'],
  role: ['TEACHER', 'ADMIN']
})

useSeoMeta({
  title: 'Rekap Nilai Wali Kelas'
})

// 1. Fetch homeroom details for current teacher
const { data: homeroomRes, pending: pendingHomeroom } = await useFetch<any>('/api/homerooms/my')
const homeroom = computed(() => homeroomRes.value?.data)
const classroomId = computed(() => homeroom.value?.classroomId || '')

// 2. Selected Teaching Assignment filter ('ALL' = Rekap Seluruh Mapel)
const selectedTeachingId = ref('ALL')

// 3. Fetch all teaching assignments in classroom for subject dropdown
const { data: teachingsRes } = await useFetch<any>(
  '/api/teaching-assignments',
  {
    query: computed(() => ({
      classroomId: classroomId.value || undefined,
      limit: 100
    })),
    immediate: !!classroomId.value
  }
)

const subjectOptions = computed(() => {
  const options = [
    { label: 'Semua Mata Pelajaran (Rekap Kelas)', value: 'ALL' }
  ]
  const list = teachingsRes.value?.data || inspectionData.value?.teachings || []
  for (const t of list) {
    const sName = t.subject?.name || t.subjectName || 'Mata Pelajaran'
    const sCode = (t.subject?.code || t.subjectCode) ? ` (${t.subject?.code || t.subjectCode})` : ''
    const tName = (t.teacher?.user?.fullname || t.teacherName) ? ` - Guru: ${t.teacher?.user?.fullname || t.teacherName}` : ''
    options.push({
      label: `${sName}${sCode}${tName}`,
      value: t.id
    })
  }
  return options
})

// 4. Fetch Inspection Data (supports both CLASSROOM_OVERVIEW and SUBJECT_DETAIL)
const { data: inspectionRes, pending: pendingGrades, refresh: refreshGrades } = await useFetch<any>(
  '/api/grades/inspection',
  {
    query: computed(() => ({
      classroomId: classroomId.value,
      teachingId: (selectedTeachingId.value && selectedTeachingId.value !== 'ALL') ? selectedTeachingId.value : undefined
    })),
    immediate: !!classroomId.value
  }
)

const inspectionData = computed(() => inspectionRes.value)
const students = computed<any[]>(() => inspectionData.value?.students || [])

// Reset page when subject filter changes
watch(selectedTeachingId, () => {
  currentPage.value = 1
})

// Pagination state matching Admin grade table
const currentPage = ref(1)
const itemsPerPage = ref(10)

const totalStudents = computed(() => students.value.length)
const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return students.value.slice(start, start + itemsPerPage.value)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Page & Toolbar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <UButton
            to="/teacher"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="xs"
            class="hidden sm:inline-flex"
          />
          <h1 class="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <UIcon name="i-lucide-award" class="hidden sm:inline-block w-7 h-7 text-emerald-500" />
            Rekapitulasi Nilai Wali Kelas
          </h1>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Laporan hasil kalkulasi Nilai Akhir & rincian komponen nilai siswa di kelas binaan Anda.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          to="/teacher/homeroom/ai-analysis"
          color="primary"
          size="sm"
          class="w-full sm:w-auto flex justify-center font-bold cursor-pointer"
        >
          <template #leading>
            <UIcon name="i-lucide-sparkles" class="w-4 h-4" />
          </template>
          Analisis AI Kelas
        </UButton>

        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          :loading="pendingGrades"
          class="w-full sm:w-auto flex justify-center cursor-pointer"
          @click="() => refreshGrades()"
        >
          <template #leading>
            <UIcon name="i-lucide-rotate-cw" class="hidden sm:inline-block" />
          </template>
          Refresh Data
        </UButton>
      </div>
    </div>

    <!-- Filter Card Toolbar -->
    <UCard v-if="homeroom" class="shadow-sm border border-gray-200 dark:border-gray-800">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
        <div class="w-full sm:flex-1">
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
            Filter Tampilan Mata Pelajaran
          </label>
          <USelect
            v-model="selectedTeachingId"
            :items="subjectOptions"
            label-key="label"
            value-key="value"
            placeholder="-- Pilih Mata Pelajaran --"
            class="w-full"
          />
        </div>
      </div>
    </UCard>

    <!-- Loading State -->
    <div v-if="pendingHomeroom || pendingGrades" class="py-16 text-center space-y-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
      <p class="text-sm font-medium text-gray-600 dark:text-gray-300">Memuat rincian tabel nilai kelas...</p>
    </div>

    <!-- Not A Homeroom Teacher State -->
    <div v-else-if="!homeroom" class="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div class="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-lucide-alert-circle" class="w-8 h-8" />
      </div>
      <h3 class="text-lg font-bold text-gray-900 dark:text-white">Bukan Wali Kelas</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mt-1">
        Anda tidak terdaftar sebagai wali kelas untuk semester aktif ini.
      </p>
    </div>

    <!-- MODE 1: CLASSROOM_OVERVIEW (Rekap Seluruh Mapel) -->
    <div v-else-if="inspectionData?.mode === 'CLASSROOM_OVERVIEW'" class="space-y-4">
      <UCard>
        <template #header>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center justify-between w-full sm:w-auto gap-4">
              <div>
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                  Rekap Nilai Akhir Seluruh Mata Pelajaran
                </h2>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Kelas: <strong>{{ inspectionData.classroom?.name }}</strong> • 
                  Semester {{ inspectionData.semester?.type }} ({{ inspectionData.semester?.academicYear?.name }})
                </p>
              </div>

              <UBadge color="neutral" variant="subtle" size="sm" class="shrink-0 sm:hidden">
                {{ inspectionData.teachings?.length || 0 }} Mata Pelajaran
              </UBadge>
            </div>

            <div class="flex items-center gap-2">
              <UBadge color="neutral" variant="subtle" size="sm" class="hidden sm:inline-flex shrink-0 font-bold">
                {{ inspectionData.teachings?.length || 0 }} Mata Pelajaran
              </UBadge>
              <UBadge color="neutral" variant="subtle" size="sm" class="shrink-0">
                {{ totalStudents }} Siswa
              </UBadge>
            </div>
          </div>
        </template>

        <!-- Empty Students -->
        <div v-if="students.length === 0" class="py-12 text-center text-gray-500">
          Belum ada siswa terdaftar di kelas ini.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse min-w-[750px]">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <th class="py-3 px-4 w-12 text-center">No</th>
                <th class="py-3 px-4 w-32">NIS</th>
                <th class="py-3 px-4 min-w-[180px]">Nama Siswa</th>

                <!-- Dynamic Subject Columns (Header Singkat Kode Mapel) -->
                <th
                  v-for="t in inspectionData.teachings"
                  :key="t.id"
                  class="py-3 px-4 text-center min-w-[100px]"
                >
                  <div class="font-bold text-gray-900 dark:text-white font-mono uppercase text-xs" :title="t.subjectName">
                    {{ t.subjectCode }}
                  </div>
                </th>
                <th class="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
              <tr
                v-for="(st, idx) in paginatedStudents"
                :key="st.studentId"
                class="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <td class="py-3 px-4 text-center text-xs text-gray-400 font-mono">
                  {{ (currentPage - 1) * itemsPerPage + Number(idx) + 1 }}
                </td>
                <td class="py-3 px-4 font-mono text-xs text-gray-500 dark:text-gray-400">{{ st.nis || '-' }}</td>
                <td class="py-3 px-4 font-medium text-gray-900 dark:text-white">{{ st.fullname }}</td>

                <!-- Subject Final Scores with Badge (Highlight Warna jika di bawah KKM 75) -->
                <td
                  v-for="t in inspectionData.teachings"
                  :key="t.id"
                  class="py-3 px-4 text-center font-mono"
                >
                  <template v-if="st.subjectGrades?.[t.id]?.final !== null && st.subjectGrades?.[t.id]?.final !== undefined">
                    <UBadge
                      :color="(st.subjectGrades[t.id].isPassed === false || Number(st.subjectGrades[t.id].final) < 75) ? 'error' : 'success'"
                      variant="solid"
                      size="md"
                      class="font-extrabold text-xs font-mono"
                    >
                      {{ Math.round(st.subjectGrades[t.id].final) }}
                    </UBadge>
                  </template>
                  <span v-else class="text-gray-300 dark:text-gray-600 text-xs">-</span>
                </td>
                <td class="py-3 px-4 text-center">
                  <UTooltip text="Analisis AI Siswa">
                    <UButton
                      :to="`/teacher/homeroom/student/${st.studentId}`"
                      icon="i-lucide-bot"
                      color="primary"
                      variant="ghost"
                      size="sm"
                    />
                  </UTooltip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <template v-if="totalStudents > 0" #footer>
          <div class="flex justify-end items-center text-xs text-gray-500">
            <UPagination
              :page="currentPage"
              :items-per-page="itemsPerPage"
              :total="totalStudents"
              @update:page="(p: number) => currentPage = p"
            />
          </div>
        </template>
      </UCard>
    </div>

    <!-- MODE 2: SUBJECT_DETAIL (Detail Mapel Spesifik) -->
    <div v-else-if="inspectionData?.mode === 'SUBJECT_DETAIL'" class="space-y-4">
      <UCard>
        <template #header>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2">
                <UBadge color="primary" variant="subtle" size="sm" class="font-mono hidden sm:inline-flex">
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

            <div class="flex items-center justify-between w-full sm:w-auto gap-2">
              <UBadge color="neutral" variant="subtle" size="sm" class="shrink-0">
                Formula: 50% Avg PH + 25% STS + 25% SAS
              </UBadge>
              <UBadge color="neutral" variant="subtle" size="sm" class="shrink-0">
                {{ totalStudents }} Siswa
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

                <!-- Individual Grade Item Columns -->
                <th
                  v-for="gi in (inspectionData.detailGradeItems || inspectionData.phGradeItems || [])"
                  :key="gi.id"
                  class="py-3 px-4 text-center min-w-[110px]"
                >
                  <div class="flex items-center justify-center gap-1">
                    <UBadge
                      :color="gi.category === 'PH' ? 'info' : 'neutral'"
                      variant="subtle"
                      size="xs"
                      class="font-mono text-[9px] uppercase"
                    >
                      {{ gi.category || 'Tugas/Kuis' }}
                    </UBadge>
                  </div>
                  <div class="font-bold text-gray-900 dark:text-gray-100 mt-0.5 truncate max-w-[110px] mx-auto" :title="gi.name">
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

                <th class="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
              <tr
                v-for="(st, idx) in paginatedStudents"
                :key="st.studentId"
                class="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <td class="py-3 px-4 text-center text-xs text-gray-400 font-mono">
                  {{ (currentPage - 1) * itemsPerPage + Number(idx) + 1 }}
                </td>
                <td class="py-3 px-4 font-mono text-xs text-gray-500 dark:text-gray-400">{{ st.nis || '-' }}</td>
                <td class="py-3 px-4 font-medium text-gray-900 dark:text-white">{{ st.fullname }}</td>

                <!-- Item Scores for ALL Grade Items -->
                <td
                  v-for="gi in (inspectionData.detailGradeItems || inspectionData.phGradeItems || [])"
                  :key="gi.id"
                  class="py-3 px-4 text-center font-mono"
                >
                  <span v-if="st.itemScores?.[gi.id] !== undefined && st.itemScores?.[gi.id] !== null" class="font-bold text-gray-800 dark:text-gray-200">
                    {{ st.itemScores[gi.id] }}
                  </span>
                  <span v-else-if="st.phScores?.[gi.id] !== undefined && st.phScores?.[gi.id] !== null" class="font-bold text-gray-800 dark:text-gray-200">
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

                <!-- NILAI AKHIR -->
                <td class="py-3 px-4 text-center bg-gray-50 dark:bg-gray-800/40">
                  <template v-if="st.finalGrade !== null">
                    <UBadge
                      :color="st.finalGrade >= 75 ? 'success' : 'warning'"
                      variant="solid"
                      size="md"
                      class="font-extrabold font-mono"
                    >
                      {{ Math.round(st.finalGrade) }}
                    </UBadge>
                  </template>
                  <span v-else class="text-gray-400 text-xs font-mono">-</span>
                </td>

                <td class="py-3 px-4 text-center">
                  <UTooltip text="Analisis AI Siswa">
                    <UButton
                      :to="`/teacher/homeroom/student/${st.studentId}`"
                      icon="i-lucide-bot"
                      color="primary"
                      variant="ghost"
                      size="sm"
                    />
                  </UTooltip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <template v-if="totalStudents > 0" #footer>
          <div class="flex justify-end items-center text-xs text-gray-500">
            <UPagination
              :page="currentPage"
              :items-per-page="itemsPerPage"
              :total="totalStudents"
              @update:page="(p: number) => currentPage = p"
            />
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>
