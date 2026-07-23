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
  syncInterval: 30
})

const { data: settingData, pending, refresh } = await useFetch('/api/settings')

watch(settingData, (val) => {
  if (val?.data) {
    formState.schoolName = val.data.schoolName || ''
    formState.moodleUrl = val.data.moodleUrl || ''
    formState.moodleToken = val.data.moodleToken || ''
    formState.syncEnabled = val.data.syncEnabled ?? true
    formState.syncInterval = val.data.syncInterval ?? 30
  }
}, { immediate: true })

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
            <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary-500" />
            Identitas Sekolah
          </h3>

          <div class="grid grid-cols-1 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nama Sekolah
              </label>
              <UInput
                v-model="formState.schoolName"
                placeholder="Contoh: SMA Negeri 1 Kelasbilie"
              />
            </div>
          </div>
        </div>

        <!-- Moodle Integration Section -->
        <div class="space-y-4 pt-4">
          <h3 class="text-base font-semibold border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
            <UIcon name="i-lucide-server" class="w-5 h-5 text-primary-500" />
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
              />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div>
                <span class="text-sm font-medium block">Otomatiskan Sinkronisasi</span>
                <span class="text-xs text-gray-400">Aktifkan sinkronisasi berkala di background</span>
              </div>
              <UToggle v-model="formState.syncEnabled" />
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
              />
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
