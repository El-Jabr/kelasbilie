<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Pengaturan Sekolah & Moodle'
})

const toast = useToast()
const isSaving = ref(false)
const isTesting = ref(false)

const formState = reactive({
  schoolName: '',
  moodleUrl: '',
  moodleToken: '',
  syncEnabled: true,
  syncInterval: 30,
  aiEnabled: false,
  geminiApiKey: '',
  aiSystemPrompt: '',
  logo: ''
})

const pending = ref(true)

async function refresh() {
  pending.value = true
  try {
    const res: any = await $fetch('/api/settings', { credentials: 'include' })
    if (res?.data) {
      formState.schoolName = res.data.schoolName || ''
      formState.moodleUrl = res.data.moodleUrl || ''
      formState.moodleToken = res.data.moodleToken || ''
      formState.syncEnabled = res.data.syncEnabled ?? true
      formState.syncInterval = res.data.syncInterval ?? 30
      formState.aiEnabled = res.data.aiEnabled ?? false
      formState.geminiApiKey = res.data.geminiApiKey || ''
      formState.aiSystemPrompt = res.data.aiSystemPrompt || ''
      formState.logo = res.data.logo || ''
    }
  } catch (err) {
    console.error('Failed to fetch settings:', err)
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  refresh()
})

async function handleSave() {
  isSaving.value = true
  try {
    const res: any = await $fetch('/api/settings', {
      method: 'PATCH',
      body: formState
    })
    toast.add({
      title: 'Pengaturan Disimpan',
      description: res.message || 'Pengaturan sekolah & Moodle berhasil diperbarui.',
      color: 'success'
    })
    await refresh()
  } catch (error: any) {
    toast.add({
      title: 'Gagal Menyimpan',
      description: error.data?.statusMessage || error.message || 'Terjadi kesalahan saat menyimpan pengaturan.',
      color: 'error'
    })
  } finally {
    isSaving.value = false
  }
}

async function handleTestConnection() {
  if (!formState.moodleUrl || !formState.moodleToken) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Isi URL Moodle dan Token Moodle terlebih dahulu.',
      color: 'error'
    })
    return
  }

  isTesting.value = true
  try {
    const res: any = await $fetch('/api/moodle/test-connection', {
      method: 'POST',
      body: {
        moodleUrl: formState.moodleUrl,
        moodleToken: formState.moodleToken
      }
    })
    toast.add({
      title: 'Koneksi Berhasil! 🎉',
      description: res.message || `Berhasil terhubung ke Moodle. Ditemukan ${res.categoryCount} kategori.`,
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'Koneksi Gagal',
      description: error.data?.statusMessage || error.message || 'Gagal terhubung ke Moodle API.',
      color: 'error'
    })
  } finally {
    isTesting.value = false
  }
}
</script>

<template>
  <div class="max-w-4xl space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">
        Pengaturan Sekolah & Moodle
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Konfigurasi identitas sekolah dan kredensial koneksi Moodle Web Service.
      </p>
    </div>

    <UCard>
      <div v-if="pending" class="py-8 text-center text-sm text-gray-400">
        Memuat pengaturan...
      </div>

      <form v-else class="space-y-6" @submit.prevent="handleSave">
        <!-- Identitas Sekolah Section -->
        <div class="space-y-4">
          <h3 class="text-base font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
            <UIcon name="i-lucide-building-2" class="hidden sm:inline-block w-5 h-5 text-primary-500" />
            Identitas Sekolah
          </h3>

          <div class="grid grid-cols-1 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nama Sekolah
              </label>
              <UInput
                v-model="formState.schoolName"
                placeholder="Contoh: SMA Negeri 1 Kelas Bilie"
                class="w-full lg:w-1/3"
              />
            </div>
          </div>
        </div>

        <!-- Moodle Integration Section -->
        <div class="space-y-4 pt-4">
          <h3 class="text-base font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
            <UIcon name="i-lucide-server" class="hidden sm:inline-block w-5 h-5 text-primary-500" />
            Integrasi Server Moodle
          </h3>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL Moodle
              </label>
              <UInput
                v-model="formState.moodleUrl"
                placeholder="https://moodle.sekolah.sch.id"
                icon="i-lucide-globe"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Token Moodle Web Service
              </label>
              <UInput
                v-model="formState.moodleToken"
                type="password"
                placeholder="Kunci token webservice Moodle"
                icon="i-lucide-key"
                class="w-full"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <span class="text-sm font-medium block">Otomatiskan Sinkronisasi</span>
                <span class="text-xs text-gray-400">Aktifkan sinkronisasi berkala di background</span>
              </div>
              <USwitch v-model="formState.syncEnabled" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interval Sync (Menit)
              </label>
              <UInput
                v-model.number="formState.syncInterval"
                type="number"
                min="5"
                placeholder="30"
                class="w-full"
              />
            </div>
          </div>
        </div>

        <!-- AI Integration Section -->
        <div class="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 class="text-base font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
            <UIcon name="i-lucide-brain-circuit" class="hidden sm:inline-block w-5 h-5 text-primary-500" />
            Integrasi AI (Gemini)
          </h3>

          <div class="grid grid-cols-1 gap-4">
            <div class="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-100 dark:border-primary-900/50">
              <div>
                <span class="text-sm font-medium block text-primary-900 dark:text-primary-100">Aktifkan Analisis AI</span>
                <span class="text-xs text-primary-700 dark:text-primary-300">Izinkan sistem menggunakan Google Gemini untuk menganalisis nilai akademik secara otomatis.</span>
              </div>
              <USwitch v-model="formState.aiEnabled" />
            </div>

            <div v-if="formState.aiEnabled" class="animate-in fade-in slide-in-from-top-2 duration-300">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gemini API Key
              </label>
              <UInput
                v-model="formState.geminiApiKey"
                type="password"
                placeholder="Masukkan API Key dari Google AI Studio"
                icon="i-lucide-key"
                class="w-full lg:w-1/3"
              />
              <p class="mt-1 text-xs text-gray-500">
                Dapatkan API Key di <a href="https://aistudio.google.com/" target="_blank" class="text-primary-600 hover:underline">Google AI Studio</a>.
              </p>
            </div>

            <div v-if="formState.aiEnabled" class="animate-in fade-in slide-in-from-top-2 duration-300">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Konteks Tambahan Sekolah (System Prompt)
              </label>
              <UTextarea
                v-model="formState.aiSystemPrompt"
                class="w-full"
                :rows="4"
                autoresize
                placeholder="Contoh: Sekolah ini adalah pesantren. Sebut orang tua dengan Murobbi. Kurikulum mengutamakan tahfidz..."
              />
              <p class="mt-1 text-xs text-gray-500">
                Konteks ini akan disertakan ke AI setiap kali melakukan analisis agar bahasanya sesuai dengan lingkungan sekolah Anda.
              </p>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <UButton
            type="button"
            color="info"
            variant="soft"
            icon="i-lucide-wifi"
            :loading="isTesting"
            @click="handleTestConnection"
          >
            Test Koneksi Moodle
          </UButton>

          <UButton
            type="submit"
            color="primary"
            icon="i-lucide-save"
            :loading="isSaving"
          >
            Simpan Pengaturan
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>
