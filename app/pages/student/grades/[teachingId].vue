<script setup lang="ts">
definePageMeta({
  layout: 'student',
  middleware: ['auth', 'role'],
  role: 'STUDENT'
})

const route = useRoute()
const teachingId = route.params.teachingId as string

const { data: studentRes } = await useFetch<any>('/api/students/me')
const studentId = computed(() => studentRes.value?.data?.id)

const { data: teachingRes, status: teachingStatus } = await useFetch<any>(`/api/teaching-assignments/${teachingId}`)
const teaching = computed(() => teachingRes.value?.data ?? null)

const { data: componentsRes, status: componentsStatus, refresh } = await useAsyncData<any>(
  `components-${teachingId}`,
  async () => {
    if (!studentId.value || !teachingId) return null
    return await $fetch('/api/grades/components', {
      query: {
        studentId: studentId.value,
        teachingId
      },
      credentials: 'include'
    })
  },
  {
    watch: [studentId]
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

const columns: any[] = [
  { key: 'name', label: 'Nama Tugas / Penilaian', sortable: true },
  { key: 'category', label: 'Kategori', sortable: true },
  { key: 'type', label: 'Tipe / Sumber', sortable: true },
  { key: 'score', label: 'Skor / Nilai', sortable: true, class: 'text-center' },
  { key: 'lastSync', label: 'Terakhir Diperbarui', sortable: true, class: 'text-right' }
]

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
    <!-- Back Button & Page Title -->
    <div>
      <UButton
        to="/student/grades"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        label="Kembali ke Rekap Nilai"
        class="mb-3"
      />
      
      <div v-if="teaching" class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <UBadge color="neutral" variant="subtle" size="sm" class="font-mono">
              {{ teaching.subject?.code }}
            </UBadge>
            <span class="text-xs text-gray-500 font-medium">Kelas {{ teaching.classroom?.name }}</span>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {{ teaching.subject?.name }}
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-2">
            <UIcon name="i-lucide-user" class="w-4 h-4 text-gray-400" />
            Guru Pengampu: <strong class="text-gray-800 dark:text-gray-200">{{ teaching.teacher?.user?.fullname }}</strong>
          </p>
        </div>

        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="outline"
            label="Refresh Nilai"
            :loading="componentsStatus === 'pending'"
            @click="() => refresh()"
          />
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="teachingStatus === 'pending' || componentsStatus === 'pending'" class="flex items-center justify-center py-16">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
      <span class="ml-2 text-gray-500">Memuat rincian komponen nilai...</span>
    </div>

    <template v-else>
      <UCard>
        <template #header>
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center justify-between w-full sm:w-auto">
              <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UIcon name="i-lucide-list-checks" class="hidden sm:inline-block w-5 h-5 text-primary-500" />
                Rincian Skor Per Komponen Tugas / Ujian
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
            Belum ada rincian tugas atau kuis yang di-sync atau diinputkan untuk mata pelajaran ini.
          </p>
        </div>

        <div v-else>
          <UTable
            :rows="paginatedComponents"
            :columns="columns"
            :empty-state="{ icon: 'i-lucide-file-x', text: 'Tidak ada data komponen yang cocok.' }"
          >
            <template #name-data="{ row }">
              <span class="font-medium text-gray-900 dark:text-white">{{ (row as any).gradeItem?.name || 'Item Penilaian' }}</span>
            </template>

            <template #category-data="{ row }">
              <UBadge :color="getCategoryBadgeColor((row as any).gradeItem?.category || 'PH')" variant="subtle" size="sm" class="font-bold">
                {{ (row as any).gradeItem?.category || 'PH' }}
              </UBadge>
            </template>

            <template #type-data="{ row }">
              <span class="text-xs font-mono text-gray-500 uppercase">{{ (row as any).gradeItem?.itemType || 'ASSIGNMENT' }}</span>
            </template>

            <template #score-data="{ row }">
              <div class="text-center font-mono">
                <UBadge
                  v-if="(row as any).score !== null && (row as any).score !== undefined"
                  :color="(row as any).score >= 75 ? 'success' : 'warning'"
                  variant="subtle"
                  size="md"
                  class="font-extrabold text-sm"
                >
                  {{ Math.round((row as any).score) }}
                </UBadge>
                <span v-else class="text-gray-400 font-mono text-xs">-</span>
              </div>
            </template>

            <template #lastSync-data="{ row }">
              <div class="text-right text-xs text-gray-500 font-mono">
                {{ formatDate((row as any).lastSync) }}
              </div>
            </template>
          </UTable>
        </div>

        <template v-if="filteredComponents.length > 0" #footer>
          <div class="flex justify-between items-center text-xs text-gray-500">
            <span>Menampilkan {{ paginatedComponents.length }} dari {{ filteredComponents.length }} komponen</span>
            <UPagination v-model="page" :page-count="pageCount" :total="filteredComponents.length" />
          </div>
        </template>
      </UCard>
    </template>
  </div>
</template>
