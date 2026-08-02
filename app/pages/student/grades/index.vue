<script setup lang="ts">
definePageMeta({
  layout: 'student',
  middleware: ['auth', 'role'],
  role: 'STUDENT'
})

const { data: studentRes, status: studentStatus } = await useFetch<any>('/api/students/me')
const studentId = computed(() => studentRes.value?.data?.id)

const { data: gradesRes, status: gradesStatus, refresh } = await useAsyncData<any>(
  'student-grades',
  async () => {
    let sId = studentId.value
    if (!sId) {
      const meRes: any = await ($fetch as any)('/api/students/me')
      sId = meRes?.data?.id
    }
    if (!sId) return null
    return await ($fetch as any)(`/api/grades/student/${sId}`)
  },
  {
    watch: [studentId]
  }
)

const gradesList = computed(() => gradesRes.value?.data ?? [])

const search = ref('')
const page = ref(1)
const pageCount = ref(10)

const filteredGrades = computed(() => {
  let list = gradesList.value
  if (search.value) {
    const kw = search.value.toLowerCase()
    list = list.filter((r: any) => 
      (r.subjectName || '').toLowerCase().includes(kw) ||
      (r.teacherName || '').toLowerCase().includes(kw)
    )
  }
  return list
})

const paginatedGrades = computed(() => {
  const start = (page.value - 1) * pageCount.value
  const end = start + pageCount.value
  return filteredGrades.value.slice(start, end)
})

watch(search, () => {
  page.value = 1
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-lucide-award" class="hidden sm:inline-block w-7 h-7 text-emerald-500" />
          Rekapitulasi Nilai Saya
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Daftar rekapitulasi nilai per mata pelajaran untuk semester aktif.
        </p>
      </div>
      <UButton
        color="neutral"
        variant="outline"
        :loading="gradesStatus === 'pending'"
        class="w-full sm:w-auto flex justify-center"
        @click="() => refresh()"
      >
        <template #leading>
          <UIcon name="i-lucide-refresh-cw" class="hidden sm:inline-block" />
        </template>
        Muat Ulang
      </UButton>
    </div>

    <!-- Loading State -->
    <div v-if="studentStatus === 'pending' || gradesStatus === 'pending'" class="py-16 text-center space-y-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
      <p class="text-sm font-medium text-gray-600 dark:text-gray-300">Memuat data rekapitulasi nilai...</p>
    </div>

    <template v-else>
      <UCard>
        <template #header>
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <h2 class="text-base font-bold text-gray-900 dark:text-white">
                Rekap Nilai Mata Pelajaran
              </h2>
              <UBadge color="primary" variant="subtle" size="sm" class="font-bold hidden sm:inline-flex">
                {{ gradesList.length }} Mata Pelajaran
              </UBadge>
            </div>
            <UInput v-model="search" icon="i-lucide-search" placeholder="Cari mapel atau guru..." class="w-full sm:w-64" size="sm" />
          </div>
        </template>

        <div v-if="gradesList.length === 0" class="py-12 text-center text-sm text-gray-400">
          Belum ada data nilai mata pelajaran untuk semester aktif ini.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <th class="py-3 px-4 w-12 text-center">No</th>
                <th class="py-3 px-4 min-w-[200px]">Mata Pelajaran</th>
                <th class="py-3 px-4 min-w-[160px]">Guru Pengampu</th>
                <th class="py-3 px-4 text-center min-w-[120px] bg-blue-100/50 dark:bg-blue-900/30 border-x border-gray-200 dark:border-gray-800">
                  <div class="font-bold text-blue-800 dark:text-blue-200">AVERAGE PH</div>
                  <div class="text-[10px] text-blue-600 dark:text-blue-400 font-normal">Bobot 50%</div>
                </th>
                <th class="py-3 px-4 text-center min-w-[100px] bg-amber-100/50 dark:bg-amber-900/30 border-r border-gray-200 dark:border-gray-800">
                  <div class="font-bold text-amber-800 dark:text-amber-200">STS</div>
                  <div class="text-[10px] text-amber-600 dark:text-amber-400 font-normal">Bobot 25%</div>
                </th>
                <th class="py-3 px-4 text-center min-w-[100px] bg-emerald-100/50 dark:bg-emerald-900/30 border-r border-gray-200 dark:border-gray-800">
                  <div class="font-bold text-emerald-800 dark:text-emerald-200">SAS</div>
                  <div class="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Bobot 25%</div>
                </th>
                <th class="py-3 px-4 text-center min-w-[120px] bg-gray-200 dark:bg-gray-700">
                  <div class="font-extrabold text-gray-900 dark:text-white">NILAI AKHIR</div>
                </th>
                <th class="py-3 px-4 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
              <tr
                v-for="(row, idx) in paginatedGrades"
                :key="row.teachingId"
                class="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <td class="py-3 px-4 text-center text-xs text-gray-400">
                  {{ (page - 1) * pageCount + Number(idx) + 1 }}
                </td>
                <td class="py-3 px-4">
                  <span class="font-bold text-gray-900 dark:text-white block">{{ row.subjectName }}</span>
                  <span class="text-xs text-gray-500 font-mono">{{ row.subjectCode }} ({{ row.classroomName }})</span>
                </td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                  {{ row.teacherName || '-' }}
                </td>

                <td class="py-3 px-4 text-center bg-blue-50/30 dark:bg-blue-950/10 font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {{ row.grades?.PH !== null && row.grades?.PH !== undefined ? Math.round(row.grades.PH) : '-' }}
                </td>

                <td class="py-3 px-4 text-center bg-amber-50/30 dark:bg-amber-950/10 font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {{ row.grades?.STS !== null && row.grades?.STS !== undefined ? Math.round(row.grades.STS) : '-' }}
                </td>

                <td class="py-3 px-4 text-center bg-emerald-50/30 dark:bg-emerald-950/10 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {{ row.grades?.SAS !== null && row.grades?.SAS !== undefined ? Math.round(row.grades.SAS) : '-' }}
                </td>

                <td class="py-3 px-4 text-center bg-gray-50 dark:bg-gray-800/40 font-mono">
                  <UBadge
                    v-if="row.finalScore !== null && row.finalScore !== undefined"
                    :color="row.finalScore >= 75 ? 'success' : 'warning'"
                    variant="solid"
                    size="md"
                    class="font-extrabold"
                  >
                    {{ Math.round(row.finalScore) }}
                  </UBadge>
                  <span v-else class="text-gray-400 text-xs font-mono">-</span>
                </td>

                <td class="py-3 px-4 text-center">
                  <UTooltip text="Detail Rincian Nilai Komponen">
                    <UButton
                      :to="`/student/grades/${row.teachingId}`"
                      icon="i-lucide-eye"
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

        <template v-if="filteredGrades.length > 0" #footer>
          <div class="flex justify-end items-center text-xs text-gray-500">
            <UPagination v-model="page" :page-count="pageCount" :total="filteredGrades.length" />
          </div>
        </template>
      </UCard>
    </template>
  </div>
</template>
