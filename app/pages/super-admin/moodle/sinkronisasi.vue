<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Sinkronisasi Moodle'
})

const toast = useToast()
const syncingResource = ref<string | null>(null)

// Fetch history sync log dari API
const { data: logsData, pending: pendingLogs, refresh: refreshLogs } = await useFetch('/api/moodle/logs?limit=15')

const logs = computed(() => logsData.value?.data || [])

async function triggerSync(resource: string) {
  syncingResource.value = resource
  try {
    const res: any = await $fetch(`/api/moodle?resource=${resource}`, {
      method: 'POST'
    })
    toast.add({
      title: 'Sinkronisasi Selesai',
      description: res.message || `Sinkronisasi resource [${resource}] selesai.`,
      color: 'success'
    })
    await refreshLogs()
  } catch (err: any) {
    toast.add({
      title: 'Sinkronisasi Gagal',
      description: err.data?.statusMessage || err.message || 'Gagal menjalankan sinkronisasi.',
      color: 'error'
    })
  } finally {
    syncingResource.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">
        Sinkronisasi Moodle
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Trigger manual sinkronisasi data Moodle dan pantau riwayat log sinkronisasi.
      </p>
    </div>

    <!-- Sync Trigger Action Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <UCard class="text-center">
        <div class="space-y-3 py-2">
          <UIcon name="i-lucide-layers" class="w-8 h-8 mx-auto text-primary-500" />
          <div>
            <h3 class="font-semibold text-sm">Semua Resource</h3>
            <p class="text-xs text-gray-400 mt-0.5">Sync Kategori, Course, User, & Nilai</p>
          </div>
          <UButton
            block
            color="primary"
            size="xs"
            :loading="syncingResource === 'ALL'"
            @click="triggerSync('ALL')"
          >
            Sync Semua
          </UButton>
        </div>
      </UCard>

      <UCard class="text-center">
        <div class="space-y-3 py-2">
          <UIcon name="i-lucide-folder-tree" class="w-8 h-8 mx-auto text-info-500" />
          <div>
            <h3 class="font-semibold text-sm">Kategori</h3>
            <p class="text-xs text-gray-400 mt-0.5">Sync CourseCategory</p>
          </div>
          <UButton
            block
            color="info"
            size="xs"
            :loading="syncingResource === 'CATEGORY'"
            @click="triggerSync('CATEGORY')"
          >
            Sync Kategori
          </UButton>
        </div>
      </UCard>

      <UCard class="text-center">
        <div class="space-y-3 py-2">
          <UIcon name="i-lucide-book-open" class="w-8 h-8 mx-auto text-success-500" />
          <div>
            <h3 class="font-semibold text-sm">Course</h3>
            <p class="text-xs text-gray-400 mt-0.5">Sync Course Moodle</p>
          </div>
          <UButton
            block
            color="success"
            size="xs"
            :loading="syncingResource === 'COURSE'"
            @click="triggerSync('COURSE')"
          >
            Sync Course
          </UButton>
        </div>
      </UCard>

      <UCard class="text-center">
        <div class="space-y-3 py-2">
          <UIcon name="i-lucide-user-check" class="w-8 h-8 mx-auto text-warning-500" />
          <div>
            <h3 class="font-semibold text-sm">Enrollment</h3>
            <p class="text-xs text-gray-400 mt-0.5">Sync Pendaftaran Siswa</p>
          </div>
          <UButton
            block
            color="warning"
            size="xs"
            :loading="syncingResource === 'USER'"
            @click="triggerSync('USER')"
          >
            Sync Enrollment
          </UButton>
        </div>
      </UCard>

      <UCard class="text-center">
        <div class="space-y-3 py-2">
          <UIcon name="i-lucide-award" class="w-8 h-8 mx-auto text-error-500" />
          <div>
            <h3 class="font-semibold text-sm">Nilai / Grade</h3>
            <p class="text-xs text-gray-400 mt-0.5">Sync GradeItem & Skor</p>
          </div>
          <UButton
            block
            color="error"
            size="xs"
            :loading="syncingResource === 'GRADE'"
            @click="triggerSync('GRADE')"
          >
            Sync Nilai
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Sync Logs Table -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 font-semibold">
            <UIcon name="i-lucide-history" class="w-5 h-5 text-primary-500" />
            <span>Riwayat Log Sinkronisasi (SyncLog)</span>
          </div>
          <UButton
            icon="i-lucide-rotate-cw"
            color="neutral"
            variant="ghost"
            size="xs"
            :loading="pendingLogs"
            @click="() => refreshLogs()"
          >
            Refresh Log
          </UButton>
        </div>
      </template>

      <div v-if="pendingLogs" class="py-8 text-center text-sm text-gray-400">
        Memuat riwayat log...
      </div>

      <div v-else-if="logs.length === 0" class="py-8 text-center text-sm text-gray-400">
        Belum ada entri log sinkronisasi.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th class="py-3 px-4">Resource</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4">Pesan Log</th>
              <th class="py-3 px-4 text-right">Waktu Eksekusi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="log in logs" :key="log.id" class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
              <td class="py-3 px-4">
                <UBadge color="neutral" variant="soft" size="xs">
                  {{ log.resource }}
                </UBadge>
              </td>
              <td class="py-3 px-4">
                <UBadge
                  :color="log.status === 'SUCCESS' ? 'success' : 'error'"
                  variant="subtle"
                  size="xs"
                >
                  {{ log.status }}
                </UBadge>
              </td>
              <td class="py-3 px-4 text-gray-700 dark:text-gray-300">
                {{ log.message || '-' }}
              </td>
              <td class="py-3 px-4 text-right text-xs text-gray-400">
                {{ new Date(log.syncedAt).toLocaleString('id-ID') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
