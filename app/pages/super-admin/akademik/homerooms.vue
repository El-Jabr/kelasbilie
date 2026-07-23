<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Wali Kelas'
})

const toast = useToast()
const isModalOpen = ref(false)
const isSubmitting = ref(false)

const { data: homeroomsData, pending, refresh } = await useFetch('/api/homerooms')
const { data: teachersData } = await useFetch('/api/teachers')
const { data: classesData } = await useFetch('/api/classes')
const { data: semestersData } = await useFetch('/api/semesters')

const homerooms = computed(() => homeroomsData.value?.data || [])
const teachers = computed(() => teachersData.value?.data || [])
const classes = computed(() => classesData.value?.data || [])
const semesters = computed(() => semestersData.value?.data || [])

const form = reactive({
  teacherId: '',
  classroomId: '',
  semesterId: ''
})

function openCreateModal() {
  form.teacherId = ''
  form.classroomId = ''
  form.semesterId = semesters.value.find((s: any) => s.isActive)?.id || ''
  isModalOpen.value = true
}

async function handleCreate() {
  if (!form.teacherId || !form.classroomId || !form.semesterId) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Field Guru, Kelas, dan Semester wajib diisi.',
      color: 'error'
    })
    return
  }

  isSubmitting.value = true
  try {
    const res: any = await $fetch('/api/homerooms', {
      method: 'POST',
      body: form
    })
    toast.add({
      title: 'Wali Kelas Berhasil Ditugaskan',
      description: res.message || 'Penugasan wali kelas berhasil disimpan.',
      color: 'success'
    })
    isModalOpen.value = false
    await refresh()
  } catch (error: any) {
    toast.add({
      title: 'Gagal Menyimpan',
      description: error.data?.statusMessage || error.message || 'Gagal menetapkan wali kelas.',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('Apakah Anda yakin ingin menghapus wali kelas ini?')) return

  try {
    await $fetch(`/api/homerooms/${id}`, { method: 'DELETE' })
    toast.add({
      title: 'Dihapus',
      description: 'Wali kelas berhasil dihapus.',
      color: 'success'
    })
    await refresh()
  } catch (error: any) {
    toast.add({
      title: 'Gagal Menghapus',
      description: error.data?.statusMessage || error.message || 'Gagal menghapus penugasan.',
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
          Penetapan Wali Kelas (Homeroom)
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Kelola wali kelas untuk masing-masing rombongan belajar pada semester aktif.
        </p>
      </div>

      <UButton
        icon="i-lucide-plus"
        color="primary"
        @click="openCreateModal"
      >
        Assign Wali Kelas
      </UButton>
    </div>

    <UCard>
      <div v-if="pending" class="py-8 text-center text-sm text-gray-400">
        Memuat data wali kelas...
      </div>

      <div v-else-if="homerooms.length === 0" class="py-8 text-center text-sm text-gray-400">
        Belum ada wali kelas yang ditugaskan. Klik tombol "Assign Wali Kelas" untuk menambahkan.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th class="py-3 px-4">Kelas</th>
              <th class="py-3 px-4">Guru Wali Kelas</th>
              <th class="py-3 px-4">Semester</th>
              <th class="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="item in homerooms" :key="item.id" class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
              <td class="py-3 px-4 font-medium">
                <UBadge color="neutral" variant="soft" size="xs">
                  {{ item.classroom?.name || item.classroomId }}
                </UBadge>
              </td>
              <td class="py-3 px-4 font-medium">
                {{ item.teacher?.user?.fullname || item.teacherId }} (NIP: {{ item.teacher?.nip }})
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

    <!-- Modal Form Assign Wali Kelas -->
    <UModal v-model="isModalOpen" title="Assign Wali Kelas">
      <div class="p-6 space-y-4">
        <h3 class="text-lg font-bold">Assign Wali Kelas</h3>

        <div class="space-y-3">
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
            <label class="block text-xs font-semibold text-gray-500 mb-1">Guru Wali Kelas</label>
            <select v-model="form.teacherId" class="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md p-2">
              <option value="">-- Pilih Guru --</option>
              <option v-for="t in teachers" :key="t.id" :value="t.id">
                {{ t.user?.fullname }} (NIP: {{ t.nip }})
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
