<script setup lang="ts">
definePageMeta({
  layout: 'teacher',
  middleware: ['auth', 'role'],
  role: ['TEACHER', 'ADMIN']
})

useSeoMeta({
  title: 'Rekap Nilai Wali Kelas'
})

const { data: homeroomRes, pending: pendingHomeroom } = await useFetch('/api/homerooms/my')
const homeroom = computed(() => homeroomRes.value?.data)

const classroomId = computed(() => homeroom.value?.classroomId || '')

const fetchUrl = computed(() => (classroomId.value ? `/api/grades/classroom/${classroomId.value}` : '/api/grades/classroom/none'))

const { data: gradesRes, pending: pendingGrades, refresh: refreshGrades } = await useFetch<any>(
  fetchUrl,
  { immediate: !!classroomId.value }
)

const reportData = computed(() => gradesRes.value?.data)
const classroom = computed(() => reportData.value?.classroom)
const semester = computed(() => reportData.value?.semester)
const subjects = computed(() => reportData.value?.subjects || [])
const students = computed(() => reportData.value?.students || [])

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
    <!-- Header Page -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
          Laporan hasil kalkulasi Nilai Akhir siswa per mata pelajaran di kelas binaan Anda.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          :loading="pendingGrades"
          class="w-full sm:w-auto flex justify-center"
          @click="() => refreshGrades()"
        >
          <template #leading>
            <UIcon name="i-lucide-rotate-cw" class="hidden sm:inline-block" />
          </template>
          Refresh Data
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pendingHomeroom || pendingGrades" class="py-16 text-center space-y-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
      <p class="text-sm font-medium text-gray-600 dark:text-gray-300">Memuat data rekapitulasi nilai kelas...</p>
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

    <!-- Report View (Matching Admin CLASSROOM_OVERVIEW Table Style) -->
    <div v-else-if="reportData" class="space-y-4">
      <UCard>
        <template #header>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                Rekap Nilai Akhir Seluruh Mata Pelajaran
              </h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Kelas: <strong>{{ classroom?.name }} (Tingkat {{ classroom?.level }})</strong> • 
                Semester {{ semester?.type }} ({{ semester?.academicYear?.name }})
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <UBadge color="primary" variant="subtle" size="sm" class="font-bold">
                {{ subjects.length }} Mata Pelajaran
              </UBadge>
              <UBadge color="neutral" variant="subtle" size="sm">
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

                <!-- Dynamic Subject Columns -->
                <th
                  v-for="sub in subjects"
                  :key="sub.id"
                  class="py-3 px-4 text-center min-w-[140px]"
                >
                  <div class="font-bold text-gray-900 dark:text-white truncate max-w-[140px] mx-auto" :title="sub.name">
                    {{ sub.code }}
                  </div>
                </th>
                <th class="py-3 px-4 text-center">Aksi</th>
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

                <!-- Subject Final Scores with Badge -->
                <td
                  v-for="sub in subjects"
                  :key="sub.id"
                  class="py-3 px-4 text-center font-mono"
                >
                  <template v-if="st.grades[sub.id] && st.grades[sub.id].finalGrade !== null">
                    <UBadge
                      :color="st.grades[sub.id].isPassed === false ? 'warning' : 'success'"
                      variant="solid"
                      size="md"
                      class="font-extrabold"
                    >
                      {{ Math.round(st.grades[sub.id].finalGrade) }}
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
                      size="md"
                    />
                  </UTooltip>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <!-- Pagination -->
      <div v-if="totalStudents > 0" class="flex justify-end mt-4">
        <UPagination
          :page="currentPage"
          :items-per-page="itemsPerPage"
          :total="totalStudents"
          @update:page="(p: number) => currentPage = p"
        />
      </div>
    </div>
  </div>
</template>
