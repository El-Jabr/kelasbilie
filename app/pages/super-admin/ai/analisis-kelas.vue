<script setup lang="ts">
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
const analysisData = ref<any>(null)
const isCached = ref(false)
const generatedAt = ref('')

const { data: filterData } = await useAsyncData('kelas-filters', async () => {
  const [classRes, semRes] = await Promise.all([
    $fetch<any>('/api/classes?limit=1000'),
    $fetch<any>('/api/semesters?limit=1000')
  ])
  return {
    classes: classRes.data || [],
    semesters: semRes.data || []
  }
})

const classrooms = computed(() => filterData.value?.classes || [])
const semesters = computed(() => filterData.value?.semesters || [])

const classroomOptions = computed(() => classrooms.value.map((c: any) => ({ label: c.name, value: c.id })))
const semesterOptions = computed(() => semesters.value.map((s: any) => ({ label: `${s.type} ${s.academicYear.name}${s.isActive ? ' (Aktif)' : ''}`, value: s.id })))

// Auto select active semester
watchEffect(() => {
  if (semesters.value.length && !selectedSemester.value) {
    const activeSem = semesters.value.find((s: any) => s.isActive)
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
    const res: any = await $fetch('/api/ai/analyze-class', {
      method: 'POST',
      body: {
        classroomId: selectedClassroom.value,
        semesterId: selectedSemester.value || undefined,
        forceRefresh: forceRefresh.value
      }
    })
    
    analysisData.value = res.data
    isCached.value = res.cached
    generatedAt.value = new Date(res.generatedAt).toLocaleString('id-ID')
    forceRefresh.value = false // reset flag
    
    toast.add({ title: 'Analisis Berhasil', color: 'success' })
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
    analyzeClass()
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UIcon name="i-lucide-brain-circuit" class="text-primary-500" />
          AI Analisis Kelas
        </h1>
        <p class="text-sm text-gray-500">Analisis otomatis performa akademik kelas menggunakan Google Gemini.</p>
      </div>
    </div>

    <!-- Filter Card -->
    <UCard>
      <div class="flex flex-col md:flex-row gap-4 items-end">
        <div class="flex-1">
          <label class="block text-sm font-medium mb-1">Pilih Kelas</label>
          <USelect
            v-model="selectedClassroom"
            :items="classroomOptions"
            label-key="label"
            value-key="value"
            placeholder="-- Pilih Kelas --"
            class="w-full"
          />
        </div>
        <div class="flex-1">
          <label class="block text-sm font-medium mb-1">Pilih Semester</label>
          <USelect
            v-model="selectedSemester"
            :items="semesterOptions"
            label-key="label"
            value-key="value"
            placeholder="-- Pilih Semester --"
            class="w-full"
          />
        </div>
        <div>
          <UButton
            color="primary"
            icon="i-lucide-sparkles"
            :loading="isAnalyzing"
            :disabled="!selectedClassroom"
            @click="analyzeClass"
          >
            Analisis Sekarang
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Hasil Analisis -->
    <div v-if="analysisData" class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-sm text-gray-500">
          <UIcon :name="isCached ? 'i-lucide-history' : 'i-lucide-zap'" :class="isCached ? 'text-blue-500' : 'text-green-500'" />
          <span>{{ isCached ? 'Menampilkan data cache.' : 'Dihasilkan oleh AI langsung.' }}</span>
          <span>Diperbarui: {{ generatedAt }}</span>
        </div>
        <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-refresh-cw" @click="handleForceRefresh">
          Force Refresh
        </UButton>
      </div>

      <!-- Ringkasan Statistik -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <UCard class="bg-primary-50 dark:bg-primary-950/20 ring-1 ring-primary-200 dark:ring-primary-900">
          <div class="text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400">Rata-rata Kelas</p>
            <p class="text-3xl font-bold text-primary-600 mt-1">{{ analysisData.ringkasan?.rataRataKelas || 0 }}</p>
          </div>
        </UCard>
        <UCard class="bg-green-50 dark:bg-green-950/20 ring-1 ring-green-200 dark:ring-green-900">
          <div class="text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400">Jumlah Lulus</p>
            <p class="text-3xl font-bold text-green-600 mt-1">{{ analysisData.ringkasan?.jumlahLulus || 0 }}</p>
          </div>
        </UCard>
        <UCard class="bg-red-50 dark:bg-red-950/20 ring-1 ring-red-200 dark:ring-red-900">
          <div class="text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400">Jumlah Remidi</p>
            <p class="text-3xl font-bold text-red-600 mt-1">{{ analysisData.ringkasan?.jumlahRemidi || 0 }}</p>
          </div>
        </UCard>
        <UCard class="bg-blue-50 dark:bg-blue-950/20 ring-1 ring-blue-200 dark:ring-blue-900">
          <div class="text-center">
            <p class="text-sm text-gray-600 dark:text-gray-400">Mapel Terkuat / Terlemah</p>
            <p class="text-sm font-semibold text-blue-700 mt-1 truncate">▲ {{ analysisData.ringkasan?.mapelTerkuat || '-' }}</p>
            <p class="text-sm font-semibold text-red-700 truncate">▼ {{ analysisData.ringkasan?.mapelTerlemah || '-' }}</p>
          </div>
        </UCard>
      </div>

      <!-- Narasi -->
      <UCard>
        <h3 class="text-lg font-semibold flex items-center gap-2 mb-3">
          <UIcon name="i-lucide-file-text" class="text-primary-500" />
          Evaluasi Umum
        </h3>
        <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
          {{ analysisData.narasi || 'Tidak ada narasi.' }}
        </p>
      </UCard>

      <!-- Siswa Perlu Perhatian -->
      <UCard>
        <h3 class="text-lg font-semibold flex items-center gap-2 mb-4 text-orange-500">
          <UIcon name="i-lucide-alert-triangle" />
          Siswa Perlu Perhatian Khusus
        </h3>
        <div v-if="analysisData.siswaPerhatianKhusus?.length" class="space-y-4">
          <div v-for="(siswa, idx) in analysisData.siswaPerhatianKhusus" :key="idx" class="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50">
            <div class="font-bold text-orange-800 dark:text-orange-400 mb-1">{{ siswa.nama }}</div>
            <p class="text-sm text-gray-700 dark:text-gray-300 mb-2"><strong>Alasan:</strong> {{ siswa.alasan }}</p>
            <p class="text-sm text-gray-700 dark:text-gray-300"><strong>Saran AI:</strong> {{ siswa.saran }}</p>
          </div>
        </div>
        <p v-else class="text-sm text-gray-500 italic">Tidak ada siswa yang perlu perhatian khusus.</p>
      </UCard>

      <!-- Rekomendasi Kelas -->
      <UCard>
        <h3 class="text-lg font-semibold flex items-center gap-2 mb-4 text-green-600">
          <UIcon name="i-lucide-check-circle" />
          Rekomendasi Tindakan Kelas
        </h3>
        <div class="space-y-3">
          <div v-for="(rek, idx) in analysisData.rekomendasiKelas" :key="idx" class="flex gap-4 items-start p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors border border-gray-100 dark:border-gray-800">
            <UBadge :color="rek.prioritas === 'tinggi' ? 'error' : (rek.prioritas === 'sedang' ? 'warning' : 'success')" variant="subtle">
              {{ rek.prioritas.toUpperCase() }}
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
