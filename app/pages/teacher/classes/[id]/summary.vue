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

const { data: summaryRes, pending: pendingSummary, refresh } = await useFetch('/api/grades/summary', {
  query: computed(() => ({
    teachingId
  }))
})

const studentSummaries = computed<any[]>(() => summaryRes.value?.data ?? [])
const isCalculating = ref(false)

const search = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)

const columns: any[] = [
  { accessorKey: 'no', header: 'No' },
  { accessorKey: 'nis', header: 'NIS' },
  { accessorKey: 'fullname', header: 'Nama Siswa' },
  { accessorKey: 'ph', header: 'AVERAGE PH' },
  { accessorKey: 'sts', header: 'STS' },
  { accessorKey: 'sas', header: 'SAS' },
  { accessorKey: 'final', header: 'NILAI AKHIR' }
]

const filteredStudents = computed(() => {
  let list = studentSummaries.value
  if (search.value) {
    const kw = search.value.toLowerCase()
    list = list.filter((r: any) => 
      (r.fullname || '').toLowerCase().includes(kw) ||
      (r.nis || '').toLowerCase().includes(kw)
    )
  }
  return list
})

const totalStudents = computed(() => studentSummaries.value.length)
const totalFilteredStudents = computed(() => filteredStudents.value.length)

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredStudents.value.slice(start, start + itemsPerPage.value)
})

watch(search, () => {
  currentPage.value = 1
})

async function triggerCalculate() {
  if (!teaching.value) return
  isCalculating.value = true
  try {
    await $fetch('/api/grades/calculate', {
      method: 'POST',
      body: {
        teachingId: teaching.value.id,
        semesterId: teaching.value.semesterId
      }
    })
    toast.add({
      title: 'Berhasil',
      description: 'Kalkulasi rekapitulasi nilai telah dikalkulasi ulang.',
      color: 'success'
    })
    await refresh()
  } catch (err: any) {
    toast.add({
      title: 'Gagal',
      description: err.data?.statusMessage || 'Gagal menghitung nilai.',
      color: 'error'
    })
  } finally {
    isCalculating.value = false
  }
}

function getScoreBadgeColor(score: number | null, kkm = 75) {
  if (score === null || score === undefined) return 'neutral'
  if (score >= kkm) return 'success'
  return 'warning'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Page -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <UButton
          :to="`/teacher/classes/${teachingId}`"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          class="hidden sm:inline-flex"
        />
        <div>
          <h1 class="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <UIcon name="i-lucide-bar-chart-3" class="hidden sm:inline-block w-7 h-7 text-emerald-500" />
            Rekapitulasi Nilai Siswa
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ teaching?.subject?.name }} ({{ teaching?.subject?.code }}) • Kelas {{ teaching?.classroom?.name }}
          </p>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
        <div class="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto">
          <UButton
            :to="`/teacher/classes/${teachingId}/grades`"
            color="success"
            variant="soft"
            icon="i-lucide-edit-3"
            class="justify-center font-semibold text-xs sm:text-sm w-full sm:w-auto"
          >
            Input Nilai
          </UButton>
          <UButton
            color="primary"
            variant="soft"
            icon="i-lucide-refresh-cw"
            :loading="isCalculating"
            class="justify-center font-bold text-xs sm:text-sm cursor-pointer w-full sm:w-auto"
            @click="triggerCalculate"
          >
            Kalkulasi Ulang
          </UButton>
        </div>
        <UButton
          :to="`/teacher/classes/${teachingId}/ai-analysis`"
          color="primary"
          variant="solid"
          icon="i-lucide-brain-circuit"
          class="justify-center font-semibold text-xs sm:text-sm w-full sm:w-auto"
        >
          Analisis AI Kelas
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pendingTeaching || pendingSummary" class="py-16 text-center space-y-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
      <p class="text-sm font-medium text-gray-600 dark:text-gray-300">Memuat rekapitulasi nilai siswa...</p>
    </div>

    <!-- Summary Table Card -->
    <UCard v-else>
      <template #header>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-bold text-gray-900 dark:text-white">
              Tabel Rekapitulasi Nilai Akhir Siswa
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Formula: 50% Avg PH + 25% STS + 25% SAS
            </p>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <UInput v-model="search" icon="i-lucide-search" placeholder="Cari nama atau NIS..." class="w-full sm:w-64" size="sm" />
            <div class="flex items-center justify-end w-full sm:w-auto gap-2">
              <UBadge color="info" variant="subtle" size="sm" class="font-bold">
                KKM: {{ (teaching?.subject as any)?.kkm || 75 }}
              </UBadge>
              <UBadge color="neutral" variant="subtle" size="sm" class="font-bold whitespace-nowrap">
                {{ totalStudents }} Siswa
              </UBadge>
            </div>
          </div>
        </div>
      </template>

      <div v-if="studentSummaries.length === 0" class="py-12 text-center text-sm text-gray-400">
        Belum ada data nilai terdaftar untuk siswa di kelas ini.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              <th class="py-3 px-4 w-12 text-center">No</th>
              <th class="py-3 px-4 w-32">NIS</th>
              <th class="py-3 px-4 min-w-[180px]">Nama Siswa</th>
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
              v-for="(st, idx) in paginatedStudents"
              :key="st.studentId"
              class="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
            >
              <td class="py-3 px-4 text-center text-xs text-gray-400">
                {{ (currentPage - 1) * itemsPerPage + Number(idx) + 1 }}
              </td>
              <td class="py-3 px-4 font-mono text-xs text-gray-500 dark:text-gray-400">{{ st.nis || '-' }}</td>
              <td class="py-3 px-4 font-medium text-gray-900 dark:text-white">{{ st.fullname }}</td>

              <td class="py-3 px-4 text-center bg-blue-50/30 dark:bg-blue-950/10 font-bold text-blue-600 dark:text-blue-400 font-mono">
                {{ st.grades?.PH !== null && st.grades?.PH !== undefined ? Math.round(st.grades.PH) : '-' }}
              </td>

              <td class="py-3 px-4 text-center bg-amber-50/30 dark:bg-amber-950/10 font-bold text-amber-600 dark:text-amber-400 font-mono">
                {{ st.grades?.STS !== null && st.grades?.STS !== undefined ? Math.round(st.grades.STS) : '-' }}
              </td>

              <td class="py-3 px-4 text-center bg-emerald-50/30 dark:bg-emerald-950/10 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {{ st.grades?.SAS !== null && st.grades?.SAS !== undefined ? Math.round(st.grades.SAS) : '-' }}
              </td>

              <td class="py-3 px-4 text-center bg-gray-50 dark:bg-gray-800/40 font-mono">
                <UBadge
                  v-if="st.finalScore !== null && st.finalScore !== undefined"
                  :color="st.finalScore >= ((teaching?.subject as any)?.kkm || 75) ? 'success' : 'warning'"
                  variant="solid"
                  size="md"
                  class="font-extrabold"
                >
                  {{ Math.round(st.finalScore) }}
                </UBadge>
                <span v-else class="text-gray-400 text-xs font-mono">-</span>
              </td>

              <td class="py-3 px-4 text-center">
                <UTooltip text="Detail Rincian Nilai Siswa">
                  <UButton
                    :to="`/teacher/classes/${teachingId}/students/${st.studentId}`"
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

      <template v-if="totalFilteredStudents > 0" #footer>
        <div class="flex justify-end items-center text-xs text-gray-500">
          <UPagination
            v-model:page="currentPage"
            :total="totalFilteredStudents"
            :items-per-page="itemsPerPage"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
