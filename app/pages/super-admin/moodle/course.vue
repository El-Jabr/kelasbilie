<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Course Moodle'
})

const toast = useToast()
const pending = ref(true)
const isSyncing = ref(false)
const courses = ref<any[]>([])

async function loadCourses() {
  pending.value = true
  try {
    const res: any = await $fetch('/api/moodle', {
      credentials: 'include'
    })
    if (res?.data) {
      courses.value = res.data
    }
  } catch (err) {
    console.error('Gagal mengambil data Course Moodle:', err)
  } finally {
    pending.value = false
  }
}

async function handleSync() {
  isSyncing.value = true
  try {
    const res: any = await $fetch('/api/moodle?resource=COURSE', {
      method: 'POST',
      credentials: 'include'
    })
    toast.add({
      title: 'Sinkronisasi Sukses',
      description: res.message || 'Course Moodle berhasil diperbarui.',
      color: 'success'
    })
    await loadCourses()
  } catch (error: any) {
    toast.add({
      title: 'Sinkronisasi Gagal',
      description: error.data?.statusMessage || error.message || 'Terjadi kesalahan saat sync.',
      color: 'error'
    })
  } finally {
    isSyncing.value = false
  }
}

onMounted(() => {
  loadCourses()
})

const search = ref('')
const page = ref(1)
const pageCount = ref(10)

const columns: any[] = [
  { accessorKey: 'id', header: 'ID Moodle' },
  { accessorKey: 'fullname', header: 'Nama Course' },
  { accessorKey: 'shortname', header: 'Nama Singkat' },
  { accessorKey: 'category', header: 'Kategori ID' },
  { accessorKey: 'visible', header: 'Status Visible' },
  { accessorKey: 'lastSync', header: 'Terakhir Sync' }
]

const filteredCourses = computed(() => {
  let list = courses.value
  if (search.value) {
    const kw = search.value.toLowerCase()
    list = list.filter((c: any) =>
      c.fullname?.toLowerCase().includes(kw) ||
      c.shortname?.toLowerCase().includes(kw) ||
      String(c.id).includes(kw)
    )
  }
  return list
})

const paginatedCourses = computed(() => {
  const start = (page.value - 1) * pageCount.value
  const end = start + pageCount.value
  return filteredCourses.value.slice(start, end)
})

watch(search, () => {
  page.value = 1
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-lucide-book-open" class="hidden sm:inline-block w-7 h-7 text-primary-500" />
          Master Course Moodle
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Daftar seluruh course yang ada di LMS Moodle beserta status terhubungnya.
        </p>
      </div>

      <UButton
        color="primary"
        icon="i-lucide-refresh-cw"
        :loading="isSyncing"
        class="w-full sm:w-auto flex justify-center"
        @click="handleSync"
      >
        Sync dari Moodle
      </UButton>
    </div>

    <!-- Filters & Course Table -->
    <UCard>
      <template #header>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Cari nama atau ID course..."
            class="w-full sm:w-72"
            size="sm"
          />

          <UBadge color="neutral" variant="subtle" size="sm" class="font-bold">
            Total: {{ filteredCourses.length }} Course
          </UBadge>
        </div>
      </template>

      <div v-if="pending" class="py-8 text-center text-sm text-gray-400">
        Memuat daftar course...
      </div>

      <div v-else-if="filteredCourses.length === 0" class="py-8 text-center text-sm text-gray-400">
        Tidak ada data course yang cocok.
      </div>

      <div v-else>
        <UTable
          :data="paginatedCourses"
          :columns="columns"
          class="w-full"
        >
          <template #id-cell="{ row }">
            <span class="font-mono font-medium text-xs">{{ (row as any).original.id }}</span>
          </template>

          <template #fullname-cell="{ row }">
            <span class="font-medium">{{ (row as any).original.fullname }}</span>
          </template>

          <template #shortname-cell="{ row }">
            <span class="text-gray-500">{{ (row as any).original.shortname }}</span>
          </template>

          <template #category-cell="{ row }">
            <UBadge color="neutral" variant="soft" size="xs">
              {{ (row as any).original.category?.name || `ID: ${(row as any).original.categoryId}` }}
            </UBadge>
          </template>

          <template #visible-cell="{ row }">
            <UBadge :color="(row as any).original.visible ? 'success' : 'error'" variant="subtle" size="xs">
              {{ (row as any).original.visible ? 'Visible' : 'Hidden' }}
            </UBadge>
          </template>

          <template #lastSync-cell="{ row }">
            <div class="text-left text-xs text-gray-400">
              {{ (row as any).original.lastSync ? new Date((row as any).original.lastSync).toLocaleString('id-ID') : '-' }}
            </div>
          </template>
        </UTable>
      </div>

      <template v-if="filteredCourses.length > 0" #footer>
        <div class="flex justify-end items-center text-xs text-gray-500">
          <UPagination v-model:page="page" :total="filteredCourses.length" :items-per-page="pageCount" />
        </div>
      </template>
    </UCard>
  </div>
</template>
