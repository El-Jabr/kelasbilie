<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Pembagian Kelas Siswa'
})

const toast = useToast()

// Fetch data pendukung
const { data: studentClassesData, pending: pendingSC, refresh: refreshSC } = await useFetch('/api/student-classes')
const { data: studentsData } = await useFetch('/api/students')
const { data: classesData } = await useFetch('/api/classes')
const { data: semestersData } = await useFetch('/api/semesters')

const studentClasses = computed(() => studentClassesData.value?.data || [])
const students = computed(() => studentsData.value?.data || [])
const classes = computed(() => classesData.value?.data || [])
const semesters = computed(() => semestersData.value?.data || [])

// Tab Active
const activeTab = ref('table') // 'table' | 'bulk' | 'clone'

// Form Bulk Assign
const bulkForm = reactive({
  classroomId: '',
  semesterId: '',
  selectedStudentIds: [] as string[]
})
const isBulkSubmitting = ref(false)

// Form Clone Semester
const cloneForm = reactive({
  fromSemesterId: '',
  toSemesterId: '',
  promoteLevel: true
})
const isCloneSubmitting = ref(false)

// Form Single Modal
const isSingleModalOpen = ref(false)
const singleForm = reactive({
  studentId: '',
  classroomId: '',
  semesterId: ''
})
const isSingleSubmitting = ref(false)

onMounted(() => {
  const activeSem = semesters.value.find((s: any) => s.isActive)
  if (activeSem) {
    bulkForm.semesterId = activeSem.id
    singleForm.semesterId = activeSem.id
  }
})

// Checkbox select all for bulk assign
const selectAllStudents = ref(false)
function toggleSelectAll() {
  if (selectAllStudents.value) {
    bulkForm.selectedStudentIds = students.value.map((s: any) => s.id)
  } else {
    bulkForm.selectedStudentIds = []
  }
}

async function handleBulkAssign() {
  if (!bulkForm.classroomId || !bulkForm.semesterId || !bulkForm.selectedStudentIds.length) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Pilih Kelas, Semester, dan minimal 1 siswa.',
      color: 'error'
    })
    return
  }

  isBulkSubmitting.value = true
  try {
    const res: any = await $fetch('/api/student-classes/bulk', {
      method: 'POST',
      body: {
        classroomId: bulkForm.classroomId,
        semesterId: bulkForm.semesterId,
        studentIds: bulkForm.selectedStudentIds
      }
    })
    toast.add({
      title: 'Berhasil Mendaftarkan',
      description: res.message || 'Pembagian kelas siswa massal berhasil.',
      color: 'success'
    })
    bulkForm.selectedStudentIds = []
    selectAllStudents.value = false
    await refreshSC()
    activeTab.value = 'table'
  } catch (err: any) {
    toast.add({
      title: 'Gagal Bulk Assign',
      description: err.data?.statusMessage || err.message || 'Terjadi kesalahan.',
      color: 'error'
    })
  } finally {
    isBulkSubmitting.value = false
  }
}

async function handleCloneSemester() {
  if (!cloneForm.fromSemesterId || !cloneForm.toSemesterId) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Pilih Semester Asal dan Semester Tujuan.',
      color: 'error'
    })
    return
  }

  isCloneSubmitting.value = true
  try {
    const res: any = await $fetch('/api/student-classes/clone', {
      method: 'POST',
      body: cloneForm
    })
    toast.add({
      title: 'Clone Semester Selesai',
      description: res.message,
      color: 'success'
    })
    await refreshSC()
    activeTab.value = 'table'
  } catch (err: any) {
    toast.add({
      title: 'Gagal Clone Semester',
      description: err.data?.statusMessage || err.message || 'Terjadi kesalahan.',
      color: 'error'
    })
  } finally {
    isCloneSubmitting.value = false
  }
}

async function handleSingleCreate() {
  if (!singleForm.studentId || !singleForm.classroomId || !singleForm.semesterId) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Field Siswa, Kelas, dan Semester wajib diisi.',
      color: 'error'
    })
    return
  }

  isSingleSubmitting.value = true
  try {
    const res: any = await $fetch('/api/student-classes', {
      method: 'POST',
      body: singleForm
    })
    toast.add({
      title: 'Berhasil',
      description: res.message || 'Siswa berhasil didaftarkan.',
      color: 'success'
    })
    isSingleModalOpen.value = false
    await refreshSC()
  } catch (error: any) {
    toast.add({
      title: 'Gagal',
      description: error.data?.statusMessage || error.message || 'Gagal menyimpan.',
      color: 'error'
    })
  } finally {
    isSingleSubmitting.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('Apakah Anda yakin ingin menghapus data siswa dari kelas ini?')) return

  try {
    await $fetch(`/api/student-classes/${id}`, { method: 'DELETE' })
    toast.add({
      title: 'Dihapus',
      description: 'Pendaftaran siswa dari kelas berhasil dihapus.',
      color: 'success'
    })
    await refreshSC()
  } catch (error: any) {
    toast.add({
      title: 'Gagal Menghapus',
      description: error.data?.statusMessage || error.message || 'Gagal menghapus data.',
      color: 'error'
    })
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          Pembagian Kelas Siswa (StudentClass)
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Kelola pendaftaran dan rombongan belajar siswa per semester secara massal atau clone.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-plus"
          color="primary"
          @click="() => { isSingleModalOpen = true }"
        >
          Daftarkan 1 Siswa
        </UButton>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-gray-200 dark:border-gray-700 gap-4 text-sm font-medium">
      <button
        class="pb-3 pt-1 border-b-2 transition-colors"
        :class="activeTab === 'table' ? 'border-primary-500 text-primary-600 dark:text-primary-400 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="activeTab = 'table'"
      >
        <UIcon name="i-lucide-table" class="inline-block w-4 h-4 mr-1" />
        Daftar Pembagian Kelas ({{ studentClasses.length }})
      </button>

      <button
        class="pb-3 pt-1 border-b-2 transition-colors"
        :class="activeTab === 'bulk' ? 'border-primary-500 text-primary-600 dark:text-primary-400 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="activeTab = 'bulk'"
      >
        <UIcon name="i-lucide-users-round" class="inline-block w-4 h-4 mr-1" />
        Bulk Assign Kelas
      </button>

      <button
        class="pb-3 pt-1 border-b-2 transition-colors"
        :class="activeTab === 'clone' ? 'border-primary-500 text-primary-600 dark:text-primary-400 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'"
        @click="activeTab = 'clone'"
      >
        <UIcon name="i-lucide-copy" class="inline-block w-4 h-4 mr-1" />
        Clone Semester (Auto Naik Kelas)
      </button>
    </div>

    <!-- TAB 1: DATA TABLE -->
    <div v-if="activeTab === 'table'">
      <UCard>
        <div v-if="pendingSC" class="py-8 text-center text-sm text-gray-400">
          Memuat data pembagian kelas...
        </div>

        <div v-else-if="studentClasses.length === 0" class="py-8 text-center text-sm text-gray-400">
          Belum ada siswa yang terdaftar di kelas. Gunakan tab "Bulk Assign" atau "Clone Semester" untuk mendaftarkan siswa.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="py-3 px-4">Siswa</th>
                <th class="py-3 px-4">NIS</th>
                <th class="py-3 px-4">Kelas Target</th>
                <th class="py-3 px-4">Semester</th>
                <th class="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="item in studentClasses" :key="item.id" class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                <td class="py-3 px-4 font-medium">
                  {{ item.student?.user?.fullname || item.studentId }}
                </td>
                <td class="py-3 px-4 text-xs font-mono">
                  {{ item.student?.nis || '-' }}
                </td>
                <td class="py-3 px-4">
                  <UBadge color="success" variant="soft" size="xs">
                    {{ item.classroom?.name || item.classroomId }}
                  </UBadge>
                </td>
                <td class="py-3 px-4 text-xs text-gray-500">
                  Semester {{ item.semester?.type }} ({{ item.semester?.academicYear?.name || '-' }})
                </td>
                <td class="py-3 px-4 text-right">
                  <UButton
                    icon="i-lucide-trash-2"
                    color="error"
                    variant="ghost"
                    size="xs"
                    @click="handleDelete(item.id)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <!-- TAB 2: BULK ASSIGN -->
    <div v-else-if="activeTab === 'bulk'" class="space-y-6">
      <UCard>
        <template #header>
          <div class="font-semibold text-base">
            Daftarkan Banyak Siswa Sekaligus ke Dalam Kelas
          </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Target Kelas</label>
            <select v-model="bulkForm.classroomId" class="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-2.5">
              <option value="">-- Pilih Kelas --</option>
              <option v-for="c in classes" :key="c.id" :value="c.id">
                {{ c.name }} (Tingkat {{ c.level }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Target Semester</label>
            <select v-model="bulkForm.semesterId" class="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-2.5">
              <option value="">-- Pilih Semester --</option>
              <option v-for="sem in semesters" :key="sem.id" :value="sem.id">
                Semester {{ sem.type }} {{ sem.isActive ? '(Aktif)' : '' }}
              </option>
            </select>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Pilih Siswa ({{ bulkForm.selectedStudentIds.length }} Terpilih)
            </h4>
            <label class="flex items-center gap-2 text-xs cursor-pointer text-gray-600">
              <input type="checkbox" v-model="selectAllStudents" @change="toggleSelectAll" class="rounded border-gray-300 text-primary-600" />
              Pilih Semua Siswa
            </label>
          </div>

          <div class="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
            <div
              v-for="s in students"
              :key="s.id"
              class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
              @click="() => {
                const idx = bulkForm.selectedStudentIds.indexOf(s.id)
                if (idx > -1) bulkForm.selectedStudentIds.splice(idx, 1)
                else bulkForm.selectedStudentIds.push(s.id)
              }"
            >
              <div class="flex items-center gap-3">
                <input
                  type="checkbox"
                  :value="s.id"
                  v-model="bulkForm.selectedStudentIds"
                  class="rounded border-gray-300 text-primary-600"
                  @click.stop
                />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ s.user?.fullname || '-' }}</p>
                  <p class="text-xs text-gray-400">NIS: {{ s.nis }} • Email: {{ s.user?.email || '-' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              color="primary"
              size="md"
              icon="i-lucide-check-circle"
              :loading="isBulkSubmitting"
              @click="handleBulkAssign"
            >
              Simpan Pembagian Kelas Massal
            </UButton>
          </div>
        </template>
      </UCard>
    </div>

    <!-- TAB 3: CLONE SEMESTER -->
    <div v-else-if="activeTab === 'clone'" class="max-w-2xl mx-auto space-y-6">
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-copy" class="w-6 h-6 text-primary-500" />
            <div>
              <h3 class="text-base font-bold">Clone Pembagian Kelas Antar Semester</h3>
              <p class="text-xs text-gray-500">Salin seluruh pembagian kelas dari semester sebelumnya tanpa perlu mendaftarkan siswa satu per satu.</p>
            </div>
          </div>
        </template>

        <div class="space-y-4 py-2">
          <div>
            <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Dari Semester (Sumber Data)</label>
            <select v-model="cloneForm.fromSemesterId" class="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-2.5">
              <option value="">-- Pilih Semester Asal --</option>
              <option v-for="sem in semesters" :key="sem.id" :value="sem.id">
                Semester {{ sem.type }} ({{ sem.academicYear?.name }}) {{ sem.isActive ? '[Aktif]' : '' }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Ke Semester (Tujuan)</label>
            <select v-model="cloneForm.toSemesterId" class="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-2.5">
              <option value="">-- Pilih Semester Tujuan --</option>
              <option v-for="sem in semesters" :key="sem.id" :value="sem.id">
                Semester {{ sem.type }} ({{ sem.academicYear?.name }}) {{ sem.isActive ? '[Aktif]' : '' }}
              </option>
            </select>
          </div>

          <div class="p-4 bg-primary-50 dark:bg-primary-950/30 rounded-xl border border-primary-100 dark:border-primary-900/50 flex items-start gap-3">
            <input
              type="checkbox"
              id="promoteToggle"
              v-model="cloneForm.promoteLevel"
              class="mt-1 rounded border-gray-300 text-primary-600"
            />
            <div>
              <label for="promoteToggle" class="text-sm font-bold text-primary-900 dark:text-primary-100 cursor-pointer">
                Naik Kelas Otomatis (+1 Level)
              </label>
              <p class="text-xs text-primary-700 dark:text-primary-300 mt-0.5">
                Jika diaktifkan, siswa tingkat VII akan otomatis dipindahkan ke VIII, VIII ke IX. Siswa tingkat akhir (IX) yang lulus akan dilewati.
              </p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              color="primary"
              icon="i-lucide-arrow-right-left"
              :loading="isCloneSubmitting"
              @click="handleCloneSemester"
            >
              Jalankan Clone Semester
            </UButton>
          </div>
        </template>
      </UCard>
    </div>

    <!-- Modal Single Add -->
    <UModal v-model="isSingleModalOpen" title="Daftarkan 1 Siswa ke Kelas">
      <div class="p-6 space-y-4">
        <h3 class="text-lg font-bold">Daftarkan 1 Siswa ke Kelas</h3>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Siswa</label>
            <select v-model="singleForm.studentId" class="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md p-2">
              <option value="">-- Pilih Siswa --</option>
              <option v-for="s in students" :key="s.id" :value="s.id">
                {{ s.user?.fullname }} (NIS: {{ s.nis }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Kelas</label>
            <select v-model="singleForm.classroomId" class="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md p-2">
              <option value="">-- Pilih Kelas --</option>
              <option v-for="c in classes" :key="c.id" :value="c.id">
                {{ c.name }} (Lvl {{ c.level }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Semester</label>
            <select v-model="singleForm.semesterId" class="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md p-2">
              <option value="">-- Pilih Semester --</option>
              <option v-for="sem in semesters" :key="sem.id" :value="sem.id">
                {{ sem.type }} {{ sem.isActive ? '(Aktif)' : '' }}
              </option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <UButton color="neutral" variant="ghost" @click="() => { isSingleModalOpen = false }">Batal</UButton>
          <UButton color="primary" :loading="isSingleSubmitting" @click="handleSingleCreate">Simpan</UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>
