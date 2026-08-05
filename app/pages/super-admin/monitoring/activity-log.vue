<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Activity Log'
})

const pending = ref(true)
const logs = ref<any[]>([])
const totalLogs = ref(0)

const search = ref('')
const selectedCategory = ref('ALL')
const selectedStatus = ref('ALL')

const page = ref(1)
const limit = ref(15)

const categories = [
  { value: 'ALL', label: 'Semua Kategori' },
  { value: 'AUTH', label: 'Auth (Login/Logout)' },
  { value: 'USER', label: 'Pengguna' },
  { value: 'ACADEMIC', label: 'Akademik' },
  { value: 'COURSE', label: 'Moodle & Kelas' },
  { value: 'GRADE', label: 'Nilai' },
  { value: 'SYSTEM', label: 'Sistem' }
]

const statuses = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'SUCCESS', label: 'Sukses' },
  { value: 'FAILED', label: 'Gagal' }
]

async function refresh() {
  pending.value = true
  try {
    const params = new URLSearchParams({
      page: String(page.value),
      limit: String(limit.value)
    })

    if (search.value.trim()) params.append('search', search.value.trim())
    if (selectedCategory.value !== 'ALL') params.append('category', selectedCategory.value)
    if (selectedStatus.value !== 'ALL') params.append('status', selectedStatus.value)

    const res: any = await $fetch(`/api/logs/activity?${params.toString()}`, { credentials: 'include' })
    if (res?.data && Array.isArray(res.data)) {
      logs.value = res.data
      totalLogs.value = res.pagination?.total || res.data.length
    } else {
      logs.value = []
      totalLogs.value = 0
    }
  } catch (err) {
    console.error('Failed to fetch activity logs:', err)
    logs.value = []
    totalLogs.value = 0
  } finally {
    pending.value = false
  }
}

watch([search, selectedCategory, selectedStatus], () => {
  page.value = 1
  refresh()
})

watch(page, () => {
  refresh()
})

onMounted(() => {
  refresh()
})

const columns = [
  { id: 'createdAt', accessorKey: 'createdAt', header: 'Waktu' },
  { id: 'userName', accessorKey: 'userName', header: 'Pengguna' },
  { id: 'category', accessorKey: 'category', header: 'Kategori' },
  { id: 'action', accessorKey: 'action', header: 'Aksi' },
  { id: 'description', accessorKey: 'description', header: 'Deskripsi' },
  { id: 'status', accessorKey: 'status', header: 'Status' }
]
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
          Pantau seluruh jejak aktivitas pengguna, sesi login/logout, dan perubahan data di sistem.
        </p>
      </div>

      <UButton
        color="neutral"
        variant="outline"
        icon="i-lucide-refresh-cw"
        :loading="pending"
        class="w-full sm:w-auto flex justify-center cursor-pointer"
        @click="refresh"
      >
        Refresh Log
      </UButton>
    </div>

    <!-- Filters & Log Table -->
    <UCard :ui="{ body: 'p-4 sm:p-5' }">
      <template #header>
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Cari user, aksi, atau pesan..."
              class="w-full sm:w-64"
              size="sm"
            />
            <USelect
              v-model="selectedCategory"
              :items="categories"
              value-key="value"
              label-key="label"
              size="sm"
              class="w-full sm:w-44"
            />
            <USelect
              v-model="selectedStatus"
              :items="statuses"
              value-key="value"
              label-key="label"
              size="sm"
              class="w-full sm:w-36"
            />
          </div>

          <UBadge color="neutral" variant="subtle" size="sm" class="font-bold self-end md:self-auto">
            Total: {{ totalLogs }} Log
          </UBadge>
        </div>
      </template>

      <div v-if="pending" class="py-8 text-center text-sm text-gray-400">
        Memuat data log aktivitas...
      </div>

      <div v-else-if="!logs || logs.length === 0" class="py-8 text-center text-sm text-gray-400">
        Tidak ada catatan aktivitas yang sesuai.
      </div>

      <div v-else class="overflow-x-auto">
        <UTable
          :data="logs"
          :columns="columns"
          class="w-full"
        >
          <template #createdAt-cell="{ row }">
            <div class="text-xs text-gray-500 whitespace-nowrap">
              {{ (row as any)?.original?.createdAt ? new Date((row as any).original.createdAt).toLocaleString('id-ID') : '-' }}
            </div>
          </template>

          <template #userName-cell="{ row }">
            <div class="flex flex-col">
              <span class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ (row as any)?.original?.userName || (row as any)?.original?.user?.fullname || 'Sistem / Anonim' }}
              </span>
              <span v-if="(row as any)?.original?.user?.role" class="text-xs text-gray-400">
                {{ (row as any).original.user.role }}
              </span>
            </div>
          </template>

          <template #category-cell="{ row }">
            <UBadge color="primary" variant="subtle" size="xs">
              {{ (row as any)?.original?.category || '-' }}
            </UBadge>
          </template>

          <template #action-cell="{ row }">
            <span class="text-xs font-mono font-semibold px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
              {{ (row as any)?.original?.action || '-' }}
            </span>
          </template>

          <template #description-cell="{ row }">
            <div class="max-w-md">
              <p class="text-xs text-gray-700 dark:text-gray-300">
                {{ (row as any)?.original?.description || '-' }}
              </p>
              <p v-if="(row as any)?.original?.errorMessage" class="text-xs text-red-500 mt-0.5 font-mono">
                Error: {{ (row as any).original.errorMessage }}
              </p>
            </div>
          </template>

          <template #status-cell="{ row }">
            <UBadge
              :color="(row as any)?.original?.status === 'SUCCESS' ? 'success' : 'error'"
              variant="subtle"
              size="xs"
            >
              {{ (row as any)?.original?.status || 'SUCCESS' }}
            </UBadge>
          </template>
        </UTable>
      </div>

      <template v-if="totalLogs > 0" #footer>
        <div class="flex justify-between items-center text-xs text-gray-500">
          <span>Menampilkan {{ logs.length }} dari {{ totalLogs }} item</span>
          <UPagination v-model:page="page" :total="totalLogs" :items-per-page="limit" />
        </div>
      </template>
    </UCard>
  </div>
</template>
