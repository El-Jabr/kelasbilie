<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Penugasan Mengajar'
})

const toast = useToast()
const isModalOpen = ref(false)
const isSubmitting = ref(false)

const { data: assignmentsData, pending, refresh } = await useFetch('/api/teaching-assignments')
const { data: teachersData } = await useFetch('/api/teachers')
const { data: subjectsData } = await useFetch('/api/subjects')
const { data: classesData } = await useFetch('/api/classes')
const { data: semestersData } = await useFetch('/api/semesters')
const { data: coursesData } = await useFetch('/api/moodle')

const assignments = computed(() => assignmentsData.value?.data || [])
const teachers = computed(() => teachersData.value?.data || [])
const subjects = computed(() => subjectsData.value?.data || [])
const classes = computed(() => classesData.value?.data || [])
const semesters = computed(() => semestersData.value?.data || [])
const courses = computed(() => coursesData.value?.data || [])

const form = reactive({
  teacherId: '',
  subjectId: '',
  classroomId: '',
  semesterId: '',
  courseId: undefined as number | undefined
})

function resetForm() {
  form.teacherId = ''
  form.subjectId = ''
  form.classroomId = ''
  form.semesterId = semesters.value.find((s: any) => s.isActive)?.id || ''
  form.courseId = undefined
}

function openCreateModal() {
  resetForm()
  isModalOpen.value = true
}

async function handleCreate() {
  if (!form.teacherId || !form.subjectId || !form.classroomId || !form.semesterId || !form.courseId) {
    toast.add({
      title: 'Validasi Gagal',
      description: 'Semua field (Guru, Mapel, Kelas, Semester, & Course Moodle) wajib diisi.',
      color: 'error'
    })
    return
  }

  isSubmitting.value = true
  try {
    const res: any = await $fetch('/api/teaching-assignments', {
      method: 'POST',
      body: form
    })
    toast.add({
      title: 'Penugasan Berhasil Ditambahkan',
      description: res.message || 'Penugasan mengajar berhasil disimpan.',
      color: 'success'
    })
    isModalOpen.value = false
    await refresh()
  } catch (error: any) {
    toast.add({
      title: 'Gagal Menyimpan',
      description: error.data?.statusMessage || error.message || 'Gagal menambahkan penugasan mengajar.',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('Apakah Anda yakin ingin menghapus penugasan mengajar ini?')) return

  try {
    await $fetch(`/api/teaching-assignments/${id}`, { method: 'DELETE' })
    toast.add({
      title: 'Dihapus',
      description: 'Penugasan mengajar berhasil dihapus.',
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
          Penugasan Mengajar (TeachingAssignment)
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Penetapan guru pengampu mata pelajaran di kelas dan pemetaan ke Course Moodle.
        </p>
      </div>

      <UButton
        icon="i-lucide-plus"
        color="primary"
        @click="openCreateModal"
      >
        Tambah Penugasan
      </UButton>
    </div>

    <UCard>
      <div v-if="pending" class="py-8 text-center text-sm text-gray-400">
        Memuat data penugasan mengajar...
      </div>

      <div v-else-if="assignments.length === 0" class="py-8 text-center text-sm text-gray-400">
        Belum ada penugasan mengajar. Klik tombol "Tambah Penugasan" untuk membuat baru.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th class="py-3 px-4">Guru</th>
              <th class="py-3 px-4">Mata Pelajaran</th>
              <th class="py-3 px-4">Kelas</th>
              <th class="py-3 px-4">Semester</th>
              <th class="py-3 px-4">Moodle Course</th>
              <th class="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="item in assignments" :key="item.id" class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
              <td class="py-3 px-4 font-medium">
                {{ item.teacher?.user?.fullname || item.teacherId }}
              </td>
              <td class="py-3 px-4">
                <UBadge color="info" variant="soft" size="xs">
                  {{ item.subject?.name || item.subjectId }}
                </UBadge>
              </td>
              <td class="py-3 px-4">
                <UBadge color="neutral" variant="soft" size="xs">
                  {{ item.classroom?.name || item.classroomId }}
                </UBadge>
              </td>
              <td class="py-3 px-4 text-xs text-gray-500">
                {{ item.semester?.type }} ({{ item.semester?.academicYear?.name || '-' }})
              </td>
              <td class="py-3 px-4 font-mono text-xs">
                {{ item.course?.fullname || `ID: ${item.courseId}` }}
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

    <!-- Modal Form Tambah Penugasan -->
    <UModal v-model="isModalOpen" title="Tambah Penugasan Mengajar">
      <div class="p-6 space-y-4">
        <h3 class="text-lg font-bold">Tambah Penugasan Mengajar</h3>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Guru Pengampu</label>
            <select v-model="form.teacherId" class="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md p-2">
              <option value="">-- Pilih Guru --</option>
              <option v-for="t in teachers" :key="t.id" :value="t.id">
                {{ t.user?.fullname }} (NIP: {{ t.nip }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Mata Pelajaran</label>
            <select v-model="form.subjectId" class="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md p-2">
              <option value="">-- Pilih Mata Pelajaran --</option>
              <option v-for="s in subjects" :key="s.id" :value="s.id">
                {{ s.name }} ({{ s.code }})
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

          <div>
            <label class="block text-xs font-semibold text-gray-500 mb-1">Course Moodle Terkait</label>
            <select v-model.number="form.courseId" class="w-full text-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md p-2">
              <option :value="undefined">-- Pilih Course Moodle --</option>
              <option v-for="co in courses" :key="co.id" :value="co.id">
                {{ co.fullname }} (ID: {{ co.id }})
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
