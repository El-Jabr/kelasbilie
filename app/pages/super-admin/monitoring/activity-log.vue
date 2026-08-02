<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Activity Log'
})

const pending = ref(true)
const logs = ref<any[]>([])

async function refresh() {
  pending.value = true
  try {
    const res: any = await $fetch('/api/moodle/logs?limit=50', { credentials: 'include' })
    if (res?.data) logs.value = res.data
  } catch (err) {
    console.error('Failed to fetch activity logs:', err)
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  refresh()
})

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

const page = ref(1)
const pageCount = ref(10)

const columns: any[] = [
  { key: 'resource', label: 'Resource', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'message', label: 'Pesan Detail', sortable: true },
  { key: 'syncedAt', label: 'Waktu Event', class: 'text-right', sortable: true }
]

const paginatedLogs = computed(() => {
  const start = (page.value - 1) * pageCount.value
  const end = start + pageCount.value
  return filteredLogs.value.slice(start, end)
})

watch([search, selectedStatus], () => {
  page.value = 1
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-lucide-activity" class="hidden sm:inline-block w-7 h-7 text-emerald-500" />
          Activity & Audit Log
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Pantau riwayat operasi sistem, integrasi Moodle, dan perubahan data penting.
        </p>
      </div>

      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-refresh-cw"
        :loading="pending"
        class="w-full sm:w-auto flex justify-center"
        @click="refresh"
      >
        Refresh Log
      </UButton>
    </div>

    <!-- Filters & Log Table -->
    <UCard>
      <template #header>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3 w-full sm:w-auto">
            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Cari pesan log atau resource..."
              class="w-full sm:w-64"
              size="sm"
            />
            <USelect
              v-model="selectedStatus"
              :options="[
                { value: 'ALL', label: 'Semua Status' },
                { value: 'SUCCESS', label: 'SUCCESS' },
                { value: 'ERROR', label: 'ERROR' }
              ]"
              size="sm"
              class="w-36"
            />
          </div>

          <UBadge color="neutral" variant="subtle" size="sm" class="font-bold">
            Total: {{ filteredLogs.length }} Event
          </UBadge>
        </div>
      </template>

      <div v-if="pending" class="py-8 text-center text-sm text-gray-400">
        Memuat data log...
      </div>

      <div v-else-if="filteredLogs.length === 0" class="py-8 text-center text-sm text-gray-400">
        Tidak ada data log yang sesuai.
      </div>

      <div v-else>
        <UTable
          :rows="paginatedLogs"
          :columns="columns"
          :empty-state="{ icon: 'i-lucide-file-x', text: 'Tidak ada data log yang sesuai.' }"
        >
          <template #resource-data="{ row }">
            <UBadge color="primary" variant="subtle" size="xs">
              {{ (row as any).resource }}
            </UBadge>
          </template>
          
          <template #status-data="{ row }">
            <UBadge
              :color="(row as any).status === 'SUCCESS' ? 'success' : 'error'"
              variant="subtle"
              size="xs"
            >
              {{ (row as any).status }}
            </UBadge>
          </template>
          
          <template #message-data="{ row }">
            <span class="text-gray-700 dark:text-gray-300 font-medium">
              {{ (row as any).message || '-' }}
            </span>
          </template>
          
          <template #syncedAt-data="{ row }">
            <div class="text-right text-xs text-gray-400">
              {{ new Date((row as any).syncedAt).toLocaleString('id-ID') }}
            </div>
          </template>
        </UTable>
      </div>

      <template v-if="filteredLogs.length > 0" #footer>
        <div class="flex justify-end items-center text-xs text-gray-500">
          <UPagination v-model="page" :page-count="pageCount" :total="filteredLogs.length" />
        </div>
      </template>
    </UCard>
  </div>
</template>
