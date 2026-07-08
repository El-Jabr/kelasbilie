import { computed, ref } from 'vue'

export interface ImportRow {
  row: number
  username: string
  fullname: string
  email: string | null
  password: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT'
  valid: boolean
  errors: string[]
}

export interface PreviewResponse {
  summary: {
    total: number
    valid: number
    invalid: number
  }
  rows: ImportRow[]
}

export interface ImportResponse {
  summary: {
    total: number
    success: number
    failed: number
  }
  result: {
    username: string
    status: 'success' | 'failed'
    message?: string
  }[]
}

export function useUserImport() {
  const toast = useToast()

  // ===========================
  // STATE
  // ===========================

  // const file = ref<File | null>(null)
  const file = useState<File | null>('user-file', () => null)
  const preview = useState<PreviewResponse | null>('user-import-preview', () => null)
  const importResult = ref<ImportResponse | null>(null)
  const loadingPreview = useState<boolean>('user-loading-preview', () => false)
  const loadingImport = ref(false)
  const search = useState<string>('user-search', () => '')
  const statusFilter = ref<'all' | 'valid' | 'invalid'>('all')

  // ===========================
  // COMPUTED
  // ===========================

  const rows = computed(() => preview.value?.rows ?? [])

  const filteredRows = computed(() => {
    let data = rows.value

    if (search.value) {
      const keyword = search.value.toLowerCase()

      data = data.filter(row =>
        row.username.toLowerCase().includes(keyword)
        || row.fullname.toLowerCase().includes(keyword)
        || (row.email ?? '').toLowerCase().includes(keyword)
      )
    }

    if (statusFilter.value === 'valid') {
      data = data.filter(row => row.valid)
    }

    if (statusFilter.value === 'invalid') {
      data = data.filter(row => !row.valid)
    }

    return data
  })

  const validRows = computed(() =>
    rows.value.filter(row => row.valid)
  )

  const invalidRows = computed(() =>
    rows.value.filter(row => !row.valid)
  )

  const total = computed(() => preview.value?.summary.total ?? 0)
  const totalValid = computed(() => preview.value?.summary.valid ?? 0)
  const totalInvalid = computed(() => preview.value?.summary.invalid ?? 0)

  // ===========================
  // ACTION
  // ===========================

  async function previewFile() {
    if (!file.value) {
      toast.add({
        title: 'Pilih file terlebih dahulu',
        color: 'warning'
      })
      return
    }

    loadingPreview.value = true

    try {
      const form = new FormData()

      form.append('file', file.value)

      preview.value = await $fetch<PreviewResponse>(
        '/api/users/preview',
        {
          method: 'POST',
          body: form
        }
      )

      importResult.value = null

      toast.add({
        title: 'Preview berhasil',
        description: `${preview.value.summary.valid} data valid ditemukan.`,
        color: 'success'
      })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.add({
        title: 'Preview gagal',
        description: error.data?.statusMessage ?? error.message,
        color: 'error'
      })
    } finally {
      loadingPreview.value = false
    }
  }

  async function importUsers() {
    if (!validRows.value.length) {
      toast.add({
        title: 'Tidak ada data valid',
        color: 'warning'
      })

      return
    }

    loadingImport.value = true

    try {
      importResult.value = await $fetch<ImportResponse>(
        '/api/users/import',
        {
          method: 'POST',
          body: {
            rows: validRows.value.map(row => ({
              username: row.username,
              fullname: row.fullname,
              email: row.email,
              password: row.password,
              role: row.role
            }))
          }
        }
      )

      toast.add({
        title: 'Import selesai',
        description: `${importResult.value.summary.success} user berhasil diimport.`,
        color: 'success'
      })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.add({
        title: 'Import gagal',
        description: error.data?.statusMessage ?? error.message,
        color: 'error'
      })
    } finally {
      loadingImport.value = false
    }
  }

  function reset() {
    file.value = null
    preview.value = null
    importResult.value = null
    search.value = ''
    statusFilter.value = 'all'
  }

  // ===========================
  // RETURN
  // ===========================

  return {
    // state
    file,
    preview,
    importResult,
    loadingPreview,
    loadingImport,
    search,
    statusFilter,

    // computed
    rows,
    filteredRows,
    validRows,
    invalidRows,
    total,
    totalValid,
    totalInvalid,

    // action
    previewFile,
    importUsers,
    reset

  }
}
