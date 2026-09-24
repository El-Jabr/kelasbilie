<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAiAnalysisStore } from '~/stores/aiAnalysis'
import { LazyModalConfirm } from '#components'

definePageMeta({
  layout: 'teacher',
  middleware: ['auth', 'role'],
  role: ['TEACHER', 'ADMIN']
})

useSeoMeta({
  title: 'AI Analisis Kelas - Wali Kelas'
})

const toast = useToast()
const forceRefresh = ref(false)

const aiStore = useAiAnalysisStore()
const homeroomStore = useTeacherHomeroomStore()
const { homeroom, selectedSemesterId, semesterOptions } = storeToRefs(homeroomStore)

const { isAnalyzingClass: isAnalyzing } = storeToRefs(aiStore)

const classAnalysis = computed(() => {
  const cid = homeroom.value?.classroomId
  if (!cid) return null
  const semKey = selectedSemesterId.value === 'ACTIVE' ? 'active' : selectedSemesterId.value
  return aiStore.classAnalysisCache[`${cid}__${semKey}`] || null
})

interface AIClassAnalysisData {
  ringkasan?: {
    rataRataKelas?: number
    jumlahLulus?: number
    jumlahRemidi?: number
    mapelTerlemah?: string
    mapelTerkuat?: string
  }
  komparasiHistoris?: {
    adaData?: boolean
    semesterSebelumnya?: string | null
    rataRataSebelumnya?: number
    rataRataSekarang?: number
    selisih?: number
    statusPerubahan?: string
    catatanTren?: string
  }
  narasi?: string
  siswaPerhatianKhusus?: Array<{ nama: string, alasan: string, saran: string }>
  rekomendasiKelas?: Array<{ prioritas: string, tindakan: string, mapel: string }>
}

const analysisData = computed<AIClassAnalysisData | null>(() => classAnalysis.value?.data ?? null)
const isCached = computed(() => classAnalysis.value?.cached || false)
const generatedAt = computed(() => classAnalysis.value?.generatedAt || '')

onMounted(async () => {
  try {
    await homeroomStore.fetchSemesters()
    if (!homeroomStore.isLoaded) {
      await homeroomStore.fetchHomeroom()
    }
    if (homeroom.value?.classroomId) {
      analyzeClass()
    }
  } catch (err) {
    console.error(err)
  }
})

watch(selectedSemesterId, async () => {
  await homeroomStore.fetchHomeroom(true)
  if (homeroom.value?.classroomId) {
    analyzeClass()
  }
})

async function analyzeClass() {
  if (!homeroom.value?.classroomId) return

  const targetSemester = selectedSemesterId.value !== 'ACTIVE' ? selectedSemesterId.value : undefined
  try {
    await aiStore.analyzeClass(homeroom.value.classroomId, targetSemester, forceRefresh.value)
    forceRefresh.value = false
    toast.add({ title: 'Analisis Berhasil', color: 'success' })
  } catch (error: unknown) {
    const err = error as { data?: { statusMessage?: string } }
    toast.add({
      title: 'Analisis Gagal',
      description: err.data?.statusMessage || 'Terjadi kesalahan saat memanggil AI.',
      color: 'error'
    })
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
          AI Analisis Performa Kelas (Wali Kelas)
        </h1>
        <p
          v-if="homeroom"
          class="text-sm text-gray-500 dark:text-gray-400 mt-1"
        >
          Kelas Binaan: <strong class="text-gray-800 dark:text-gray-200">{{ homeroom.classroom?.name }}</strong> • Laporan cerdas performa akademik & rekomendasi AI.
        </p>
      </div>
      <div class="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
        <USelect
          v-model="selectedSemesterId"
          :items="semesterOptions"
          label-key="label"
          value-key="value"
          class="w-full sm:w-60"
        />
        <UButton
          to="/teacher/homeroom"
          color="neutral"
          variant="outline"
          class="w-full sm:w-auto flex justify-center font-semibold cursor-pointer shrink-0"
        >
          <template #leading>
            <UIcon
              name="i-lucide-arrow-left"
              class="w-4 h-4"
            />
          </template>
          Kembali ke Rekap
        </UButton>
      </div>
    </div>

    <!-- Empty / Loading State -->
    <div
      v-if="isAnalyzing && !analysisData"
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
          Mengevaluasi seluruh nilai siswa, mengidentifikasi siswa berisiko, dan menyusun strategi kelas.
        </p>
      </div>
    </div>

    <!-- Hasil Analisis -->
    <div
      v-else-if="analysisData"
      class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <!-- Metadata Cache Banner -->
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

      <!-- Ringkasan Statistik Kelas Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Card 1: Rata-Rata Nilai Kelas -->
        <UCard class="border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rata-Rata Nilai Kelas</span>
            <div class="p-2 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400">
              <UIcon
                name="i-lucide-award"
                class="w-5 h-5"
              />
            </div>
          </div>
          <div class="mt-2">
            <div class="text-3xl font-extrabold text-gray-900 dark:text-white font-mono">
              {{ analysisData.ringkasan?.rataRataKelas || 0 }}
            </div>
            <div class="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden mt-3">
              <div
                class="h-full rounded-full transition-all duration-1000"
                :class="(analysisData.ringkasan?.rataRataKelas || 0) >= 75 ? 'bg-emerald-500' : 'bg-amber-500'"
                :style="{ width: `${Math.min(analysisData.ringkasan?.rataRataKelas || 0, 100)}%` }"
              />
            </div>
          </div>
        </UCard>

        <!-- Card 2: Grafik Proporsi Kelulusan -->
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

      <!-- Komparasi Historis Kelas dengan Semester Sebelumnya -->
      <UCard
        v-if="analysisData.komparasiHistoris?.adaData"
        class="border border-indigo-200/70 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/40 to-sky-50/40 dark:from-indigo-950/20 dark:to-sky-950/20 shadow-sm"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-history"
                class="w-5 h-5 text-indigo-500"
              />
              <h3 class="text-base font-bold text-gray-900 dark:text-white">
                Komparasi Agregat Semester Sebelumnya ({{ analysisData.komparasiHistoris.semesterSebelumnya }})
              </h3>
            </div>
            <UBadge
              :color="analysisData.komparasiHistoris.statusPerubahan === 'meningkat' ? 'success' : (analysisData.komparasiHistoris.statusPerubahan === 'menurun' ? 'error' : 'neutral')"
              variant="subtle"
            >
              <UIcon
                :name="analysisData.komparasiHistoris.statusPerubahan === 'meningkat' ? 'i-lucide-trending-up' : (analysisData.komparasiHistoris.statusPerubahan === 'menurun' ? 'i-lucide-trending-down' : 'i-lucide-minus')"
                class="w-3.5 h-3.5 mr-1"
              />
              {{ analysisData.komparasiHistoris.statusPerubahan === 'meningkat' ? 'Tren Kelas Meningkat' : (analysisData.komparasiHistoris.statusPerubahan === 'menurun' ? 'Tren Kelas Menurun' : 'Tren Kelas Stabil') }}
            </UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
          <div class="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
            <div class="text-xs text-gray-500 font-medium">
              Rata-rata Kelas Semester Lalu
            </div>
            <div class="text-xl font-bold text-gray-800 dark:text-gray-200 mt-1 font-mono">
              {{ analysisData.komparasiHistoris.rataRataSebelumnya }}
            </div>
          </div>
          <div class="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
            <div class="text-xs text-gray-500 font-medium">
              Rata-rata Kelas Semester Ini
            </div>
            <div class="text-xl font-bold text-gray-800 dark:text-gray-200 mt-1 font-mono">
              {{ analysisData.komparasiHistoris.rataRataSekarang }}
            </div>
          </div>
          <div class="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
            <div class="text-xs text-gray-500 font-medium">
              Selisih Perkembangan Kelas
            </div>
            <div
              class="text-xl font-bold mt-1 font-mono"
              :class="(analysisData.komparasiHistoris.selisih ?? 0) > 0 ? 'text-emerald-600 dark:text-emerald-400' : ((analysisData.komparasiHistoris.selisih ?? 0) < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-gray-600 dark:text-gray-300')"
            >
              {{ (analysisData.komparasiHistoris.selisih ?? 0) > 0 ? '+' : '' }}{{ analysisData.komparasiHistoris.selisih }}
            </div>
          </div>
        </div>

        <p class="text-xs text-gray-600 dark:text-gray-300 italic">
          💡 {{ analysisData.komparasiHistoris.catatanTren }}
        </p>
      </UCard>

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
