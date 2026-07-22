<script setup lang="ts">
const { resource, label, identifier } = defineProps<{
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
const loading = ref(false)
const importing = ref(false)
const preview = ref<{ summary: { total: number, valid: number, invalid: number }, rows: Row[] } | null>(null)
const result = ref<{ summary: { success: number, failed: number } } | null>(null)
const toast = useToast()

const validRows = computed(() => preview.value?.rows.filter(row => row.valid) ?? [])

async function previewFile(event: Event) {
  const target = event.target as HTMLInputElement
  file.value = target.files?.[0] ?? null
  if (!file.value) return
  loading.value = true
  try {
    const form = new FormData()
    form.append('file', file.value)
    const previewUrl = `/api/${resource}/preview` as string
    preview.value = await $fetch<{ summary: { total: number, valid: number, invalid: number }, rows: Row[] }>(previewUrl, { method: 'POST', body: form })
    result.value = null
  } catch (error) {
    toast.add({ title: 'Preview gagal', description: (error as { statusMessage?: string }).statusMessage ?? 'File tidak dapat diproses.', color: 'error' })
  } finally { loading.value = false }
}

async function submit() {
  if (!validRows.value.length) return
  importing.value = true
  try {
    const importUrl = `/api/${resource}/import` as string
    result.value = await $fetch<{ summary: { success: number, failed: number } }>(importUrl, { method: 'POST', body: { rows: validRows.value.map(row => ({ username: row.username, [identifier]: row[identifier]! })) } })
    toast.add({ title: 'Import selesai', description: `${result.value?.summary.success ?? 0} data berhasil diimport.`, color: 'success' })
  } finally { importing.value = false }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold">
            Import {{ label }}
          </h2>
          <p class="text-sm text-muted">
            Gunakan file CSV dengan kolom username dan {{ identifier }}.
          </p>
        </div>
        <UButton
          :to="`/api/${resource}/template`"
          target="_blank"
          icon="i-lucide-download"
          color="neutral"
        >
          Download Template
        </UButton>
      </div>
    </template>
    <input
      type="file"
      accept=".csv"
      @change="previewFile"
    >
    <p
      v-if="file"
      class="mt-2 text-sm text-muted"
    >
      {{ file.name }}
    </p>
  </UCard>
  <div
    v-if="preview"
    class="grid gap-4 sm:grid-cols-3"
  >
    <UCard>
      <p class="text-sm text-muted">
        Total
      </p>
      <p class="text-2xl font-bold">
        {{ preview.summary.total }}
      </p>
    </UCard>
    <UCard>
      <p class="text-sm text-muted">
        Valid
      </p>
      <p class="text-2xl font-bold text-success">
        {{ preview.summary.valid }}
      </p>
    </UCard>
    <UCard>
      <p class="text-sm text-muted">
        Invalid
      </p>
      <p class="text-2xl font-bold text-error">
        {{ preview.summary.invalid }}
      </p>
    </UCard>
  </div>
  <UCard v-if="preview">
    <UTable
      :data="preview.rows"
      :columns="[{ accessorKey: 'row', header: '#' }, { accessorKey: 'username', header: 'Username' }, { accessorKey: 'fullname', header: 'Nama' }, { accessorKey: identifier, header: identifier.toUpperCase() }, { accessorKey: 'valid', header: 'Status' }, { accessorKey: 'errors', header: 'Keterangan' }]"
    >
      <template #valid-cell="{ row }">
        <UBadge :color="row.original.valid ? 'success' : 'error'">
          {{ row.original.valid ? 'Valid' : 'Invalid' }}
        </UBadge>
      </template>
      <template #errors-cell="{ row }">
        <span>{{ row.original.errors.join(', ') || '-' }}</span>
      </template>
    </UTable>
    <template #footer>
      <div class="flex justify-end">
        <UButton
          :loading="importing"
          :disabled="!validRows.length"
          icon="i-lucide-upload"
          @click="submit"
        >
          Import {{ validRows.length }} Data Valid
        </UButton>
      </div>
    </template>
  </UCard>
  <UAlert
    v-if="result"
    :color="result.summary.failed ? 'warning' : 'success'"
    :title="`Import selesai: ${result.summary.success} berhasil, ${result.summary.failed} gagal.`"
  />
</template>
