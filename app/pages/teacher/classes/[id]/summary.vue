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
    teachingId,
    semesterId: teaching.value?.semesterId
  })),
  immediate: !!teaching.value?.semesterId
})

const studentSummaries = computed<any[]>(() => summaryRes.value?.data ?? [])
const isCalculating = ref(false)

const search = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)

const columns: any[] = [
  { key: 'no', label: 'No', class: 'w-12 text-center' },
  { key: 'nis', label: 'NIS', class: 'w-32', sortable: true },
  { key: 'fullname', label: 'Nama Siswa', sortable: true },
  { key: 'ph', label: 'AVERAGE PH', class: 'bg-blue-50/30 dark:bg-blue-950/10 text-center text-blue-600 dark:text-blue-400 font-mono', sortable: true },
  { key: 'sts', label: 'STS', class: 'bg-amber-50/30 dark:bg-amber-950/10 text-center text-amber-600 dark:text-amber-400 font-mono', sortable: true },
  { key: 'sas', label: 'SAS', class: 'bg-emerald-50/30 dark:bg-emerald-950/10 text-center text-emerald-600 dark:text-emerald-400 font-mono', sortable: true },
  { key: 'final', label: 'NILAI AKHIR', class: 'bg-gray-50 dark:bg-gray-800/40 text-center font-mono', sortable: true }
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

      <div class="flex flex-wrap items-center gap-2">
        <UButton
          :to="`/teacher/classes/${teachingId}/grades`"
          color="success"
          variant="soft"
          class="flex-1 sm:flex-none justify-center font-semibold"
        >
          <template #leading>
            <UIcon name="i-lucide-edit-3" class="hidden sm:inline-block" />
          </template>
          Input Nilai
        </UButton>
        <UButton
          color="primary"
          variant="solid"
          :loading="isCalculating"
          class="flex-1 sm:flex-none justify-center font-bold"
          @click="triggerCalculate"
        >
          <template #leading>
            <UIcon name="i-lucide-refresh-cw" class="hidden sm:inline-block" />
          </template>
          Kalkulasi Ulang
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
            <div class="flex items-center gap-2">
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

      <div v-else>
        <UTable
          :rows="paginatedStudents"
          :columns="columns"
          :empty-state="{ icon: 'i-lucide-file-x', text: 'Tidak ada data siswa yang cocok.' }"
        >
          <template #ph-header="{ column }">
            <div class="font-bold text-blue-800 dark:text-blue-200">{{ (column as any).label }}</div>
            <div class="text-[10px] text-blue-600 dark:text-blue-400 font-normal">Bobot 50%</div>
          </template>
          <template #sts-header="{ column }">
            <div class="font-bold text-amber-800 dark:text-amber-200">{{ (column as any).label }}</div>
            <div class="text-[10px] text-amber-600 dark:text-amber-400 font-normal">Bobot 25%</div>
          </template>
          <template #sas-header="{ column }">
            <div class="font-bold text-emerald-800 dark:text-emerald-200">{{ (column as any).label }}</div>
            <div class="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">Bobot 25%</div>
          </template>
          <template #final-header="{ column }">
            <div class="font-extrabold text-gray-900 dark:text-white">{{ (column as any).label }}</div>
          </template>

          <template #no-data="{ row }">
            <div class="text-center text-xs text-gray-400 font-mono">
              {{ (currentPage - 1) * itemsPerPage + ((row as any)?.index ?? 0) + 1 }}
            </div>
          </template>

          <template #nis-data="{ row }">
            <span class="font-mono text-xs text-gray-500 dark:text-gray-400">{{ (row as any).nis || '-' }}</span>
          </template>

          <template #fullname-data="{ row }">
            <span class="font-medium text-gray-900 dark:text-white">{{ (row as any).fullname }}</span>
          </template>

          <template #ph-data="{ row }">
            <span class="font-bold">
              {{ (row as any).grades?.PH !== null && (row as any).grades?.PH !== undefined ? Math.round((row as any).grades.PH) : '-' }}
            </span>
          </template>
          
          <template #sts-data="{ row }">
            <span class="font-bold">
              {{ (row as any).grades?.STS !== null && (row as any).grades?.STS !== undefined ? Math.round((row as any).grades.STS) : '-' }}
            </span>
          </template>
          
          <template #sas-data="{ row }">
            <span class="font-bold">
              {{ (row as any).grades?.SAS !== null && (row as any).grades?.SAS !== undefined ? Math.round((row as any).grades.SAS) : '-' }}
            </span>
          </template>

          <template #final-data="{ row }">
            <UBadge
              v-if="(row as any).finalScore !== null && (row as any).finalScore !== undefined"
              :color="(row as any).finalScore >= ((teaching?.subject as any)?.kkm || 75) ? 'success' : 'warning'"
              variant="solid"
              size="md"
              class="font-extrabold"
            >
              {{ Math.round((row as any).finalScore) }}
            </UBadge>
            <span v-else class="text-gray-400 text-xs font-mono">-</span>
          </template>
        </UTable>
      </div>

      <template v-if="totalFilteredStudents > 0" #footer>
        <div class="flex justify-between items-center text-xs text-gray-500">
          <span>Menampilkan {{ paginatedStudents.length }} dari {{ totalFilteredStudents }} siswa</span>
          <UPagination
            v-model="currentPage"
            :page-count="itemsPerPage"
            :total="totalFilteredStudents"
          />
        </div>
      </template>
    </UCard>
  </div>
</template>
