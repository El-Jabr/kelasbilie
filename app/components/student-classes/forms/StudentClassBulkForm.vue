<script setup lang="ts">
const emit = defineEmits(['success'])

const {
  students,
  classOptions,
  semesterOptions,
  semesters
} = useStudentClasses()

const { isBulkSubmitting, handleBulkAssign } = useStudentClassActions()

const bulkForm = reactive({
  classroomId: '',
  semesterId: '',
  selectedStudentIds: [] as string[]
})

const bulkStudentSearch = ref('')
const selectAllStudents = ref(false)

onMounted(() => {
  const activeSem = semesters.value.find((s: any) => s.isActive)
  bulkForm.semesterId = activeSem?.id || semesters.value[0]?.id || ''
})

const filteredBulkStudents = computed(() => {
  if (!bulkStudentSearch.value.trim()) return students.value
  const q = bulkStudentSearch.value.toLowerCase().trim()
  return students.value.filter((s: any) =>
    (s.user?.fullname || '').toLowerCase().includes(q) ||
    (s.nis || '').toLowerCase().includes(q) ||
    (s.user?.email || '').toLowerCase().includes(q)
  )
})

function toggleSelectAll() {
  if (selectAllStudents.value) {
    bulkForm.selectedStudentIds = filteredBulkStudents.value.map((s: any) => s.id)
  } else {
    bulkForm.selectedStudentIds = []
  }
}

async function onSubmit() {
  await handleBulkAssign(bulkForm, () => {
    bulkForm.selectedStudentIds = []
    selectAllStudents.value = false
    emit('success')
  })
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <UCard>
      <template #header>
        <div class="font-semibold text-base">
          Daftarkan Banyak Siswa Sekaligus ke Dalam Kelas
        </div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <UFormField label="Target Kelas" required>
          <USelect
            v-model="bulkForm.classroomId"
            :items="classOptions"
            value-key="value"
            label-key="label"
            placeholder="-- Pilih Kelas --"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Target Semester" required>
          <USelect
            v-model="bulkForm.semesterId"
            :items="semesterOptions"
            value-key="value"
            label-key="label"
            placeholder="-- Pilih Semester --"
            class="w-full"
          />
        </UFormField>
      </div>

      <div class="space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Pilih Siswa ({{ bulkForm.selectedStudentIds.length }} dari {{ students.length }} Siswa Terpilih)
          </h4>

          <div class="flex items-center gap-3">
            <UInput
              v-model="bulkStudentSearch"
              icon="i-lucide-search"
              placeholder="Cari siswa di daftar..."
              size="xs"
              class="w-48"
            />

            <label class="flex items-center gap-2 text-xs cursor-pointer text-gray-600 dark:text-gray-400 shrink-0">
              <input type="checkbox" v-model="selectAllStudents" @change="toggleSelectAll" class="rounded border-gray-300 text-primary-600" />
              Pilih Semua
            </label>
          </div>
        </div>

        <div class="max-h-80 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-100 dark:divide-gray-800">
          <div v-if="filteredBulkStudents.length === 0" class="p-6 text-center text-xs text-gray-400">
            Tidak ada siswa yang sesuai dengan pencarian.
          </div>

          <div
            v-for="s in filteredBulkStudents"
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
            type="submit"
            color="primary"
            size="md"
            icon="i-lucide-check-circle"
            class="cursor-pointer"
            :loading="isBulkSubmitting"
          >
            Simpan Pembagian Kelas Massal ({{ bulkForm.selectedStudentIds.length }})
          </UButton>
        </div>
      </template>
    </UCard>
  </form>
</template>
