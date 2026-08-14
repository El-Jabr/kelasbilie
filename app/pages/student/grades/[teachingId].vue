<script setup lang="ts">
definePageMeta({
  layout: 'student',
  middleware: ['auth', 'role'],
  role: 'STUDENT'
})

const route = useRoute()
const teachingId = route.params.teachingId as string

const { data: studentRes } = await useFetch<{ data?: { id?: string } }>('/api/students/me')
const studentId = computed(() => studentRes.value?.data?.id)

interface TeachingRecord {
  subject?: { code?: string, name?: string }
  classroom?: { name?: string }
  teacher?: { user?: { fullname?: string } }
  [key: string]: unknown
}

const { data: teachingRes, status: teachingStatus } = await useFetch<{ data?: TeachingRecord }>(`/api/teaching-assignments/${teachingId}`)
const teaching = computed(() => teachingRes.value?.data ?? null)

interface GradeRow {
  id: string
  gradeItem?: {
    name?: string
    category?: string
    itemType?: string
  }
  grade?: number
  score?: number | null
  lastUpdated?: string
  lastSync?: string | Date | null
  [key: string]: unknown
}

const { data: componentsRes, status: componentsStatus, refresh } = await useAsyncData<{ data?: GradeRow[] } | null>(
  `components-${teachingId}`,
  async () => {
    let sId = studentId.value
    if (!sId) {
      const meRes = await $fetch<{ data?: { id?: string } }>('/api/students/me')
      sId = meRes?.data?.id
    }
    if (!sId || !teachingId) return null
    return await $fetch<{ data?: GradeRow[] }>('/api/grades/components', {
      query: {
        studentId: sId,
        teachingId
      }
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

const filteredComponents = computed(() => {
  let list = components.value
  if (search.value) {
    const kw = search.value.toLowerCase()
    list = list.filter((r: GradeRow) => {
      const gi = r.gradeItem
      return (gi?.name || '').toLowerCase().includes(kw)
        || (gi?.category || '').toLowerCase().includes(kw)
    })
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
    <!-- Back Button & Page Title Banner -->
    <div>
      <UButton
        to="/student/grades"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        label="Kembali ke Rekap Nilai"
        class="mb-3"
      />

      <div
        v-if="teaching"
        class="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-800 rounded-2xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div class="absolute -right-10 -bottom-10 opacity-15 pointer-events-none">
          <UIcon
            name="i-lucide-book-open"
            class="w-64 h-64 text-white"
          />
        </div>

        <div class="relative z-10 space-y-2">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur uppercase tracking-wider text-emerald-100 border border-white/20 font-mono">
              {{ teaching.subject?.code }}
            </span>
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/40 text-emerald-200 border border-emerald-500/30">
              Kelas {{ teaching.classroom?.name }}
            </span>
          </div>
          <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {{ teaching.subject?.name }}
          </h1>
          <p class="text-emerald-100 text-sm flex items-center gap-2">
            <UIcon
              name="i-lucide-user"
              class="w-4 h-4 text-emerald-200"
            />
            Guru Pengampu: <strong class="text-white font-semibold">{{ teaching.teacher?.user?.fullname }}</strong>
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
    <div
      v-if="teachingStatus === 'pending' || componentsStatus === 'pending'"
      class="flex items-center justify-center py-16"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 animate-spin text-primary-500"
      />
      <span class="ml-2 text-gray-500">Memuat rincian komponen nilai...</span>
    </div>

    <template v-else>
      <UCard>
        <template #header>
          <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center justify-between w-full sm:w-auto">
              <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <UIcon
                  name="i-lucide-list-checks"
                  class="hidden sm:inline-block w-5 h-5 text-primary-500"
                />
                Rincian Skor Per Komponen Tugas / Ujian
              </h3>
            </div>
            <div class="flex items-center gap-3 w-full sm:w-auto">
              <span class="text-xs text-gray-500 hidden sm:inline-block">Total: {{ components.length }} Komponen</span>
              <UInput
                v-model="search"
                icon="i-lucide-search"
                placeholder="Cari nama komponen/kategori..."
                size="sm"
                class="w-full sm:w-64"
              />
            </div>
          </div>
        </template>

        <div
          v-if="components.length === 0"
          class="text-center py-12 px-4"
        >
          <UIcon
            name="i-lucide-file-x"
            class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"
          />
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">
            Tidak Ada Rincian Komponen
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            Belum ada rincian tugas atau kuis yang di-sync atau diinputkan untuk mata pelajaran ini.
          </p>
        </div>

        <div
          v-else
          class="overflow-x-auto"
        >
          <table class="w-full text-left text-sm border-collapse">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-800/60 text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <th class="py-3 px-4 w-12 text-center">
                  No
                </th>
                <th class="py-3 px-4 min-w-[200px]">
                  Nama Tugas / Penilaian
                </th>
                <th class="py-3 px-4 text-center min-w-[100px]">
                  Kategori
                </th>
                <th class="py-3 px-4 text-center min-w-[120px]">
                  Tipe / Sumber
                </th>
                <th class="py-3 px-4 text-center min-w-[100px] bg-blue-100/50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-x border-gray-200 dark:border-gray-800">
                  Skor / Nilai
                </th>
                <th class="py-3 px-4 text-right min-w-[140px]">
                  Terakhir Diperbarui
                </th>
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
                  <UBadge
                    :color="getCategoryBadgeColor(comp.gradeItem?.category || 'PH')"
                    variant="subtle"
                    size="sm"
                    class="font-bold"
                  >
                    {{ comp.gradeItem?.category || 'PH' }}
                  </UBadge>
                </td>
                <td class="py-3 px-4 text-center">
                  <span class="text-xs font-mono text-gray-500 uppercase">{{ comp.gradeItem?.itemType || 'ASSIGNMENT' }}</span>
                </td>
                <td class="py-3 px-4 text-center bg-blue-50/30 dark:bg-blue-950/10 font-bold font-mono">
                  <UBadge
                    v-if="comp.score !== null && comp.score !== undefined"
                    :color="Number(comp.score) >= 75 ? 'success' : 'warning'"
                    variant="subtle"
                    size="md"
                    class="font-extrabold text-sm"
                  >
                    {{ Math.round(Number(comp.score)) }}
                  </UBadge>
                  <span
                    v-else
                    class="text-gray-400 font-mono text-xs"
                  >-</span>
                </td>
                <td class="py-3 px-4 text-right text-xs text-gray-500 font-mono">
                  {{ formatDate(comp.lastSync as string | Date | null) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <template
          v-if="filteredComponents.length > 0"
          #footer
        >
          <div class="flex justify-end items-center text-xs text-gray-500">
            <UPagination
              v-model:page="page"
              :total="filteredComponents.length"
              :items-per-page="pageCount"
            />
          </div>
        </template>
      </UCard>
    </template>
  </div>
</template>
