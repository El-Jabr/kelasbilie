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

const studentSummaries = computed(() => summaryRes.value?.data ?? [])
const isCalculating = ref(false)

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

const columns = [
  { accessorKey: 'no', header: 'No' },
  { accessorKey: 'nis', header: 'NIS' },
  { accessorKey: 'fullname', header: 'Nama Siswa' },
  { accessorKey: 'ph', header: 'Rata PH' },
  { accessorKey: 'sts', header: 'STS' },
  { accessorKey: 'sas', header: 'SAS' },
  { accessorKey: 'finalScore', header: 'Nilai Akhir' }
]

function getScoreClass(score: number | null) {
  if (score === null || score === undefined) return 'text-gray-400 font-normal'
  if (score < 75) return 'text-rose-600 font-bold dark:text-rose-400'
  return 'text-emerald-600 font-bold dark:text-emerald-400'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <UButton
          :to="`/teacher/classes/${teachingId}`"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
        />
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Rekapitulasi Nilai Siswa
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ teaching?.subject?.name }} • {{ teaching?.classroom?.name }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          :to="`/teacher/classes/${teachingId}/grades`"
          color="success"
          variant="soft"
          icon="i-lucide-edit-3"
        >
          Input Nilai
        </UButton>
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-refresh-cw"
          :loading="isCalculating"
          @click="triggerCalculate"
        >
          Kalkulasi Ulang
        </UButton>
      </div>
    </div>

    <!-- Summary Table Card -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-bar-chart-3" class="w-5 h-5 text-emerald-500" />
            <h2 class="text-base font-bold text-gray-900 dark:text-white">
              Rekapitulasi (PH, STS, SAS)
            </h2>
          </div>
          <UBadge color="neutral" variant="subtle" size="sm">
            KKM: 75
          </UBadge>
        </div>
      </template>

      <UTable
        :data="studentSummaries"
        :columns="columns"
        :loading="pendingTeaching || pendingSummary"
      >
        <template #no-cell="{ row }">
          <span class="text-xs text-gray-400 font-mono">{{ row.index + 1 }}</span>
        </template>

        <template #nis-cell="{ row }">
          <span class="font-mono text-xs text-gray-600 dark:text-gray-300">
            {{ row.original.nis }}
          </span>
        </template>

        <template #fullname-cell="{ row }">
          <span class="font-medium text-gray-900 dark:text-white text-xs">
            {{ row.original.fullname }}
          </span>
        </template>

        <template #ph-cell="{ row }">
          <span :class="getScoreClass(row.original.grades?.PH)">
            {{ row.original.grades?.PH ?? '-' }}
          </span>
        </template>

        <template #sts-cell="{ row }">
          <span :class="getScoreClass(row.original.grades?.STS)">
            {{ row.original.grades?.STS ?? '-' }}
          </span>
        </template>

        <template #sas-cell="{ row }">
          <span :class="getScoreClass(row.original.grades?.SAS)">
            {{ row.original.grades?.SAS ?? '-' }}
          </span>
        </template>

        <template #finalScore-cell="{ row }">
          <UBadge
            v-if="row.original.finalScore !== null"
            :color="row.original.finalScore < 75 ? 'error' : 'success'"
            variant="subtle"
            size="md"
          >
            {{ row.original.finalScore }}
          </UBadge>
          <span v-else class="text-xs text-gray-400">-</span>
        </template>
      </UTable>
    </UCard>
  </div>
</template>
