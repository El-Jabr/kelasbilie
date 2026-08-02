<script setup lang="ts">
definePageMeta({
  layout: 'teacher'
})

useSeoMeta({
  title: 'AI Analisis Pembelajaran'
})

const route = useRoute()
const toast = useToast()

const teachingId = route.params.id as string
const forceRefresh = ref(false)

const isAnalyzing = ref(false)
const analysisData = ref<any>(null)
const isCached = ref(false)
const generatedAt = ref('')

const teaching = ref<any>(null)

onMounted(async () => {
  try {
    const res: any = await $fetch(`/api/teaching-assignments/${teachingId}`)
    if (res.data) teaching.value = res.data
    
    // Auto analyze on load
    analyzeSubject()
  } catch (err) {
    console.error(err)
  }
})

async function analyzeSubject() {
  if (!teachingId) return

  isAnalyzing.value = true
  
  try {
    const res: any = await $fetch('/api/ai/analyze-subject', {
      method: 'POST',
      body: {
        teachingId,
        forceRefresh: forceRefresh.value
      }
    })
    
    analysisData.value = res.data
    isCached.value = res.cached
    generatedAt.value = new Date(res.generatedAt).toLocaleString('id-ID')
    forceRefresh.value = false
    
  } catch (error: any) {
    toast.add({ 
      title: 'Analisis Gagal', 
      description: error.data?.statusMessage || 'Terjadi kesalahan saat memanggil AI.', 
      color: 'error' 
    })
  } finally {
    isAnalyzing.value = false
  }
}

import { LazyModalConfirm } from '#components'

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

function getEfektivitasColor(efektivitas: string) {
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
          <UIcon name="i-lucide-brain-circuit" class="w-8 h-8 text-primary-500" />
          AI Analisis Pembelajaran Kelas
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1" v-if="teaching">
          Mata Pelajaran: <strong class="text-gray-800 dark:text-gray-200">{{ teaching.subject?.name }} ({{ teaching.subject?.code }})</strong> • Kelas: <strong class="text-gray-800 dark:text-gray-200">{{ teaching.classroom?.name }}</strong>
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
            <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
          </template>
          Kembali ke Rekap Nilai
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isAnalyzing && !analysisData" class="py-16 text-center space-y-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary-500 mx-auto" />
      <div class="space-y-1">
        <h3 class="font-bold text-gray-900 dark:text-white">AI Sedang Menganalisis Performa Pembelajaran...</h3>
        <p class="text-xs text-gray-500">Mengevaluasi efektivitas, item tugas bermasalah, dan rekomendasi strategi pedagogi.</p>
      </div>
    </div>

    <!-- Hasil Analisis -->
    <div v-else-if="analysisData" class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <!-- Metadata Cache Banner -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/60 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <UIcon :name="isCached ? 'i-lucide-history' : 'i-lucide-zap'" :class="['w-4 h-4', isCached ? 'text-blue-500' : 'text-emerald-500']" />
          <span>Status AI: <strong>{{ isCached ? 'Data dari Cache' : 'Generasi Baru' }}</strong></span>
          <span class="text-gray-400">•</span>
          <span>Waktu Diperbarui: {{ generatedAt }}</span>
        </div>
        <UButton size="xs" color="neutral" variant="outline" :loading="isAnalyzing" class="w-full sm:w-auto justify-center font-semibold cursor-pointer" @click="handleForceRefresh">
          <template #leading>
            <UIcon name="i-lucide-refresh-cw" class="w-3.5 h-3.5" />
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
              <UIcon name="i-lucide-sparkles" class="w-4 h-4 text-primary-500" />
              <span class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Evaluasi Naratif AI</span>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
              "{{ analysisData.narasi || 'Tidak ada evaluasi naratif dari AI.' }}"
            </p>
          </div>
        </div>
      </UCard>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Item Bermasalah -->
        <UCard class="border border-rose-200/70 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 shadow-sm">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-rose-500" />
                Area / Item Perlu Perbaikan
              </h3>
              <UBadge color="error" variant="subtle" size="xs" class="font-bold">
                {{ analysisData.itemBermasalah?.length || 0 }} Area
              </UBadge>
            </div>
          </template>

          <div v-if="analysisData.itemBermasalah?.length" class="space-y-3">
            <div
              v-for="(item, idx) in analysisData.itemBermasalah"
              :key="idx"
              class="p-4 rounded-xl bg-white dark:bg-gray-800 border border-rose-200/80 dark:border-rose-900/50 shadow-xs space-y-1.5"
            >
              <div class="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                <UIcon name="i-lucide-file-x-2" class="w-4 h-4 text-rose-500 shrink-0" />
                {{ item.nama }}
              </div>
              <div class="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-900 dark:text-rose-200 font-medium">
                <span class="font-bold flex items-center gap-1 mb-0.5">
                  <UIcon name="i-lucide-lightbulb" class="w-3.5 h-3.5 text-rose-600" /> Saran Perbaikan:
                </span>
                {{ item.saran }}
              </div>
            </div>
          </div>
          <p v-else class="text-xs text-gray-500 italic text-center py-4">Tidak ada area kritis yang terdeteksi.</p>
        </UCard>
        
        <!-- Strategi Pembelajaran -->
        <UCard class="border border-gray-200 dark:border-gray-800 shadow-sm">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UIcon name="i-lucide-lightbulb" class="w-5 h-5 text-primary-500" />
                Rekomendasi Strategi Pedagogi
              </h3>
              <UBadge color="primary" variant="subtle" size="xs" class="font-bold">
                {{ analysisData.strategiPembelajaran?.length || 0 }} Strategi
              </UBadge>
            </div>
          </template>

          <div v-if="analysisData.strategiPembelajaran?.length" class="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
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
                <p class="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">{{ strat.saran }}</p>
              </div>
            </div>
          </div>
          <p v-else class="text-xs text-gray-500 italic text-center py-4">Belum ada saran strategi.</p>
        </UCard>
      </div>

    </div>
  </div>
</template>
