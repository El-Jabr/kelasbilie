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
  if (efektivitas === 'tinggi') return 'green'
  if (efektivitas === 'sedang') return 'blue'
  if (efektivitas === 'rendah') return 'red'
  return 'gray'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UIcon name="i-lucide-brain-circuit" class="text-primary-500" />
          AI Analisis Pembelajaran
        </h1>
        <p class="text-sm text-gray-500" v-if="teaching">
          Mata Pelajaran: {{ teaching.subject.name }} | Kelas: {{ teaching.classroom.name }}
        </p>
      </div>
      <div>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-arrow-left"
          :to="`/teacher/classes/${teachingId}`"
        >
          Kembali ke Detail Kelas
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <UCard v-if="isAnalyzing && !analysisData">
      <div class="py-12 flex flex-col items-center justify-center space-y-4">
        <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
        <p class="text-gray-500 text-sm">AI sedang menganalisis data nilai siswa kelas ini...</p>
      </div>
    </UCard>

    <!-- Hasil Analisis -->
    <div v-else-if="analysisData" class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <UIcon :name="isCached ? 'i-lucide-history' : 'i-lucide-zap'" :class="isCached ? 'text-blue-500' : 'text-green-500'" />
          <span>{{ isCached ? 'Data dari cache.' : 'Dihasilkan oleh AI langsung.' }}</span>
          <span>Diperbarui: {{ generatedAt }}</span>
        </div>
        <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-refresh-cw" :loading="isAnalyzing" @click="handleForceRefresh">
          Force Refresh
        </UButton>
      </div>

      <!-- Ringkasan Status -->
      <UCard :class="`bg-${getEfektivitasColor(analysisData.efektivitas)}-50 dark:bg-${getEfektivitasColor(analysisData.efektivitas)}-950/20 ring-1 ring-${getEfektivitasColor(analysisData.efektivitas)}-200`">
        <div class="flex flex-col md:flex-row gap-6 md:items-center">
          <div class="text-center md:text-left md:border-r md:pr-6 md:border-gray-200 dark:md:border-gray-800">
            <p class="text-sm text-gray-600 dark:text-gray-400">Tingkat Efektivitas Pembelajaran</p>
            <p :class="`text-3xl font-bold uppercase mt-2 text-${getEfektivitasColor(analysisData.efektivitas)}-700`">
              {{ analysisData.efektivitas || '-' }}
            </p>
          </div>
          <div class="flex-1">
            <p class="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
              "{{ analysisData.narasi || 'Tidak ada evaluasi naratif dari AI.' }}"
            </p>
          </div>
        </div>
      </UCard>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Item Bermasalah -->
        <UCard>
          <h3 class="text-lg font-semibold flex items-center gap-2 mb-4 text-red-600">
            <UIcon name="i-lucide-alert-circle" />
            Area yang Perlu Perbaikan
          </h3>
          <div class="space-y-4">
            <div v-if="analysisData.itemBermasalah?.length">
              <div v-for="(item, idx) in analysisData.itemBermasalah" :key="idx" class="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 mb-3">
                <div class="font-bold text-red-800 dark:text-red-400 mb-1">{{ item.nama }}</div>
                <p class="text-sm text-gray-700 dark:text-gray-300"><strong>Saran Perbaikan:</strong> {{ item.saran }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500 italic">Tidak ada area kritis yang terdeteksi.</p>
          </div>
        </UCard>
        
        <!-- Strategi Pembelajaran -->
        <UCard>
          <h3 class="text-lg font-semibold flex items-center gap-2 mb-4 text-primary-600">
            <UIcon name="i-lucide-lightbulb" />
            Rekomendasi Strategi Pedagogi
          </h3>
          <div class="space-y-3">
            <div v-for="(strat, idx) in analysisData.strategiPembelajaran" :key="idx" class="flex gap-4 items-start p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors border border-gray-100 dark:border-gray-800">
              <UBadge :color="strat.prioritas === 'tinggi' ? 'error' : 'info'" variant="subtle">
                {{ strat.prioritas.toUpperCase() }}
              </UBadge>
              <div>
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ strat.saran }}</p>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
