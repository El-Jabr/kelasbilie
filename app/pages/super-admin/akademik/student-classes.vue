<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Pembagian Kelas Siswa'
})

const toast = useToast()
const isModalOpen = ref(false)
const isSubmitting = ref(false)

const { data: studentClassesData, pending, refresh } = await useFetch('/api/student-classes')
const { data: studentsData } = await useFetch('/api/students')
const { data: classesData } = await useFetch('/api/classes')
const { data: semestersData } = await useFetch('/api/semesters')

const studentClasses = computed(() => studentClassesData.value?.data || [])
const students = computed(() => studentsData.value?.data || [])
const classes = computed(() => classesData.value?.data || [])
const semesters = computed(() => semestersData.value?.data || [])

const form = reactive({
  studentId: '',
  classroomId: '',
  semesterId: ''
})

function openCreateModal() {
  form.studentId = ''
  form.classroomId = ''
  form.semesterId = semesters.value.find((s: any) => s.isActive)?.id || ''
  isModalOpen.value = true
}

async function handleCreate() {
  if (!form.studentId || !form.classroomId || !form.semesterId) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Field Siswa, Kelas, dan Semester wajib diisi.',
      color: 'error'
    })
    return
  }

  isSubmitting.value = true
  try {
    const res: any = await $fetch('/api/student-classes', {
      method: 'POST',
      body: form
    })
    toast.add({
      title: 'Siswa Berhasil Didaftarkan ke Kelas',
      description: res.message || 'Pembagian kelas siswa berhasil disimpan.',
      color: 'success'
    })
    isModalOpen.value = false
    await refresh()
  } catch (error: any) {
    toast.add({
      title: 'Gagal Menyimpan',
      description: error.data?.statusMessage || error.message || 'Gagal mendaftarkan siswa ke kelas.',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
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
    await refresh()
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
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          Pembagian Kelas Siswa (StudentClass)
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Pendaftaran siswa ke dalam rombongan belajar (kelas) untuk semester aktif.
        </p>
      </div>

      <UButton
        icon="i-lucide-plus"
        color="primary"
        @click="openCreateModal"
      >
        Daftarkan Siswa ke Kelas
      </UButton>
    </div>

    <UCard>
      <div v-if="pending" class="py-8 text-center text-sm text-gray-400">
        Memuat data pembagian kelas...
      </div>

      <div v-else-if="studentClasses.length === 0" class="py-8 text-center text-sm text-gray-400">
        Belum ada siswa yang mendaftar di kelas. Klik tombol "Daftarkan Siswa ke Kelas" untuk menambahkan.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th class="py-3 px-4">Siswa</th>
              <th class="py-3 px-4">NIS</th>
              <th class="py-3 px-4">Kelas</th>
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
                {{ item.semester?.type }} ({{ item.semester?.academicYear?.name || '-' }})
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

    <!-- Modal Form Pembagian Kelas Siswa -->
    <UModal v-model="isModalOpen" title="Daftarkan Siswa ke Kelas">
      <div class="p-6 space-y-4">
        <h3 class="text-lg font-bold">Daftarkan Siswa ke Kelas</h3>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Siswa</label>
            <select v-model="form.studentId" class="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md p-2">
              <option value="">-- Pilih Siswa --</option>
              <option v-for="s in students" :key="s.id" :value="s.id">
                {{ s.user?.fullname }} (NIS: {{ s.nis }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Kelas</label>
            <select v-model="form.classroomId" class="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md p-2">
              <option value="">-- Pilih Kelas --</option>
              <option v-for="c in classes" :key="c.id" :value="c.id">
                {{ c.name }} (Lvl {{ c.level }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Semester</label>
            <select v-model="form.semesterId" class="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md p-2">
              <option value="">-- Pilih Semester --</option>
              <option v-for="sem in semesters" :key="sem.id" :value="sem.id">
                {{ sem.type }} {{ sem.isActive ? '(Aktif)' : '' }}
              </option>
            </select>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <UButton color="neutral" variant="ghost" @click="() => { isModalOpen = false }">Batal</UButton>
          <UButton color="primary" :loading="isSubmitting" @click="handleCreate">Simpan</UButton>
        </div>
      </div>
    </UModal>
  </div>
</template>
