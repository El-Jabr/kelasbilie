<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAiAnalysisStore } from '~/stores/aiAnalysis'
import { LazyModalConfirm } from '#components'

definePageMeta({
  layout: 'teacher'
})

useSeoMeta({
  title: 'AI Analisis Pembelajaran'
})

interface TeachingDetail {
  id: string
  subject?: { name: string, code: string }
  classroom?: { name: string }
  semester?: { type: string, academicYear?: { name: string }, isActive?: boolean }
}

interface AISubjectAnalysisData {
  efektivitas?: string
  narasi?: string
  komparasiHistoris?: {
    adaData?: boolean
    semesterSebelumnya?: string | null
    rataRataSebelumnya?: number
    rataRataSekarang?: number
    selisih?: number
    catatanTren?: string
  }
  itemBermasalah?: Array<{ nama: string, saran: string }>
  strategiPembelajaran?: Array<{ prioritas: string, saran: string }>
}

const route = useRoute()
const toast = useToast()
const aiStore = useAiAnalysisStore()

const teachingId = route.params.id as string
const forceRefresh = ref(false)

const {
  isAnalyzingSubject: isAnalyzing
} = storeToRefs(aiStore)

const subjectAnalysis = computed(() => aiStore.subjectAnalysisCache[teachingId] || null)
const analysisData = computed<AISubjectAnalysisData | null>(() => subjectAnalysis.value?.data || null)
const isCached = computed(() => subjectAnalysis.value?.cached || false)
const generatedAt = computed(() => subjectAnalysis.value?.generatedAt || '')

const teaching = ref<TeachingDetail | null>(null)

onMounted(async () => {
  try {
    const res = await $fetch<{ data?: TeachingDetail }>(`/api/teaching-assignments/${teachingId}`)
    if (res.data) teaching.value = res.data

    // Auto analyze on load (returns instant 0ms if cached)
    analyzeSubject()
  } catch (err) {
    console.error(err)
  }
})

async function analyzeSubject() {
  if (!teachingId) return

  try {
    await aiStore.analyzeSubject(teachingId, forceRefresh.value)
    forceRefresh.value = false
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
    analyzeSubject()
  }
}

function getEfektivitasColor(efektivitas?: string) {
  if (efektivitas === 'tinggi') return 'emerald'
  if (efektivitas === 'sedang') return 'blue'
  if (efektivitas === 'rendah') return 'rose'
  return 'neutral'
}
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
          AI Analisis Pembelajaran Kelas
        </h1>
        <p
          v-if="teaching"
          class="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5 flex-wrap"
        >
          <span>Mata Pelajaran: <strong class="text-gray-800 dark:text-gray-200">{{ teaching.subject?.name }} ({{ teaching.subject?.code }})</strong> • Kelas: <strong class="text-gray-800 dark:text-gray-200">{{ teaching.classroom?.name }}</strong></span>
          <UBadge
            v-if="teaching.semester"
            :color="teaching.semester.isActive ? 'success' : 'neutral'"
            size="xs"
            variant="subtle"
          >
            {{ teaching.semester.academicYear?.name }} - {{ teaching.semester.type }}
          </UBadge>
        </p>
      </div>
      <div class="w-full md:w-auto">
        <UButton
          color="neutral"
          variant="outline"
          :to="`/teacher/classes/${teachingId}/summary`"
          class="w-full md:w-auto flex justify-center font-semibold cursor-pointer"
        >
          <template #leading>
            <UIcon
              name="i-lucide-arrow-left"
              class="w-4 h-4"
            />
          </template>
          Kembali ke Rekap Nilai
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
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
          AI Sedang Menganalisis Performa Pembelajaran...
        </h3>
        <p class="text-xs text-gray-500">
          Mengevaluasi efektivitas, item tugas bermasalah, dan rekomendasi strategi pedagogi.
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

      <!-- Ringkasan Efektivitas Card -->
      <UCard class="border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
        <div class="flex flex-col md:flex-row gap-6 md:items-center">
          <div class="text-center md:text-left md:border-r md:pr-6 md:border-gray-200 dark:md:border-gray-800 shrink-0">
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wider block">Efektivitas Pembelajaran</span>
            <p
              class="text-3xl font-extrabold uppercase mt-1 font-mono"
              :class="getEfektivitasColor(analysisData.efektivitas) === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : (getEfektivitasColor(analysisData.efektivitas) === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400')"
            >
              {{ analysisData.efektivitas || '-' }}
            </p>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <UIcon
                name="i-lucide-sparkles"
                class="w-4 h-4 text-primary-500"
              />
              <span class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Evaluasi Naratif AI</span>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
              "{{ analysisData.narasi || 'Tidak ada evaluasi naratif dari AI.' }}"
            </p>
          </div>
        </div>
      </UCard>

      <!-- Komparasi Historis Pembelajaran Semester Sebelumnya -->
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
                Komparasi Pembelajaran Semester Sebelumnya ({{ analysisData.komparasiHistoris.semesterSebelumnya }})
              </h3>
            </div>
            <UBadge
              :color="(analysisData.komparasiHistoris.selisih ?? 0) > 0 ? 'success' : ((analysisData.komparasiHistoris.selisih ?? 0) < 0 ? 'error' : 'neutral')"
              variant="subtle"
            >
              <UIcon
                :name="(analysisData.komparasiHistoris.selisih ?? 0) > 0 ? 'i-lucide-trending-up' : ((analysisData.komparasiHistoris.selisih ?? 0) < 0 ? 'i-lucide-trending-down' : 'i-lucide-minus')"
                class="w-3.5 h-3.5 mr-1"
              />
              {{ (analysisData.komparasiHistoris.selisih ?? 0) > 0 ? 'Rata-rata Naik' : ((analysisData.komparasiHistoris.selisih ?? 0) < 0 ? 'Rata-rata Turun' : 'Rata-rata Stabil') }}
            </UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
          <div class="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
            <div class="text-xs text-gray-500 font-medium">
              Rata-rata Nilai Lalu
            </div>
            <div class="text-xl font-bold text-gray-800 dark:text-gray-200 mt-1 font-mono">
              {{ analysisData.komparasiHistoris.rataRataSebelumnya }}
            </div>
          </div>
          <div class="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
            <div class="text-xs text-gray-500 font-medium">
              Rata-rata Nilai Sekarang
            </div>
            <div class="text-xl font-bold text-gray-800 dark:text-gray-200 mt-1 font-mono">
              {{ analysisData.komparasiHistoris.rataRataSekarang }}
            </div>
          </div>
          <div class="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
            <div class="text-xs text-gray-500 font-medium">
              Perubahan Nilai
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

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Item Bermasalah -->
        <UCard class="border border-rose-200/70 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 shadow-sm">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <UIcon
                  name="i-lucide-alert-circle"
                  class="w-5 h-5 text-rose-500"
                />
                Area / Item Perlu Perbaikan
              </h3>
              <UBadge
                color="error"
                variant="subtle"
                size="xs"
                class="font-bold"
              >
                {{ analysisData.itemBermasalah?.length || 0 }} Area
              </UBadge>
            </div>
          </template>

          <div
            v-if="analysisData.itemBermasalah?.length"
            class="space-y-3"
          >
            <div
              v-for="(item, idx) in analysisData.itemBermasalah"
              :key="idx"
              class="p-4 rounded-xl bg-white dark:bg-gray-800 border border-rose-200/80 dark:border-rose-900/50 shadow-xs space-y-1.5"
            >
              <div class="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <UIcon
                  name="i-lucide-file-x-2"
                  class="w-4 h-4 text-rose-500 shrink-0"
                />
                {{ item.nama }}
              </div>
              <div class="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-900 dark:text-rose-200 font-medium">
                <span class="font-bold flex items-center gap-1 mb-0.5">
                  <UIcon
                    name="i-lucide-lightbulb"
                    class="w-3.5 h-3.5 text-rose-600"
                  /> Saran Perbaikan:
                </span>
                {{ item.saran }}
              </div>
            </div>
          </div>
          <p
            v-else
            class="text-xs text-gray-500 italic text-center py-4"
          >
            Tidak ada area kritis yang terdeteksi.
          </p>
        </UCard>

        <!-- Strategi Pembelajaran -->
        <UCard class="border border-gray-200 dark:border-gray-800 shadow-sm">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UIcon
                  name="i-lucide-lightbulb"
                  class="w-5 h-5 text-primary-500"
                />
                Rekomendasi Strategi Pedagogi
              </h3>
              <UBadge
                color="primary"
                variant="subtle"
                size="xs"
                class="font-bold"
              >
                {{ analysisData.strategiPembelajaran?.length || 0 }} Strategi
              </UBadge>
            </div>
          </template>

          <div
            v-if="analysisData.strategiPembelajaran?.length"
            class="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden"
          >
            <div
              v-for="(strat, idx) in analysisData.strategiPembelajaran"
              :key="idx"
              class="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div class="w-24 shrink-0">
                <UBadge
                  :color="strat.prioritas === 'tinggi' ? 'error' : (strat.prioritas === 'sedang' ? 'warning' : 'info')"
                  variant="subtle"
                  size="sm"
                  class="w-full justify-center font-bold text-center font-mono uppercase"
                >
                  {{ strat.prioritas }}
                </UBadge>
              </div>
              <div class="flex-1">
                <p class="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {{ strat.saran }}
                </p>
              </div>
            </div>
          </div>
          <p
            v-else
            class="text-xs text-gray-500 italic text-center py-4"
          >
            Belum ada saran strategi.
          </p>
        </UCard>
      </div>
    </div>
  </div>
</template>
