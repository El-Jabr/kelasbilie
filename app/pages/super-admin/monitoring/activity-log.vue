<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Activity Log'
})

const { data, pending, refresh } = await useFetch('/api/moodle/logs?limit=50')

const logs = computed(() => data.value?.data || [])

const search = ref('')
const selectedStatus = ref('ALL')

const filteredLogs = computed(() => {
  return logs.value.filter((log: any) => {
    const matchesSearch =
      !search.value ||
      log.message?.toLowerCase().includes(search.value.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.value.toLowerCase())

    const matchesStatus =
      selectedStatus.value === 'ALL' || log.status === selectedStatus.value

    return matchesSearch && matchesStatus
  })
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">
        Activity Log
      </h1>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Riwayat aktivitas dan catatan eksekusi proses sinkronisasi Moodle (SyncLog).
      </p>
    </div>

    <UCard>
      <template #header>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Cari pesan log..."
              class="w-full sm:w-64"
            />
            <select
              v-model="selectedStatus"
              class="text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md px-3 py-1.5"
            >
              <option value="ALL">Semua Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <UButton
            icon="i-lucide-rotate-cw"
            color="neutral"
            variant="ghost"
            size="xs"
            :loading="pending"
            @click="() => refresh()"
          >
            Refresh Data
          </UButton>
        </div>
      </template>

      <div v-if="pending" class="py-8 text-center text-sm text-gray-400">
        Memuat data log...
      </div>

      <div v-else-if="filteredLogs.length === 0" class="py-8 text-center text-sm text-gray-400">
        Tidak ada data log yang sesuai.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th class="py-3 px-4">Resource</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4">Pesan Detail</th>
              <th class="py-3 px-4 text-right">Waktu Event</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="log in filteredLogs" :key="log.id" class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
              <td class="py-3 px-4">
                <UBadge color="primary" variant="subtle" size="xs">
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
              <td class="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
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
