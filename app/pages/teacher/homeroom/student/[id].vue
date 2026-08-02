<script setup lang="ts">
definePageMeta({
  layout: 'teacher',
  middleware: ['auth', 'role'],
  role: ['TEACHER', 'ADMIN']
})

useSeoMeta({
  title: 'AI Analisis Siswa - Wali Kelas'
})

const route = useRoute()
const toast = useToast()

const studentId = route.params.id as string
const forceRefresh = ref(false)

const isAnalyzing = ref(false)
const analysisData = ref<any>(null)
const isCached = ref(false)
const generatedAt = ref('')

const student = ref<any>(null)

onMounted(async () => {
  try {
    // Ambil data siswa
    const res: any = await $fetch(`/api/students/${studentId}`)
    if (res.data) student.value = res.data

    // Otomatis analisa siswa ketika halaman dimuat
    analyzeStudent()
  } catch (err) {
    console.error(err)
  }
})

async function analyzeStudent() {
  if (!studentId) return

  isAnalyzing.value = true
  analysisData.value = null
  
  try {
    const res: any = await $fetch('/api/ai/analyze-student', {
      method: 'POST',
      body: {
        studentId,
        forceRefresh: forceRefresh.value
      }
    })
    
    analysisData.value = res.data
    isCached.value = res.cached
    generatedAt.value = new Date(res.generatedAt).toLocaleString('id-ID')
    forceRefresh.value = false
    
    toast.add({ title: 'Analisis Berhasil', color: 'success' })
  } catch (error: any) {
    toast.add({ 
      title: 'Analisis Gagal', 
      description: error.data?.statusMessage || error.data?.message || 'Terjadi kesalahan saat memanggil AI.', 
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
    message: 'Anda yakin ingin memuat ulang analisis dari AI? Ini mungkin akan memakan waktu proses tambahan.',
    confirmText: 'Ya, Refresh',
    color: 'warning'
  })
  if (confirmed) {
    forceRefresh.value = true
    analyzeStudent()
  }
}

function getStatusColor(status: string) {
  if (status === 'baik') return 'emerald'
  if (status === 'perlu_perhatian') return 'amber'
  if (status === 'kritis') return 'rose'
  return 'neutral'
}

function getTrenColor(tren: string) {
  if (tren === 'meningkat') return 'emerald'
  if (tren === 'stabil') return 'blue'
  if (tren === 'menurun') return 'rose'
  return 'neutral'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Page Banner -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight flex items-center gap-2 text-gray-900 dark:text-white">
          <UIcon name="i-lucide-user-check" class="w-8 h-8 text-primary-500" />
          AI Analisis Siswa (Wali Kelas)
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1" v-if="student">
          Siswa: <strong class="text-gray-800 dark:text-gray-200">{{ student.user?.fullname }}</strong> (NIS: <span class="font-mono font-bold">{{ student.nis }}</span>)
        </p>
      </div>
      <div class="w-full md:w-auto">
        <UButton
          to="/teacher/homeroom"
          color="neutral"
          variant="outline"
          class="w-full md:w-auto flex justify-center font-semibold cursor-pointer"
        >
          <template #leading>
            <UIcon name="i-lucide-arrow-left" class="w-4 h-4" />
          </template>
          Kembali ke Wali Kelas
        </UButton>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isAnalyzing && !analysisData" class="py-16 text-center space-y-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary-500 mx-auto" />
      <div class="space-y-1">
        <h3 class="font-bold text-gray-900 dark:text-white">AI Sedang Menganalisis Data Siswa...</h3>
        <p class="text-xs text-gray-500">Mengevaluasi tren nilai, kekuatan, kelemahan, dan menyusun rekomendasi wali kelas.</p>
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

      <!-- Ringkasan Status & Tren Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Status Umum Card -->
        <UCard class="border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Status Akademik Umum</span>
              <p class="text-3xl font-extrabold uppercase mt-1 font-mono" :class="getStatusColor(analysisData.statusUmum) === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : (getStatusColor(analysisData.statusUmum) === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400')">
                {{ (analysisData.statusUmum || '').replace('_', ' ') }}
              </p>
            </div>
            <div class="p-3 rounded-2xl" :class="getStatusColor(analysisData.statusUmum) === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : (getStatusColor(analysisData.statusUmum) === 'amber' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400')">
              <UIcon name="i-lucide-activity" class="w-8 h-8" />
            </div>
          </div>
        </UCard>

        <!-- Tren Card -->
        <UCard class="border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
          <div class="flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Tren Nilai Semester Ini</span>
              <p class="text-3xl font-extrabold uppercase mt-1 font-mono" :class="getTrenColor(analysisData.tren) === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : (getTrenColor(analysisData.tren) === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400')">
                {{ analysisData.tren || '-' }}
              </p>
            </div>
            <div class="p-3 rounded-2xl" :class="getTrenColor(analysisData.tren) === 'emerald' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' : (getTrenColor(analysisData.tren) === 'blue' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400')">
              <UIcon :name="analysisData.tren === 'meningkat' ? 'i-lucide-trending-up' : (analysisData.tren === 'menurun' ? 'i-lucide-trending-down' : 'i-lucide-minus')" class="w-8 h-8" />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Evaluasi Siswa / Narasi AI -->
      <UCard class="border border-primary-200/70 dark:border-primary-900/60 bg-white dark:bg-gray-800 shadow-sm">
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-sparkles" class="w-5 h-5 text-primary-500" />
            <h3 class="text-base font-bold text-gray-900 dark:text-white">
              Evaluasi & Narasi Kualitatif AI Siswa
            </h3>
          </div>
        </template>
        <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed font-sans">
          {{ analysisData.narasi || 'Tidak ada narasi evaluasi.' }}
        </p>
      </UCard>

      <!-- Kekuatan & Area Pengembangan -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Card Kekuatan -->
        <UCard class="border border-emerald-200/70 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-sm">
          <template #header>
            <div class="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
              <UIcon name="i-lucide-thumbs-up" class="w-5 h-5 text-emerald-500" />
              <h3 class="text-base font-bold">Kekuatan & Keunggulan Akademik</h3>
            </div>
          </template>
          <div v-if="analysisData.kekuatan?.length" class="space-y-2.5">
            <div v-for="(k, idx) in analysisData.kekuatan" :key="idx" class="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
              <UIcon name="i-lucide-check-circle-2" class="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span class="leading-relaxed">{{ k }}</span>
            </div>
          </div>
          <p v-else class="text-xs text-gray-500 italic">Belum ada catatan kekuatan terdeteksi.</p>
        </UCard>

        <!-- Card Area Pengembangan -->
        <UCard class="border border-rose-200/70 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/10 shadow-sm">
          <template #header>
            <div class="flex items-center gap-2 text-rose-700 dark:text-rose-300">
              <UIcon name="i-lucide-alert-circle" class="w-5 h-5 text-rose-500" />
              <h3 class="text-base font-bold">Area Pengembangan (Kelemahan)</h3>
            </div>
          </template>
          <div v-if="analysisData.kelemahan?.length" class="space-y-2.5">
            <div v-for="(k, idx) in analysisData.kelemahan" :key="idx" class="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
              <UIcon name="i-lucide-x-circle" class="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span class="leading-relaxed">{{ k }}</span>
            </div>
          </div>
          <p v-else class="text-xs text-gray-500 italic">Tidak ada area kelemahan kritis yang terdeteksi.</p>
        </UCard>
      </div>

      <!-- Rekomendasi Tindakan -->
      <UCard class="border border-gray-200 dark:border-gray-800 shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UIcon name="i-lucide-target" class="w-5 h-5 text-primary-500" />
              Rekomendasi Tindakan Wali Kelas
            </h3>
            <UBadge color="primary" variant="subtle" size="xs" class="font-bold">
              {{ analysisData.rekomendasi?.length || 0 }} Rekomendasi
            </UBadge>
          </div>
        </template>

        <div v-if="analysisData.rekomendasi?.length" class="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
          <div
            v-for="(rek, idx) in analysisData.rekomendasi"
            :key="idx"
            class="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div class="w-36 shrink-0">
              <UBadge
                color="primary"
                variant="subtle"
                size="sm"
                class="w-full justify-center font-bold text-center font-mono uppercase"
              >
                {{ rek.tipe.toUpperCase().replace('ORANG_TUA', 'MUROBBI').replace('ORANG TUA', 'MUROBBI') }}
              </UBadge>
            </div>
            <div class="flex-1 space-y-1">
              <div v-if="rek.mapel" class="font-bold text-gray-900 dark:text-white text-sm">
                {{ rek.mapel }}
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{{ rek.tindakan }}</p>
            </div>
          </div>
        </div>
        <p v-else class="text-xs text-gray-500 italic text-center py-4">Belum ada rekomendasi tindakan.</p>
      </UCard>

    </div>
  </div>
</template>
