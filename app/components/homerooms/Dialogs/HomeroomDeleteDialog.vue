<script setup lang="ts">
const {
  deleteDialogOpen,
  selectedHomeroom,
  closeDeleteDialog
} = useHomeroomDialogs()

const {
  deleteHomeroom,
  deleting
} = useHomeroomActions()
</script>

<template>
  <UModal v-model:open="deleteDialogOpen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-base font-semibold leading-6 text-red-600">
              Hapus Wali Kelas
            </h3>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              class="-my-1"
              @click="closeDeleteDialog"
            />
          </div>
        </template>

        <div class="space-y-2">
          <p class="text-sm">
            Apakah Anda yakin ingin menghapus penugasan wali kelas ini?
          </p>
          <div v-if="selectedHomeroom" class="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
            <p><strong>Kelas:</strong> {{ selectedHomeroom.classroom?.name || selectedHomeroom.classroomId }}</p>
            <p><strong>Guru:</strong> {{ selectedHomeroom.teacher?.user?.fullname || selectedHomeroom.teacherId }}</p>
            <p><strong>Semester:</strong> {{ selectedHomeroom.semester?.type }} ({{ selectedHomeroom.semester?.academicYear?.name || '-' }})</p>
          </div>
          <p class="text-sm text-red-500 mt-2 font-medium">
            Tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="soft"
              @click="closeDeleteDialog"
            >
              Batal
            </UButton>
            <UButton
              color="error"
              :loading="deleting"
              @click="deleteHomeroom"
            >
              Hapus
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
