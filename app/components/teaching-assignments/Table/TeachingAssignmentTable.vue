<script setup lang="ts">
const toast = useToast()
const { teachingAssignments, loading } = useTeachingAssignments()
const { openEditDialog } = useTeachingAssignmentDialogs()
const { deleteTeachingAssignment } = useTeachingAssignmentActions()

const syncingCourseId = ref<number | null>(null)

import { LazyModalConfirm } from '#components'

const overlay = useOverlay()
const confirmModal = overlay.create(LazyModalConfirm)

async function handleDelete(id: string) {
  const confirmed = await confirmModal.open({
    title: 'Hapus Penugasan Mengajar',
    message: 'Apakah Anda yakin ingin menghapus penugasan mengajar ini?',
    confirmText: 'Ya, Hapus',
    color: 'error'
  })
  if (confirmed) {
    await deleteTeachingAssignment(id)
  }
}

async function syncCourseGrades(courseId: number, subjectName?: string, className?: string) {
  syncingCourseId.value = courseId
  try {
    const res: any = await $fetch('/api/moodle/grades/sync-course', {
      method: 'POST',
      body: { courseId },
      credentials: 'include'
    })

    toast.add({
      title: 'Sync Nilai Selesai',
      description: res.message || `Berhasil menyingkronkan nilai Moodle untuk ${subjectName || 'Course'} (${className || ''}).`,
      color: 'success'
    })
  } catch (err: any) {
    const errorMsg = err.data?.statusMessage || err.data?.message || err.message || 'Gagal menyingkronkan nilai course.'
    toast.add({
      title: 'Sync Nilai Gagal',
      description: errorMsg,
      color: 'error'
    })
  } finally {
    syncingCourseId.value = null
  }
}
</script>

<template>
  <UCard>
    <div v-if="loading" class="py-8 text-center text-sm text-gray-400">
      Memuat data penugasan mengajar...
    </div>

    <div v-else-if="teachingAssignments.length === 0" class="py-8 text-center text-sm text-gray-400">
      Belum ada penugasan mengajar. Klik tombol "Tambah Penugasan" untuk membuat baru.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm border-collapse">
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
          <tr v-for="item in teachingAssignments" :key="item.id" class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
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
              <span v-if="item.course" class="text-emerald-600 dark:text-emerald-400 font-semibold">
                {{ item.course.fullname }}
              </span>
              <span v-else-if="item.courseId" class="text-gray-600 dark:text-gray-400">
                ID: {{ item.courseId }}
              </span>
              <span v-else class="text-amber-500 italic text-xs">
                Belum terhubung
              </span>
            </td>
            <td class="py-3 px-4 text-right">
              <div class="flex items-center justify-end gap-1">
                <!-- Tombol Sync Nilai Moodle Per Course -->
                <UButton
                  v-if="item.courseId"
                  icon="i-lucide-refresh-cw"
                  color="success"
                  variant="soft"
                  size="xs"
                  title="Sync Nilai Moodle Mapel Ini"
                  class="cursor-pointer font-medium"
                  :loading="syncingCourseId === item.courseId"
                  @click="syncCourseGrades(item.courseId, item.subject?.name, item.classroom?.name)"
                >
                  Sync Nilai
                </UButton>

                <UButton
                  icon="i-lucide-pencil"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  title="Edit Penugasan"
                  @click="openEditDialog(item)"
                />
                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="xs"
                  title="Hapus Penugasan"
                  @click="handleDelete(item.id)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </UCard>
</template>
