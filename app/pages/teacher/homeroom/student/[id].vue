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
  if (status === 'baik') return 'green'
  if (status === 'perlu_perhatian') return 'orange'
  if (status === 'kritis') return 'red'
  return 'gray'
}
function getTrenColor(tren: string) {
  if (tren === 'meningkat') return 'green'
  if (tren === 'stabil') return 'blue'
  if (tren === 'menurun') return 'red'
  return 'gray'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <UButton
          to="/teacher/homeroom"
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          class="hidden sm:inline-flex"
        />
        <div>
          <h1 class="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UIcon name="i-lucide-bot" class="hidden sm:inline-block text-primary-500" />
            AI Analisis Siswa
          </h1>
          <p class="text-sm text-gray-500 mt-1" v-if="student">
            Siswa: <strong>{{ student.user?.fullname }}</strong> ({{ student.nis }})
          </p>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isAnalyzing && !analysisData" class="py-16 text-center space-y-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500 mx-auto" />
      <p class="text-sm font-medium text-gray-600 dark:text-gray-300">AI sedang menganalisis data akademik siswa...</p>
    </div>

    <!-- Hasil Analisis -->
    <div v-if="analysisData" class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <UIcon :name="isCached ? 'i-lucide-history' : 'i-lucide-zap'" :class="['hidden sm:inline-block', isCached ? 'text-blue-500' : 'text-green-500']" />
          <span>{{ isCached ? 'Data dari cache.' : 'Dihasilkan oleh AI langsung.' }}</span>
          <span>Diperbarui: {{ generatedAt }}</span>
        </div>
        <UButton size="xs" color="neutral" variant="ghost" :loading="isAnalyzing" class="w-full sm:w-auto justify-center" @click="handleForceRefresh">
          <template #leading>
            <UIcon name="i-lucide-refresh-cw" class="hidden sm:inline-block" />
          </template>
          Force Refresh
        </UButton>
      </div>

      <!-- Ringkasan Status -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UCard :class="`bg-${getStatusColor(analysisData.statusUmum)}-50 dark:bg-${getStatusColor(analysisData.statusUmum)}-950/20 ring-1 ring-${getStatusColor(analysisData.statusUmum)}-200`">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Status Umum Akademik</p>
              <p :class="`text-2xl font-bold uppercase mt-1 text-${getStatusColor(analysisData.statusUmum)}-700`">
                {{ (analysisData.statusUmum || '').replace('_', ' ') }}
              </p>
            </div>
            <UIcon name="i-lucide-activity" class="hidden sm:block w-12 h-12 opacity-50" :class="`text-${getStatusColor(analysisData.statusUmum)}-500`" />
          </div>
        </UCard>
        
        <UCard :class="`bg-${getTrenColor(analysisData.tren)}-50 dark:bg-${getTrenColor(analysisData.tren)}-950/20 ring-1 ring-${getTrenColor(analysisData.tren)}-200`">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Tren Nilai Semester Ini</p>
              <p :class="`text-2xl font-bold uppercase mt-1 text-${getTrenColor(analysisData.tren)}-700`">
                {{ analysisData.tren || '-' }}
              </p>
            </div>
            <UIcon :name="analysisData.tren === 'meningkat' ? 'i-lucide-trending-up' : (analysisData.tren === 'menurun' ? 'i-lucide-trending-down' : 'i-lucide-minus')" class="hidden sm:block w-12 h-12 opacity-50" :class="`text-${getTrenColor(analysisData.tren)}-500`" />
          </div>
        </UCard>
      </div>

      <!-- Narasi -->
      <UCard>
        <h3 class="text-lg font-semibold flex items-center gap-2 mb-3">
          <UIcon name="i-lucide-user" class="hidden sm:inline-block text-primary-500" />
          Evaluasi Siswa
        </h3>
        <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
          {{ analysisData.narasi || 'Tidak ada narasi.' }}
        </p>
      </UCard>

      <!-- Kekuatan & Kelemahan -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UCard>
          <h3 class="text-lg font-semibold flex items-center gap-2 mb-4 text-green-600">
            <UIcon name="i-lucide-thumbs-up" class="hidden sm:inline-block" />
            Kekuatan
          </h3>
          <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li v-for="(k, idx) in analysisData.kekuatan" :key="idx">{{ k }}</li>
          </ul>
        </UCard>
        
        <UCard>
          <h3 class="text-lg font-semibold flex items-center gap-2 mb-4 text-red-600">
            <UIcon name="i-lucide-thumbs-down" class="hidden sm:inline-block" />
            Area Pengembangan (Kelemahan)
          </h3>
          <ul class="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li v-for="(k, idx) in analysisData.kelemahan" :key="idx">{{ k }}</li>
          </ul>
        </UCard>
      </div>

      <!-- Rekomendasi Tindakan -->
      <UCard>
        <h3 class="text-lg font-semibold flex items-center gap-2 mb-4 text-primary-600">
          <UIcon name="i-lucide-target" class="hidden sm:inline-block" />
          Rekomendasi Tindakan Wali Kelas
        </h3>
        <div class="space-y-3">
          <div v-for="(rek, idx) in analysisData.rekomendasi" :key="idx" class="flex gap-4 items-start p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors border border-gray-100 dark:border-gray-800">
            <UBadge color="primary" variant="subtle">
              {{ rek.tipe.toUpperCase().replace('ORANG_TUA', 'WALI/MUROBBI').replace('ORANG TUA', 'WALI/MUROBBI') }}
            </UBadge>
            <div>
              <div class="font-medium text-gray-900 dark:text-gray-100">{{ rek.mapel }}</div>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ rek.tindakan }}</p>
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
