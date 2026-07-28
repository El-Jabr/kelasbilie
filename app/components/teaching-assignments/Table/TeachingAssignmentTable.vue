<script setup lang="ts">
const { teachingAssignments, loading } = useTeachingAssignments()
const { openEditDialog } = useTeachingAssignmentDialogs()
const { deleteTeachingAssignment } = useTeachingAssignmentActions()

async function handleDelete(id: string) {
  if (confirm('Apakah Anda yakin ingin menghapus penugasan mengajar ini?')) {
    await deleteTeachingAssignment(id)
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
          <tr v-for="item in teachingAssignments" :key="item.id" class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
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
            <td class="py-3 px-4 text-right flex justify-end gap-1">
              <UButton
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="openEditDialog(item)"
              />
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
</template>
