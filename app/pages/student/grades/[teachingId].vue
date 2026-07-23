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
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <UIcon name="i-lucide-list-checks" class="w-5 h-5 text-primary-500" />
              Rincian Skor Per Komponen Tugas / Ujian
            </h3>
            <span class="text-xs text-gray-500">Total: {{ components.length }} Komponen</span>
          </div>
        </template>

        <div v-if="components.length === 0" class="text-center py-12 px-4">
          <UIcon name="i-lucide-file-x" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">Tidak Ada Rincian Komponen</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
            Belum ada rincian tugas atau kuis yang di-sync atau diinputkan untuk mata pelajaran ini.
          </p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="py-3 px-4">Nama Tugas / Penilaian</th>
                <th class="py-3 px-4">Kategori</th>
                <th class="py-3 px-4">Tipe / Sumber</th>
                <th class="py-3 px-4 text-center">Skor / Nilai</th>
                <th class="py-3 px-4 text-right">Terakhir Diperbarui</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="comp in components" :key="comp.id" class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                <td class="py-3 px-4 font-medium">
                  {{ comp.gradeItem?.name || 'Item Penilaian' }}
                </td>
                <td class="py-3 px-4">
                  <UBadge :color="getCategoryBadgeColor(comp.gradeItem?.category || 'PH')" variant="subtle" size="sm">
                    {{ comp.gradeItem?.category || 'PH' }}
                  </UBadge>
                </td>
                <td class="py-3 px-4 text-xs font-mono text-gray-500 uppercase">
                  {{ comp.gradeItem?.itemType || 'ASSIGNMENT' }}
                </td>
                <td class="py-3 px-4 text-center font-bold text-base">
                  <span :class="(comp.score ?? 0) >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
                    {{ comp.score ?? '-' }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right text-xs text-gray-500">
                  {{ formatDate(comp.lastSync) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </template>
  </div>
</template>
