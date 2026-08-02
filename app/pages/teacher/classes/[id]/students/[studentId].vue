<script setup lang="ts">
definePageMeta({
  layout: 'teacher',
  middleware: ['auth', 'role'],
  role: ['TEACHER', 'ADMIN']
})

const route = useRoute()
const teachingId = route.params.id as string
const studentId = route.params.studentId as string

// Fetch teaching assignment detail
const { data: teachingRes, status: teachingStatus } = await useFetch<any>(`/api/teaching-assignments/${teachingId}`)
const teaching = computed(() => teachingRes.value?.data ?? null)

// Fetch student detail
const { data: studentRes } = await useFetch<any>(`/api/students/${studentId}`)
const student = computed(() => studentRes.value?.data ?? null)

// Fetch student components
const { data: componentsRes, status: componentsStatus, refresh } = await useAsyncData<any>(
  `teacher-student-components-${teachingId}-${studentId}`,
  async () => {
    if (!studentId || !teachingId) return null
    return await ($fetch as any)('/api/grades/components', {
      query: {
        studentId,
        teachingId
      }
    })
  }
)

const components = computed(() => componentsRes.value?.data ?? [])

function getCategoryBadgeColor(cat: string) {
  if (cat === 'PH') return 'info'
  if (cat === 'STS') return 'warning'
  if (cat === 'SAS') return 'primary'
  return 'neutral'
}

function formatDate(dateStr: string | Date | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const search = ref('')
const page = ref(1)
const pageCount = ref(10)

const filteredComponents = computed(() => {
  let list = components.value
  if (search.value) {
    const kw = search.value.toLowerCase()
    list = list.filter((r: any) => 
      (r.gradeItem?.name || '').toLowerCase().includes(kw) ||
      (r.gradeItem?.category || '').toLowerCase().includes(kw)
    )
  }
  return list
})

const paginatedComponents = computed(() => {
  const start = (page.value - 1) * pageCount.value
  const end = start + pageCount.value
  return filteredComponents.value.slice(start, end)
})

watch(search, () => {
  page.value = 1
})
</script>

<template>
  <div class="space-y-6">
    <!-- Back Button & Student Header Banner -->
    <div>
      <UButton
        :to="`/teacher/classes/${teachingId}/summary`"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        label="Kembali ke Ringkasan Nilai Kelas"
        class="mb-3 cursor-pointer"
      />
      
      <div v-if="teaching && student" class="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="absolute -right-10 -bottom-10 opacity-15 pointer-events-none">
          <UIcon name="i-lucide-user-check" class="w-64 h-64 text-white" />
        </div>

        <div class="relative z-10 space-y-2">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur uppercase tracking-wider text-blue-100 border border-white/20 font-mono">
              NIS: {{ student.nis || '-' }}
            </span>
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-950/40 text-blue-200 border border-blue-500/30">
              Kelas {{ teaching.classroom?.name }}
            </span>
          </div>
          <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {{ student.user?.fullname }}
          </h1>
          <p class="text-blue-100 text-sm flex items-center gap-2">
            <UIcon name="i-lucide-book-open" class="w-4 h-4 text-blue-200" />
            Mata Pelajaran: <strong class="text-white font-semibold">{{ teaching.subject?.name }} ({{ teaching.subject?.code }})</strong>
          </p>
        </div>

        <div class="relative z-10 flex items-center gap-2">
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="solid"
            label="Refresh Nilai"
            :loading="componentsStatus === 'pending'"
            class="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur cursor-pointer"
            @click="() => refresh()"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teachingStatus === 'pending' || componentsStatus === 'pending'" class="flex items-center justify-center py-16">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
      <span class="ml-2 text-gray-500">Memuat rincian komponen nilai siswa...</span>
    </div>

    <template v-else>
      <UCard>
        <template #header>
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center justify-between w-full sm:w-auto">
              <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UIcon name="i-lucide-list-checks" class="hidden sm:inline-block w-5 h-5 text-primary-500" />
                Rincian Skor Per Komponen Tugas / Ujian Siswa
              </h3>
            </div>
            <div class="flex items-center gap-3 w-full sm:w-auto">
              <span class="text-xs text-gray-500 hidden sm:inline-block">Total: {{ components.length }} Komponen</span>
              <UInput v-model="search" icon="i-lucide-search" placeholder="Cari nama komponen/kategori..." size="sm" class="w-full sm:w-64" />
            </div>
          </div>
        </template>

        <div v-if="components.length === 0" class="text-center py-12 px-4">
          <UIcon name="i-lucide-file-x" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">Tidak Ada Rincian Komponen</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            Belum ada rincian tugas atau kuis yang di-sync atau diinputkan untuk siswa ini.
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <th class="py-3 px-4 w-12 text-center">No</th>
                <th class="py-3 px-4 min-w-[200px]">Nama Tugas / Penilaian</th>
                <th class="py-3 px-4 text-center min-w-[100px]">Kategori</th>
                <th class="py-3 px-4 text-center min-w-[120px]">Tipe / Sumber</th>
                <th class="py-3 px-4 text-center min-w-[100px] bg-blue-100/50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-x border-gray-200 dark:border-gray-800">Skor / Nilai</th>
                <th class="py-3 px-4 text-right min-w-[140px]">Terakhir Diperbarui</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
              <tr
                v-for="(comp, idx) in paginatedComponents"
                :key="comp.id"
                class="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors"
              >
                <td class="py-3 px-4 text-center text-xs text-gray-400">
                  {{ (page - 1) * pageCount + Number(idx) + 1 }}
                </td>
                <td class="py-3 px-4 font-medium text-gray-900 dark:text-white">
                  {{ comp.gradeItem?.name || 'Item Penilaian' }}
                </td>
                <td class="py-3 px-4 text-center">
                  <UBadge :color="getCategoryBadgeColor(comp.gradeItem?.category || 'PH')" variant="subtle" size="sm" class="font-bold">
                    {{ comp.gradeItem?.category || 'PH' }}
                  </UBadge>
                </td>
                <td class="py-3 px-4 text-center">
                  <span class="text-xs font-mono text-gray-500 uppercase">{{ comp.gradeItem?.itemType || 'ASSIGNMENT' }}</span>
                </td>
                <td class="py-3 px-4 text-center bg-blue-50/30 dark:bg-blue-950/10 font-bold font-mono">
                  <UBadge
                    v-if="comp.score !== null && comp.score !== undefined"
                    :color="comp.score >= 75 ? 'success' : 'warning'"
                    variant="subtle"
                    size="md"
                    class="font-extrabold text-sm"
                  >
                    {{ Math.round(comp.score) }}
                  </UBadge>
                  <span v-else class="text-gray-400 font-mono text-xs">-</span>
                </td>
                <td class="py-3 px-4 text-right text-xs text-gray-500 font-mono">
                  {{ formatDate(comp.lastSync) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <template v-if="filteredComponents.length > 0" #footer>
          <div class="flex justify-end items-center text-xs text-gray-500">
            <UPagination v-model:page="page" :total="filteredComponents.length" :items-per-page="pageCount" />
          </div>
        </template>
      </UCard>
    </template>
  </div>
</template>
