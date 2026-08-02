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
  { key: 'id', label: 'ID Moodle', sortable: true },
  { key: 'fullname', label: 'Nama Course', sortable: true },
  { key: 'shortname', label: 'Nama Singkat', sortable: true },
  { key: 'category', label: 'Kategori ID' },
  { key: 'visible', label: 'Status Visible', sortable: true },
  { key: 'lastSync', label: 'Terakhir Sync', class: 'text-right', sortable: true }
]

const filteredCourses = computed(() => {
  let list = courses.value
  if (search.value) {
    const kw = search.value.toLowerCase()
    list = list.filter((r: any) => 
      (r.fullname || '').toLowerCase().includes(kw) ||
      (r.shortname || '').toLowerCase().includes(kw) ||
      String(r.id).includes(kw)
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
          <UIcon name="i-lucide-book-open" class="hidden sm:inline-block w-7 h-7 text-emerald-500" />
          Daftar Course Moodle
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Kelola data kursus pembelajaran yang disinkronkan dari LMS Moodle.
        </p>
      </div>

      <UButton
        color="primary"
        variant="solid"
        icon="i-lucide-refresh-cw"
        :loading="isSyncing"
        class="w-full sm:w-auto flex justify-center"
        @click="handleSync"
      >
        Sinkronkan Course Sekarang
      </UButton>
    </div>

    <!-- Main Card -->
    <UCard>
      <template #header>
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Cari ID, nama course, atau shortname..."
            class="w-full sm:w-80"
            size="sm"
          />

          <UBadge color="neutral" variant="subtle" size="sm" class="font-bold">
            Total: {{ filteredCourses.length }} Course
          </UBadge>
        </div>
      </template>

      <div v-if="pending" class="py-12 text-center text-sm text-gray-400">
        Memuat data course Moodle...
      </div>

      <div v-else-if="filteredCourses.length === 0" class="py-12 text-center text-sm text-gray-400">
        Belum ada data course Moodle tersimpan. Silakan lakukan sinkronisasi terlebih dahulu.
      </div>

      <div v-else>
        <UTable
          :rows="paginatedCourses"
          :columns="columns"
          :empty-state="{ icon: 'i-lucide-file-x', text: 'Tidak ada data course yang cocok.' }"
        >
          <template #id-data="{ row }">
            <span class="font-mono font-medium text-xs">{{ (row as any).id }}</span>
          </template>

          <template #fullname-data="{ row }">
            <span class="font-medium">{{ (row as any).fullname }}</span>
          </template>

          <template #shortname-data="{ row }">
            <span class="text-gray-500">{{ (row as any).shortname }}</span>
          </template>

          <template #category-data="{ row }">
            <UBadge color="neutral" variant="soft" size="xs">
              {{ (row as any).category?.name || `ID: ${(row as any).categoryId}` }}
            </UBadge>
          </template>

          <template #visible-data="{ row }">
            <UBadge :color="(row as any).visible ? 'success' : 'error'" variant="subtle" size="xs">
              {{ (row as any).visible ? 'Visible' : 'Hidden' }}
            </UBadge>
          </template>

          <template #lastSync-data="{ row }">
            <div class="text-right text-xs text-gray-400">
              {{ (row as any).lastSync ? new Date((row as any).lastSync).toLocaleString('id-ID') : '-' }}
            </div>
          </template>
        </UTable>
      </div>

      <template v-if="filteredCourses.length > 0" #footer>
        <div class="flex justify-end items-center text-xs text-gray-500">
          <UPagination v-model="page" :page-count="pageCount" :total="filteredCourses.length" />
        </div>
      </template>
    </UCard>
  </div>
</template>
