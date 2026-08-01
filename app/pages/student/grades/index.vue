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
    if (!studentId.value) return null
    return await $fetch(`/api/grades/student/${studentId.value}`, {
      credentials: 'include'
    })
  },
  {
    watch: [studentId]
  }
)

const gradesList = computed(() => gradesRes.value?.data ?? [])

function getScoreBadgeColor(score: number | null) {
  if (score === null) return 'neutral'
  if (score >= 75) return 'success'
  if (score >= 60) return 'warning'
  return 'error'
}

const search = ref('')
const page = ref(1)
const pageCount = ref(10)

const columns: any[] = [
  { key: 'subject', label: 'Mata Pelajaran', sortable: true },
  { key: 'teacher', label: 'Guru Pengampu', sortable: true },
  { key: 'ph', label: 'AVERAGE PH', class: 'bg-blue-50/30 dark:bg-blue-950/10 text-center text-blue-600 dark:text-blue-400 font-mono', sortable: true },
  { key: 'sts', label: 'STS', class: 'bg-amber-50/30 dark:bg-amber-950/10 text-center text-amber-600 dark:text-amber-400 font-mono', sortable: true },
  { key: 'sas', label: 'SAS', class: 'bg-emerald-50/30 dark:bg-emerald-950/10 text-center text-emerald-600 dark:text-emerald-400 font-mono', sortable: true },
  { key: 'final', label: 'NILAI AKHIR', class: 'bg-gray-50 dark:bg-gray-800/40 text-center font-mono', sortable: true },
  { key: 'actions', label: 'Aksi', class: 'text-center' }
]

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

        <div v-else>
          <UTable
            :rows="paginatedGrades"
            :columns="columns"
            :empty-state="{ icon: 'i-lucide-file-x', text: 'Tidak ada data nilai yang cocok.' }"
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

            <template #subject-data="{ row }">
              <span class="font-bold text-gray-900 dark:text-white block">{{ (row as any).subjectName }}</span>
              <span class="text-xs text-gray-500 font-mono">{{ (row as any).subjectCode }} ({{ (row as any).classroomName }})</span>
            </template>

            <template #teacher-data="{ row }">
              <span class="text-gray-700 dark:text-gray-300 font-medium">{{ (row as any).teacherName || '-' }}</span>
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
                v-if="(row as any).finalScore !== null"
                :color="(row as any).finalScore >= 75 ? 'success' : 'warning'"
                variant="solid"
                size="md"
                class="font-extrabold"
              >
                {{ Math.round((row as any).finalScore) }}
              </UBadge>
              <span v-else class="text-gray-400 text-xs font-mono">-</span>
            </template>

            <template #actions-data="{ row }">
              <div class="text-center">
                <UButton
                  :to="`/student/grades/${(row as any).teachingId}`"
                  color="primary"
                  variant="ghost"
                  size="xs"
                  class="font-semibold"
                >
                  <template #leading>
                    <UIcon name="i-lucide-eye" class="hidden sm:inline-block" />
                  </template>
                  Detail Rincian
                </UButton>
              </div>
            </template>
          </UTable>
        </div>

        <template v-if="filteredGrades.length > 0" #footer>
          <div class="flex justify-between items-center text-xs text-gray-500">
            <span>Menampilkan {{ paginatedGrades.length }} dari {{ filteredGrades.length }} mapel</span>
            <UPagination v-model="page" :page-count="pageCount" :total="filteredGrades.length" />
          </div>
        </template>
      </UCard>
    </template>
  </div>
</template>
