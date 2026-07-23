<script setup lang="ts">
const props = defineProps<{
  resource: 'teachers' | 'students'
  label: string
  identifier: 'nip' | 'nis'
}>()

interface Row {
  row: number
  username: string
  fullname: string
  valid: boolean
  errors: string[]
  nip?: string
  nis?: string
}

const file = ref<File | null>(null)
const loadingPreview = ref(false)
const loadingImport = ref(false)
const preview = ref<{ summary: { total: number, valid: number, invalid: number }, rows: Row[] } | null>(null)
const result = ref<{ summary: { success: number, failed: number } } | null>(null)
const toast = useToast()

const search = ref('')
const statusFilter = ref<'all' | 'valid' | 'invalid'>('all')
const dragOver = ref(false)
const fileInput = ref<HTMLInputElement>()

const rows = computed(() => preview.value?.rows ?? [])

const validRows = computed(() => rows.value.filter(row => row.valid))
const invalidRows = computed(() => rows.value.filter(row => !row.valid))

const filteredRows = computed(() => {
  let list = rows.value

  if (search.value) {
    const kw = search.value.toLowerCase()
    list = list.filter(r =>
      r.username.toLowerCase().includes(kw) ||
      r.fullname.toLowerCase().includes(kw) ||
      (r[props.identifier] ?? '').toLowerCase().includes(kw)
    )
  }

  if (statusFilter.value === 'valid') {
    list = list.filter(r => r.valid)
  } else if (statusFilter.value === 'invalid') {
    list = list.filter(r => !r.valid)
  }

  return list
})

function triggerSelectFile() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files?.length) {
    file.value = target.files[0] ?? null
    target.value = ''
  }
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  dragOver.value = false
  if (event.dataTransfer?.files.length) {
    file.value = event.dataTransfer.files[0] ?? null
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  dragOver.value = true
}

function onDragLeave() {
  dragOver.value = false
}

function reset() {
  file.value = null
  preview.value = null
  result.value = null
  search.value = ''
  statusFilter.value = 'all'
}

async function previewFile() {
  if (!file.value) return
  loadingPreview.value = true
  try {
    const form = new FormData()
    form.append('file', file.value)
    const previewUrl = `/api/${props.resource}/preview`
    preview.value = await $fetch<{ summary: { total: number, valid: number, invalid: number }, rows: Row[] }>(previewUrl, {
      method: 'POST',
      body: form
    })
    result.value = null
    toast.add({
      title: 'Preview Berhasil',
      description: `${preview.value.summary.valid} data valid ditemukan.`,
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'Preview Gagal',
      description: error.data?.statusMessage || error.message || 'File tidak dapat diproses.',
      color: 'error'
    })
  } finally {
    loadingPreview.value = false
  }
}

async function submitImport() {
  if (!validRows.value.length) return
  loadingImport.value = true
  try {
    const importUrl = `/api/${props.resource}/import`
    const payload = {
      rows: validRows.value.map(row => ({
        username: row.username,
        [props.identifier]: row[props.identifier]!
      }))
    }
    result.value = await $fetch<{ summary: { success: number, failed: number } }>(importUrl, {
      method: 'POST',
      body: payload
    })
    toast.add({
      title: 'Import Selesai',
      description: `${result.value?.summary.success ?? 0} data ${props.label} berhasil diimport.`,
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'Import Gagal',
      description: error.data?.statusMessage || error.message || 'Gagal mengimport data.',
      color: 'error'
    })
  } finally {
    loadingImport.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Card 1: File Uploader (Drag & Drop) -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold">
              Upload File {{ label }}
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Upload file Excel atau CSV untuk dipreview sebelum import.
            </p>
          </div>

          <UButton
            :to="`/api/${resource}/template`"
            target="_blank"
            icon="i-lucide-download"
            color="neutral"
            variant="outline"
          >
            Download Template
          </UButton>
        </div>
      </template>

      <!-- Drag & Drop Box -->
      <div
        class="rounded-xl border-2 border-dashed p-8 transition cursor-pointer text-center"
        :class="[
          dragOver
            ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20'
            : 'border-gray-300 dark:border-gray-700 hover:border-primary-400'
        ]"
        @click="triggerSelectFile"
        @drop="onDrop"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
      >
        <div class="flex flex-col items-center gap-3">
          <div class="p-3 bg-primary-50 dark:bg-primary-950/50 rounded-full text-primary-600 dark:text-primary-400">
            <UIcon name="i-lucide-file-spreadsheet" class="w-10 h-10" />
          </div>

          <div>
            <p class="font-medium text-base">
              Drag & Drop file Excel/CSV di sini
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              atau klik untuk memilih file dari komputer
            </p>
          </div>

          <UButton color="primary" variant="soft" size="xs">
            Pilih File
          </UButton>
        </div>

        <input
          ref="fileInput"
          type="file"
          class="hidden"
          accept=".xlsx,.xls,.csv"
          @change="onFileChange"
        >
      </div>

      <!-- File Details -->
      <div
        v-if="file"
        class="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50"
      >
        <div class="flex items-center gap-3">
          <UIcon name="i-lucide-file-text" class="w-6 h-6 text-primary-500" />
          <div>
            <p class="font-medium text-sm">{{ file.name }}</p>
            <p class="text-xs text-gray-400">{{ (file.size / 1024).toFixed(1) }} KB</p>
          </div>
        </div>

        <UButton
          color="error"
          variant="ghost"
          icon="i-lucide-trash-2"
          size="xs"
          @click="reset"
        />
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" color="neutral" @click="reset">
            Reset
          </UButton>

          <UButton
            icon="i-lucide-search-check"
            color="primary"
            :loading="loadingPreview"
            :disabled="!file"
            @click="previewFile"
          >
            Preview Data
          </UButton>
        </div>
      </template>
    </UCard>

    <!-- Section 2: Summary Cards -->
    <div v-if="preview" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase">Total Data</p>
            <p class="text-2xl font-bold mt-1">{{ preview.summary.total }}</p>
          </div>
          <UIcon name="i-lucide-file-text" class="w-8 h-8 text-gray-400" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase">Valid</p>
            <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{{ preview.summary.valid }}</p>
          </div>
          <UIcon name="i-lucide-check-circle" class="w-8 h-8 text-emerald-500" />
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs font-semibold text-gray-400 uppercase">Invalid</p>
            <p class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{{ preview.summary.invalid }}</p>
          </div>
          <UIcon name="i-lucide-x-circle" class="w-8 h-8 text-red-500" />
        </div>
      </UCard>
    </div>

    <!-- Section 3: Toolbar Filter -->
    <UCard v-if="preview">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Cari username atau nama..."
          class="w-full sm:w-72"
        />

        <div class="flex gap-1">
          <UButton
            size="xs"
            :color="statusFilter === 'all' ? 'primary' : 'neutral'"
            :variant="statusFilter === 'all' ? 'solid' : 'soft'"
            @click="() => { statusFilter = 'all' }"
          >
            Semua ({{ rows.length }})
          </UButton>
          <UButton
            size="xs"
            :color="statusFilter === 'valid' ? 'success' : 'neutral'"
            :variant="statusFilter === 'valid' ? 'solid' : 'soft'"
            @click="() => { statusFilter = 'valid' }"
          >
            Valid ({{ validRows.length }})
          </UButton>
          <UButton
            size="xs"
            :color="statusFilter === 'invalid' ? 'error' : 'neutral'"
            :variant="statusFilter === 'invalid' ? 'solid' : 'soft'"
            @click="() => { statusFilter = 'invalid' }"
          >
            Invalid ({{ invalidRows.length }})
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Section 4: Data Preview Table -->
    <UCard v-if="preview">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th class="py-3 px-4">#</th>
              <th class="py-3 px-4">Username</th>
              <th class="py-3 px-4">Nama Lengkap</th>
              <th class="py-3 px-4">{{ identifier.toUpperCase() }}</th>
              <th class="py-3 px-4">Status</th>
              <th class="py-3 px-4">Keterangan Error</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="r in filteredRows" :key="r.row" class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
              <td class="py-3 px-4 text-xs font-mono text-gray-400">{{ r.row }}</td>
              <td class="py-3 px-4 font-medium">{{ r.username }}</td>
              <td class="py-3 px-4">{{ r.fullname }}</td>
              <td class="py-3 px-4 font-mono text-xs">{{ r[identifier] || '-' }}</td>
              <td class="py-3 px-4">
                <UBadge
                  :color="r.valid ? 'success' : 'error'"
                  variant="subtle"
                  size="xs"
                >
                  {{ r.valid ? 'Valid' : 'Invalid' }}
                </UBadge>
              </td>
              <td class="py-3 px-4 text-xs text-red-500">
                {{ r.errors.join(', ') || '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Result Alert Notification -->
    <UAlert
      v-if="result"
      :color="result.summary.failed ? 'warning' : 'success'"
      icon="i-lucide-check-circle-2"
      title="Proses Import Selesai"
      :description="`Berhasil mengimport ${result.summary.success} data. Gagal: ${result.summary.failed}.`"
    />

    <!-- Section 5: Sticky Footer Import Bar -->
    <div
      v-if="preview"
      class="sticky bottom-0 z-20 border-t border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur px-6 py-4 flex items-center justify-between rounded-xl shadow-lg"
    >
      <span class="text-sm font-medium text-gray-600 dark:text-gray-300">
        <strong class="text-primary-600 dark:text-primary-400">{{ validRows.length }}</strong> data siap diimport
      </span>

      <div class="flex gap-2">
        <UButton
          color="neutral"
          variant="soft"
          icon="i-lucide-rotate-ccw"
          @click="reset"
        >
          Import File Baru
        </UButton>

        <UButton
          color="primary"
          icon="i-lucide-upload"
          :loading="loadingImport"
          :disabled="validRows.length === 0"
          @click="submitImport"
        >
          Import {{ validRows.length }} {{ label }}
        </UButton>
      </div>
    </div>
  </div>
</template>
