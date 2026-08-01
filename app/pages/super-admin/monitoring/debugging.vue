<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'

definePageMeta({
  layout: 'admin'
})

const toast = useToast()

const selectedLevel = ref('all')
const searchQuery = ref('')
const isAutoRefresh = ref(true)
const selectedLog = ref<Record<string, any> | null>(null)
const isModalOpen = ref(false)
const isResettingLog = ref(false)

const levelOptions = [
  { label: 'Semua Level', value: 'all' },
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warn' },
  { label: 'Error', value: 'error' }
]

// Query params untuk fetch log
const queryParams = computed(() => ({
  level: selectedLevel.value,
  search: searchQuery.value,
  limit: 200
}))

const { data, status, refresh } = await useFetch('/api/monitoring/debug-logs', {
  query: queryParams,
  watch: [selectedLevel, searchQuery]
})

const logs = computed<Record<string, any>[]>(() => (data.value?.logs || []) as any[])

// Auto refresh setiap 5 detik jika aktif
const { pause, resume } = useIntervalFn(() => {
  if (isAutoRefresh.value) {
    refresh()
  }
}, 5000)

watch(isAutoRefresh, (val) => {
  if (val) resume()
  else pause()
})

const stats = computed(() => {
  const allLogs: any[] = (data.value?.logs || []) as any[]
  return {
    total: allLogs.length,
    info: allLogs.filter((l) => l.level === 'info').length,
    warn: allLogs.filter((l) => l.level === 'warn' || l.level === 'warning').length,
    error: allLogs.filter((l) => l.level === 'error').length
  }
})

function viewDetails(log: Record<string, any>) {
  selectedLog.value = log
  isModalOpen.value = true
}

function formatDate(isoString?: string) {
  if (!isoString) return '-'
  try {
    return new Date(isoString).toLocaleString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return isoString
  }
}

function getLevelBadgeColor(level?: string) {
  switch (level?.toLowerCase()) {
    case 'error':
      return 'error'
    case 'warn':
    case 'warning':
      return 'warning'
    case 'info':
      return 'info'
    default:
      return 'neutral'
  }
}

import { LazyModalConfirm } from '#components'

const overlay = useOverlay()
const confirmModal = overlay.create(LazyModalConfirm)

// Handler untuk reset / membersihkan seluruh log debug
async function handleResetLogs() {
  const confirmed = await confirmModal.open({
    title: 'Reset Debug Log Pino',
    message: 'Apakah Anda yakin ingin menghapus dan mengosongkan seluruh riwayat debug log Pino?',
    confirmText: 'Ya, Reset Log',
    color: 'error'
  })
  if (!confirmed) return

  isResettingLog.value = true
  try {
    const res: any = await $fetch('/api/monitoring/reset-logs', {
      method: 'POST',
      credentials: 'include'
    })

    toast.add({
      title: 'Reset Log Selesai',
      description: res.message || 'File debug log berhasil dibersihkan.',
      color: 'success'
    })

    await refresh()
  } catch (err: any) {
    toast.add({
      title: 'Reset Log Gagal',
      description: err.data?.statusMessage || err.message || 'Gagal membersihkan file log.',
      color: 'error'
    })
  } finally {
    isResettingLog.value = false
  }
}

// Handler untuk merangsang test error frontend/backend
async function triggerTestFrontendError() {
  throw new Error('Test Frontend Error: Ini adalah simulasi error dari Vue client!')
}

async function triggerTestBackendError() {
  try {
    await $fetch('/api/monitoring/test-error', { method: 'POST' })
  } catch {
    console.error('Test backend error triggered')
  }
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-lucide-terminal" class="w-7 h-7 text-emerald-500" />
          System Debugging Log (Pino)
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Monitoring aktivitas fungsi, request API, dan error client/server secara terpusat menggunakan Pino.
        </p>
      </div>

      <!-- Action & Auto-refresh status -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg text-xs font-medium">
          <span class="relative flex h-2 w-2">
            <span
              v-if="isAutoRefresh"
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
            ></span>
            <span
              class="relative inline-flex rounded-full h-2 w-2"
              :class="isAutoRefresh ? 'bg-emerald-500' : 'bg-gray-400'"
            ></span>
          </span>
          <span class="text-gray-700 dark:text-gray-300">
            Auto Refresh (5s)
          </span>
          <USwitch v-model="isAutoRefresh" size="xs" />
        </div>

        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          size="sm"
          :loading="status === 'pending'"
          @click="refresh()"
        >
          Refresh
        </UButton>

        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="soft"
          size="sm"
          class="cursor-pointer font-semibold"
          :loading="isResettingLog"
          @click="handleResetLogs"
        >
          Reset Log
        </UButton>
      </div>
    </div>

    <!-- Quick Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Log</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ stats.total }}</p>
        </div>
        <UIcon name="i-lucide-layers" class="w-8 h-8 text-gray-400 opacity-50" />
      </div>

      <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-emerald-200 dark:border-emerald-950/50 flex items-center justify-between">
        <div>
          <p class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Info Level</p>
          <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{{ stats.info }}</p>
        </div>
        <UIcon name="i-lucide-info" class="w-8 h-8 text-emerald-500 opacity-50" />
      </div>

      <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-950/50 flex items-center justify-between">
        <div>
          <p class="text-xs text-amber-600 dark:text-amber-400 font-medium">Warning Level</p>
          <p class="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{{ stats.warn }}</p>
        </div>
        <UIcon name="i-lucide-alert-triangle" class="w-8 h-8 text-amber-500 opacity-50" />
      </div>

      <div class="p-4 rounded-xl bg-white dark:bg-gray-900 border border-red-200 dark:border-red-950/50 flex items-center justify-between">
        <div>
          <p class="text-xs text-red-600 dark:text-red-400 font-medium">Error Level</p>
          <p class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{{ stats.error }}</p>
        </div>
        <UIcon name="i-lucide-alert-circle" class="w-8 h-8 text-red-500 opacity-50" />
      </div>
    </div>

    <!-- Filters & Search -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800">
      <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <USelect
          v-model="selectedLevel"
          :items="levelOptions"
          value-key="value"
          label-key="label"
          class="w-40"
        />

        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Cari pesan log..."
          class="w-full sm:w-64"
        />
      </div>

      <!-- Simulator buttons -->
      <div class="flex items-center gap-2">
        <UButton
          size="xs"
          color="warning"
          variant="soft"
          icon="i-lucide-bug"
          @click="triggerTestFrontendError"
        >
          Simulasi Error Frontend
        </UButton>
        <UButton
          size="xs"
          color="error"
          variant="soft"
          icon="i-lucide-server-crash"
          @click="triggerTestBackendError"
        >
          Simulasi Error Backend
        </UButton>
      </div>
    </div>

    <!-- Log List / Table -->
    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div v-if="status === 'pending' && !logs.length" class="p-8 text-center text-gray-500">
        <UIcon name="i-lucide-loader" class="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
        Memuat log...
      </div>

      <div v-else-if="!logs.length" class="p-8 text-center text-gray-500">
        <UIcon name="i-lucide-inbox" class="w-8 h-8 mx-auto mb-2 text-gray-400" />
        Tidak ada data log yang ditemukan.
      </div>

      <div v-else class="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-xs overflow-x-auto">
        <div
          v-for="(log, index) in logs"
          :key="index"
          class="p-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-start justify-between gap-4 cursor-pointer transition-colors"
          @click="viewDetails(log)"
        >
          <div class="flex items-start gap-3 min-w-0">
            <UBadge
              :color="getLevelBadgeColor(log['level'])"
              variant="solid"
              size="xs"
              class="uppercase font-bold shrink-0 mt-0.5"
            >
              {{ log['level'] }}
            </UBadge>

            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-2">
                <span v-if="log['type']" class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] text-gray-600 dark:text-gray-400 font-semibold uppercase">
                  {{ log['type'] }}
                </span>
                <span class="text-gray-900 dark:text-gray-100 font-medium break-all">
                  {{ log['msg'] || log['message'] || 'No message' }}
                </span>
              </div>

              <!-- Metadata preview -->
              <div class="text-[11px] text-gray-400 dark:text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span v-if="log['path']">Path: {{ log['path'] }}</span>
                <span v-if="log['statusCode']">Status: {{ log['statusCode'] }}</span>
                <span v-if="log['durationMs']">Duration: {{ log['durationMs'] }}ms</span>
                <span v-if="log['url']">URL: {{ log['url'] }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 shrink-0 text-right">
            <span class="text-[11px] text-gray-400 dark:text-gray-500">
              {{ formatDate(log['time']) }}
            </span>
            <UIcon name="i-lucide-chevron-right" class="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Detail Log -->
    <UModal v-model:open="isModalOpen">
      <template #content>
        <div class="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div class="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800">
            <div class="flex items-center gap-2">
              <UBadge :color="getLevelBadgeColor(selectedLog?.['level'])" class="uppercase font-bold">
                {{ selectedLog?.['level'] }}
              </UBadge>
              <h3 class="font-bold text-gray-900 dark:text-white">Detail Debug Log</h3>
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-xs font-semibold text-gray-500">Waktu Log:</p>
            <p class="text-xs font-mono text-gray-800 dark:text-gray-200">
              {{ formatDate(selectedLog?.['time']) }}
            </p>

            <p class="text-xs font-semibold text-gray-500 mt-3">Raw JSON Payload:</p>
            <pre class="bg-gray-950 text-emerald-400 p-4 rounded-lg text-xs overflow-x-auto font-mono select-all">{{ JSON.stringify(selectedLog, null, 2) }}</pre>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
