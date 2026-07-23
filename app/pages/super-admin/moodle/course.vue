<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Course Moodle'
})

const toast = useToast()
const isSyncing = ref(false)

// Fetch daftar course dari DB lokal (yang sudah disinkronkan)
const { data, pending, refresh } = await useFetch('/api/moodle')

const courses = computed(() => data.value?.data || [])

async function handleSync() {
  isSyncing.value = true
  try {
    const res: any = await $fetch('/api/moodle?resource=COURSE', {
      method: 'POST'
    })
    toast.add({
      title: 'Sinkronisasi Sukses',
      description: res.message || 'Course Moodle berhasil diperbarui.',
      color: 'success'
    })
    await refresh()
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
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          Course Moodle
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Daftar mata pelajaran yang tersinkronisasi dari server Moodle.
        </p>
      </div>

      <UButton
        icon="i-lucide-refresh-cw"
        color="primary"
        :loading="isSyncing"
        @click="handleSync"
      >
        Sync Course Moodle
      </UButton>
    </div>

    <UCard>
      <div v-if="pending" class="py-8 text-center text-sm text-gray-400">
        Memuat data course...
      </div>

      <div v-else-if="courses.length === 0" class="py-12 text-center">
        <UIcon name="i-lucide-server-off" class="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p class="text-base font-medium text-gray-600 dark:text-gray-300">Belum ada Course Moodle</p>
        <p class="text-xs text-gray-400 mt-1 mb-4">Klik tombol "Sync Course Moodle" di atas untuk menarik data dari server Moodle.</p>
        <UButton color="neutral" variant="soft" icon="i-lucide-refresh-cw" :loading="isSyncing" @click="handleSync">
          Mulai Sinkronisasi
        </UButton>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th class="py-3 px-4">ID Moodle</th>
              <th class="py-3 px-4">Nama Course</th>
              <th class="py-3 px-4">Nama Singkat</th>
              <th class="py-3 px-4">Kategori ID</th>
              <th class="py-3 px-4">Status Visible</th>
              <th class="py-3 px-4 text-right">Terakhir Sync</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="course in courses" :key="course.id" class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
              <td class="py-3 px-4 font-mono font-medium text-xs">{{ course.id }}</td>
              <td class="py-3 px-4 font-medium">{{ course.fullname }}</td>
              <td class="py-3 px-4 text-gray-500">{{ course.shortname }}</td>
              <td class="py-3 px-4">
                <UBadge color="neutral" variant="soft" size="xs">
                  {{ course.category?.name || `ID: ${course.categoryId}` }}
                </UBadge>
              </td>
              <td class="py-3 px-4">
                <UBadge :color="course.visible ? 'success' : 'error'" variant="subtle" size="xs">
                  {{ course.visible ? 'Visible' : 'Hidden' }}
                </UBadge>
              </td>
              <td class="py-3 px-4 text-right text-xs text-gray-400">
                {{ course.lastSync ? new Date(course.lastSync).toLocaleString('id-ID') : '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
