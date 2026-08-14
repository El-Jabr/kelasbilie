<script setup lang="ts">
import { LazyModalConfirm } from '#components'

definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'AI Analisis Kelas'
})

const toast = useToast()

const selectedClassroom = ref('')
const selectedSemester = ref('')
const forceRefresh = ref(false)

const isAnalyzing = ref(false)
interface AnalysisData {
  ringkasan?: {
    jumlahLulus?: number
    jumlahRemidi?: number
    rataRataKelas?: number
    mapelTerkuat?: string
    mapelTerlemah?: string
  }
  narasi?: string
  rekomendasiKelas?: {
    prioritas?: string
    mapel?: string
    tindakan?: string
  }[]
  siswaPerhatianKhusus?: {
    nama?: string
    alasan?: string
    saran?: string
  }[]
  [key: string]: unknown
}
const analysisData = ref<AnalysisData | null>(null)
const isCached = ref(false)
const generatedAt = ref('')

const { data: filterData } = await useAsyncData('kelas-filters', async () => {
  const [classRes, semRes] = await Promise.all([
    $fetch<{ data?: { id: string, name: string }[] }>('/api/classes?limit=1000'),
    $fetch<{ data?: { id: string, type: string, isActive: boolean, academicYear: { name: string } }[] }>('/api/semesters?limit=1000')
  ])
  return {
    classes: classRes.data || [],
    semesters: semRes.data || []
  }
})

const classrooms = computed(() => filterData.value?.classes || [])
const semesters = computed(() => filterData.value?.semesters || [])

const classroomOptions = computed(() => classrooms.value.map((c: { name: string, id: string }) => ({ label: c.name, value: c.id })))
const semesterOptions = computed(() => semesters.value.map((s: { type: string, academicYear: { name: string }, isActive: boolean, id: string }) => ({ label: `${s.type} ${s.academicYear.name}${s.isActive ? ' (Aktif)' : ''}`, value: s.id })))

// Auto select active semester
watchEffect(() => {
  if (semesters.value.length && !selectedSemester.value) {
    const activeSem = semesters.value.find((s: { isActive?: boolean }) => s.isActive)
    if (activeSem) selectedSemester.value = activeSem.id
  }
})

async function analyzeClass() {
  if (!selectedClassroom.value) {
    toast.add({ title: 'Validasi', description: 'Pilih kelas terlebih dahulu.', color: 'warning' })
    return
  }

  isAnalyzing.value = true
  analysisData.value = null

  try {
    const res = await $fetch<{ data?: AnalysisData, cached?: boolean, generatedAt?: string }>('/api/ai/analyze-class', {
      method: 'POST',
      body: {
        classroomId: selectedClassroom.value,
        semesterId: selectedSemester.value || undefined,
        forceRefresh: forceRefresh.value
      }
    })

    analysisData.value = res.data ?? null
    isCached.value = res.cached ?? false
    generatedAt.value = new Date(res.generatedAt ?? '').toLocaleString('id-ID')
    forceRefresh.value = false

    toast.add({ title: 'Analisis Berhasil', color: 'success' })
  } catch (e) {
    const error = e as { data?: { statusMessage?: string } }
    toast.add({
      title: 'Analisis Gagal',
      description: error.data?.statusMessage || 'Terjadi kesalahan saat memanggil AI.',
      color: 'error'
    })
  } finally {
    isAnalyzing.value = false
  }
}

const overlay = useOverlay()
const confirmModal = overlay.create(LazyModalConfirm)

async function handleForceRefresh() {
  const confirmed = await confirmModal.open({
    title: 'Force Refresh AI Analisis',
    message: 'Anda yakin ingin force refresh? Ini akan memanggil ulang API AI dan mungkin memakan biaya/waktu.',
    confirmText: 'Ya, Refresh',
    color: 'warning'
  })
  if (confirmed) {
    forceRefresh.value = true
    analyzeClass()
  }
}

// Visual Chart Helper Calculations
const totalSiswaAnalisis = computed(() => {
  if (!analysisData.value?.ringkasan) return 0
  const lulus = Number(analysisData.value.ringkasan.jumlahLulus) || 0
  const remidi = Number(analysisData.value.ringkasan.jumlahRemidi) || 0
  return lulus + remidi
})

const persentaseLulus = computed(() => {
  if (!totalSiswaAnalisis.value) return 0
  const lulus = Number(analysisData.value?.ringkasan?.jumlahLulus) || 0
  return Math.round((lulus / totalSiswaAnalisis.value) * 100)
})

const persentaseRemidi = computed(() => {
  if (!totalSiswaAnalisis.value) return 0
  return 100 - persentaseLulus.value
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header Page Banner -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight flex items-center gap-2 text-gray-900 dark:text-white">
          <UIcon
            name="i-lucide-brain-circuit"
            class="w-8 h-8 text-primary-500"
          />
          AI Analisis Performa Kelas
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Laporan cerdas performa akademik kelas, analisis ketuntasan, dan rekomendasi AI Google Gemini.
        </p>
      </div>
    </div>

    <!-- Filter Card -->
    <UCard class="shadow-sm border border-gray-200 dark:border-gray-800">
      <div class="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
        <div class="w-full md:flex-1">
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Pilih Kelas</label>
          <USelect
            v-model="selectedClassroom"
            :items="classroomOptions"
            label-key="label"
            value-key="value"
            placeholder="-- Pilih Kelas --"
            class="w-full"
          />
        </div>
        <div class="w-full md:flex-1">
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Pilih Semester</label>
          <USelect
            v-model="selectedSemester"
            :items="semesterOptions"
            label-key="label"
            value-key="value"
            placeholder="-- Pilih Semester --"
            class="w-full"
          />
        </div>
        <div class="w-full md:w-auto">
          <UButton
            color="primary"
            size="md"
            :loading="isAnalyzing"
            :disabled="!selectedClassroom"
            class="w-full md:w-auto flex justify-center font-bold cursor-pointer"
            @click="analyzeClass"
          >
            <template #leading>
              <UIcon
                name="i-lucide-sparkles"
                class="w-4 h-4"
              />
            </template>
            Analisis Sekarang
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Empty/Loading State -->
    <div
      v-if="isAnalyzing"
      class="py-16 text-center space-y-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-10 h-10 animate-spin text-primary-500 mx-auto"
      />
      <div class="space-y-1">
        <h3 class="font-bold text-gray-900 dark:text-white">
          AI Sedang Menganalisis Performa Kelas...
        </h3>
        <p class="text-xs text-gray-500">
          Mengkalkulasi rata-rata, distribusi kelulusan, dan rekomendasi pedagogi.
        </p>
      </div>
    </div>

    <!-- Hasil Analisis -->
    <div
      v-else-if="analysisData"
      class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <UIcon
            :name="isCached ? 'i-lucide-history' : 'i-lucide-zap'"
            :class="['w-4 h-4', isCached ? 'text-blue-500' : 'text-emerald-500']"
          />
          <span>Status AI: <strong>{{ isCached ? 'Data dari Cache' : 'Generasi Baru' }}</strong></span>
          <span class="text-gray-400">•</span>
          <span>Waktu Diperbarui: {{ generatedAt }}</span>
        </div>
        <UButton
          size="xs"
          color="neutral"
          variant="outline"
          :loading="isAnalyzing"
          class="w-full sm:w-auto justify-center font-semibold cursor-pointer"
          @click="handleForceRefresh"
        >
          <template #leading>
            <UIcon
              name="i-lucide-refresh-cw"
              class="w-3.5 h-3.5"
            />
          </template>
          Force Refresh AI
        </UButton>
      </div>

      <!-- VISUAL DASHBOARD STATS & GRAFIK CARD -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Card 1: Rata-rata & Performa Kelas -->
        <UCard class="relative overflow-hidden border border-primary-200 dark:border-primary-900 bg-gradient-to-br from-primary-50/50 via-white to-primary-100/30 dark:from-primary-950/30 dark:via-gray-800 dark:to-primary-900/20 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wider">Rata-rata Performa Kelas</span>
            <UBadge
              color="primary"
              variant="subtle"
              size="xs"
              class="font-bold"
            >
              {{ (analysisData.ringkasan?.rataRataKelas || 0) >= 75 ? 'Optimal' : 'Perlu Perhatian' }}
            </UBadge>
          </div>

          <div class="flex items-baseline gap-2">
            <span class="text-4xl font-extrabold text-primary-600 dark:text-primary-400 tracking-tight font-mono">
              {{ analysisData.ringkasan?.rataRataKelas || 0 }}
            </span>
            <span class="text-xs text-gray-500 font-mono">/ 100 Poin</span>
          </div>

          <!-- Progress Bar Chart Visual -->
          <div class="mt-4 space-y-1.5">
            <div class="flex justify-between text-xs text-gray-500 font-medium">
              <span>Capaian KKM (75)</span>
              <span>{{ analysisData.ringkasan?.rataRataKelas || 0 }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-1000"
                :class="(analysisData.ringkasan?.rataRataKelas || 0) >= 75 ? 'bg-emerald-500' : 'bg-amber-500'"
                :style="{ width: `${Math.min(analysisData.ringkasan?.rataRataKelas || 0, 100)}%` }"
              />
            </div>
          </div>
        </UCard>

        <!-- Card 2: Grafik Proporsi Kelulusan (Visual Dual Stacked Bar Chart) -->
        <UCard class="border border-gray-200 dark:border-gray-700 shadow-sm">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Grafik Distribusi Kelulusan</span>
            <span class="text-xs font-mono text-gray-500">{{ totalSiswaAnalisis }} Siswa Total</span>
          </div>

          <div class="flex items-center gap-4 my-2">
            <div class="flex-1">
              <div class="flex items-center justify-between text-xs mb-1">
                <span class="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Lulus ({{ analysisData.ringkasan?.jumlahLulus || 0 }})
                </span>
                <span class="font-mono font-bold text-emerald-600 dark:text-emerald-400">{{ persentaseLulus }}%</span>
              </div>
              <div class="flex items-center justify-between text-xs mb-2">
                <span class="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Remidi ({{ analysisData.ringkasan?.jumlahRemidi || 0 }})
                </span>
                <span class="font-mono font-bold text-rose-600 dark:text-rose-400">{{ persentaseRemidi }}%</span>
              </div>
            </div>
          </div>

          <!-- Dual Stacked Bar Chart -->
          <div class="w-full bg-gray-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden flex">
            <div
              class="bg-emerald-500 h-full transition-all duration-1000"
              :style="{ width: `${persentaseLulus}%` }"
              title="Lulus"
            />
            <div
              class="bg-rose-500 h-full transition-all duration-1000"
              :style="{ width: `${persentaseRemidi}%` }"
              title="Remidi"
            />
          </div>
        </UCard>

        <!-- Card 3: Sorotan Mapel Terkuat vs Terlemah -->
        <UCard class="border border-gray-200 dark:border-gray-700 shadow-sm">
          <span class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-3">Sorotan Performa Mapel</span>
          <div class="space-y-3">
            <div class="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between">
              <div class="flex items-center gap-2 min-w-0">
                <UIcon
                  name="i-lucide-trending-up"
                  class="w-4 h-4 text-emerald-600 shrink-0"
                />
                <span class="text-xs text-gray-600 dark:text-gray-400 shrink-0">Mapel Terkuat:</span>
                <strong class="text-xs font-bold text-emerald-700 dark:text-emerald-300 truncate">{{ analysisData.ringkasan?.mapelTerkuat || '-' }}</strong>
              </div>
            </div>

            <div class="p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between">
              <div class="flex items-center gap-2 min-w-0">
                <UIcon
                  name="i-lucide-trending-down"
                  class="w-4 h-4 text-rose-600 shrink-0"
                />
                <span class="text-xs text-gray-600 dark:text-gray-400 shrink-0">Mapel Terlemah:</span>
                <strong class="text-xs font-bold text-rose-700 dark:text-rose-300 truncate">{{ analysisData.ringkasan?.mapelTerlemah || '-' }}</strong>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Evaluasi Umum / Narasi AI -->
      <UCard class="border border-primary-200/70 dark:border-primary-900/60 bg-white dark:bg-gray-800 shadow-sm">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-sparkles"
              class="w-5 h-5 text-primary-500"
            />
            <h3 class="text-base font-bold text-gray-900 dark:text-white">
              Evaluasi & Rangkuman Kualitatif AI
            </h3>
          </div>
        </template>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
          {{ analysisData.narasi || 'Tidak ada narasi evaluasi.' }}
        </p>
      </UCard>

      <!-- Siswa Perlu Perhatian Khusus -->
      <UCard class="border border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10 shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <UIcon
                name="i-lucide-alert-triangle"
                class="w-5 h-5 text-amber-500"
              />
              Siswa Perlu Perhatian Khusus
            </h3>
            <UBadge
              color="warning"
              variant="subtle"
              size="xs"
              class="font-bold"
            >
              {{ analysisData.siswaPerhatianKhusus?.length || 0 }} Siswa
            </UBadge>
          </div>
        </template>

        <div
          v-if="analysisData.siswaPerhatianKhusus?.length"
          class="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div
            v-for="(siswa, idx) in analysisData.siswaPerhatianKhusus"
            :key="idx"
            class="p-4 rounded-xl bg-white dark:bg-gray-800 border border-amber-200/80 dark:border-amber-900/50 shadow-xs space-y-2"
          >
            <div class="flex items-center justify-between">
              <div class="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <UIcon
                  name="i-lucide-user"
                  class="w-4 h-4 text-amber-500"
                />
                {{ siswa.nama }}
              </div>
              <UBadge
                color="warning"
                variant="subtle"
                size="xs"
              >
                Pendampingan
              </UBadge>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-300">
              <strong class="text-gray-800 dark:text-gray-200">Alasan:</strong> {{ siswa.alasan }}
            </p>
            <div class="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 font-medium">
              <span class="font-bold flex items-center gap-1 mb-0.5">
                <UIcon
                  name="i-lucide-lightbulb"
                  class="w-3.5 h-3.5 text-amber-600"
                /> Saran AI:
              </span>
              {{ siswa.saran }}
            </div>
          </div>
        </div>
        <p
          v-else
          class="text-xs text-gray-500 italic text-center py-4"
        >
          Tidak ada siswa yang memerlukan perhatian khusus.
        </p>
      </UCard>

      <!-- Rekomendasi Tindakan Kelas -->
      <UCard class="border border-gray-200 dark:border-gray-800 shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UIcon
                name="i-lucide-check-circle-2"
                class="w-5 h-5 text-emerald-500"
              />
              Rekomendasi Tindakan Kelas per Mata Pelajaran
            </h3>
            <UBadge
              color="success"
              variant="subtle"
              size="xs"
              class="font-bold"
            >
              {{ analysisData.rekomendasiKelas?.length || 0 }} Rekomendasi
            </UBadge>
          </div>
        </template>

        <div
          v-if="analysisData.rekomendasiKelas?.length"
          class="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden"
        >
          <div
            v-for="(rek, idx) in analysisData.rekomendasiKelas"
            :key="idx"
            class="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div class="w-28 shrink-0">
              <UBadge
                :color="rek.prioritas === 'tinggi' ? 'error' : (rek.prioritas === 'sedang' ? 'warning' : 'success')"
                variant="subtle"
                size="sm"
                class="w-full justify-center font-bold text-center font-mono uppercase"
              >
                {{ rek.prioritas }}
              </UBadge>
            </div>
            <div class="flex-1 space-y-1">
              <div class="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <span>{{ rek.mapel }}</span>
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                {{ rek.tindakan }}
              </p>
            </div>
          </div>
        </div>
        <p
          v-else
          class="text-xs text-gray-500 italic text-center py-4"
        >
          Belum ada rekomendasi khusus.
        </p>
      </UCard>
    </div>
  </div>
</template>
