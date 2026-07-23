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
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <UButton
            to="/teacher"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            size="xs"
          />
          <h1 class="text-2xl font-bold tracking-tight">
            Rekapitulasi Nilai Wali Kelas
          </h1>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Laporan nilai seluruh mata pelajaran siswa di kelas binaan Anda.
        </p>
      </div>

      <UButton
        icon="i-lucide-rotate-cw"
        color="neutral"
        variant="outline"
        size="sm"
        :loading="pendingGrades"
        @click="() => refreshGrades()"
      >
        Refresh Data
      </UButton>
    </div>

    <!-- Loading State -->
    <div v-if="pendingHomeroom || pendingGrades" class="py-12 text-center text-sm text-gray-400">
      Memuat data rekapitulasi nilai kelas...
    </div>

    <!-- Not A Homeroom Teacher State -->
    <div v-else-if="!homeroom" class="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
      <UIcon name="i-lucide-alert-circle" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
      <h3 class="text-base font-semibold text-gray-900 dark:text-white">Bukan Wali Kelas</h3>
      <p class="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
        Anda tidak terdaftar sebagai wali kelas untuk semester aktif ini.
      </p>
    </div>

    <!-- Report View -->
    <div v-else-if="reportData" class="space-y-6">
      <!-- Info Card -->
      <UCard>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span class="text-xs text-gray-400">Kelas</span>
            <p class="font-bold text-base text-gray-900 dark:text-white">{{ classroom?.name }} (Tingkat {{ classroom?.level }})</p>
          </div>
          <div>
            <span class="text-xs text-gray-400">Semester & Tahun Ajaran</span>
            <p class="font-bold text-base text-gray-900 dark:text-white">Semester {{ semester?.type }} - {{ semester?.academicYear?.name }}</p>
          </div>
          <div>
            <span class="text-xs text-gray-400">Jumlah Siswa & Mapel</span>
            <p class="font-bold text-base text-gray-900 dark:text-white">{{ students.length }} Siswa • {{ subjects.length }} Mapel</p>
          </div>
        </div>
      </UCard>

      <!-- Table View -->
      <UCard>
        <template #header>
          <div class="font-semibold text-sm">
            Tabel Rekap Nilai Siswa (Lintas Mapel)
          </div>
        </template>

        <div v-if="students.length === 0" class="py-8 text-center text-sm text-gray-400">
          Belum ada siswa terdaftar di kelas ini.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="py-3 px-3 w-10 text-center border-r border-gray-200 dark:border-gray-700">No</th>
                <th class="py-3 px-3 min-w-[160px] border-r border-gray-200 dark:border-gray-700">Nama Siswa</th>
                <th class="py-3 px-3 w-24 border-r border-gray-200 dark:border-gray-700">NIS</th>

                <th
                  v-for="sub in subjects"
                  :key="sub.id"
                  class="py-3 px-3 text-center border-r border-gray-200 dark:border-gray-700 min-w-[90px]"
                >
                  <div>{{ sub.code }}</div>
                  <div class="text-[10px] font-normal text-gray-400 line-clamp-1" :title="sub.name">{{ sub.name }}</div>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr
                v-for="(st, index) in students"
                :key="st.studentId"
                class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
              >
                <td class="py-2.5 px-3 text-center border-r border-gray-100 dark:border-gray-800 font-mono text-gray-400">
                  {{ Number(index) + 1 }}
                </td>
                <td class="py-2.5 px-3 border-r border-gray-100 dark:border-gray-800 font-semibold text-gray-900 dark:text-white">
                  {{ st.fullname }}
                </td>
                <td class="py-2.5 px-3 border-r border-gray-100 dark:border-gray-800 font-mono text-gray-500">
                  {{ st.nis || '-' }}
                </td>

                <td
                  v-for="sub in subjects"
                  :key="sub.id"
                  class="py-2.5 px-3 text-center border-r border-gray-100 dark:border-gray-800"
                >
                  <div v-if="st.grades[sub.id] && st.grades[sub.id].finalGrade !== null">
                    <span
                      class="font-bold text-sm"
                      :class="st.grades[sub.id].isPassed === false ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'"
                    >
                      {{ st.grades[sub.id].finalGrade }}
                    </span>
                    <span class="text-[10px] text-gray-400 ml-1">({{ st.grades[sub.id].letterGrade || '-' }})</span>
                  </div>
                  <span v-else class="text-gray-300 dark:text-gray-600">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>
  </div>
</template>
