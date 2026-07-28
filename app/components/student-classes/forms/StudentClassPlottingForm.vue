<script setup lang="ts">
const toast = useToast()

const selectedSemesterId = ref<string>('')
const selectedClassroomId = ref<string>('')

const searchUnassigned = ref('')
const searchMembers = ref('')

const selectedUnassignedIds = ref<string[]>([])
const selectedMemberClassIds = ref<string[]>([])

const selectAllUnassigned = ref(false)
const selectAllMembers = ref(false)

const isAssigning = ref(false)
const isRemoving = ref(false)

// Options Dropdowns
const semesterOptions = ref<{ label: string, value: string }[]>([])
const classOptions = ref<{ label: string, value: string }[]>([])

// 1. Fetch Semesters and Classrooms Dropdowns
async function loadDropdowns() {
  try {
    const semRes: any = await $fetch('/api/semesters', { credentials: 'include' })
    if (semRes?.data) {
      semesterOptions.value = semRes.data.map((s: any) => ({
        label: `${s.academicYear?.name} - ${s.type} ${s.isActive ? '(AKTIF)' : ''}`,
        value: s.id
      }))
      const activeSem = semRes.data.find((s: any) => s.isActive)
      if (activeSem) selectedSemesterId.value = activeSem.id
    }

    const classRes: any = await $fetch('/api/classes', { credentials: 'include' })
    if (classRes?.data) {
      classOptions.value = classRes.data.map((c: any) => ({
        label: `Kelas ${c.name} (Tingkat ${c.level})`,
        value: c.id
      }))
      if (classRes.data.length > 0) {
        selectedClassroomId.value = classRes.data[0].id
      }
    }
  } catch (err) {
    console.error('Gagal memuat dropdown plotting:', err)
  }
}

onMounted(() => {
  loadDropdowns()
})

// 2. Fetch Unassigned Students
const { data: unassignedRes, pending: pendingUnassigned, refresh: refreshUnassigned } = await useFetch('/api/students/unassigned', {
  query: computed(() => ({
    semesterId: selectedSemesterId.value,
    search: searchUnassigned.value
  })),
  immediate: !!selectedSemesterId.value
})

const unassignedStudents = computed(() => unassignedRes.value?.data ?? [])

// 3. Fetch Class Members (StudentClass records in target classroom & semester)
const { data: membersRes, pending: pendingMembers, refresh: refreshMembers } = await useFetch('/api/student-classes', {
  query: computed(() => ({
    classroomId: selectedClassroomId.value,
    semesterId: selectedSemesterId.value,
    search: searchMembers.value,
    limit: 200
  })),
  immediate: !!(selectedClassroomId.value && selectedSemesterId.value)
})

const classMembers = computed(() => membersRes.value?.data ?? [])

// Filtered lists
const filteredUnassigned = computed(() => unassignedStudents.value)
const filteredMembers = computed(() => classMembers.value)

// Checkbox select all handlers
function toggleSelectAllUnassigned() {
  if (selectAllUnassigned.value) {
    selectedUnassignedIds.value = filteredUnassigned.value.map(s => s.id)
  } else {
    selectedUnassignedIds.value = []
  }
}

function toggleSelectAllMembers() {
  if (selectAllMembers.value) {
    selectedMemberClassIds.value = filteredMembers.value.map(m => m.id)
  } else {
    selectedMemberClassIds.value = []
  }
}

// Watch selection changes to update master checkbox
watch(selectedUnassignedIds, (newVal) => {
  if (!filteredUnassigned.value.length) {
    selectAllUnassigned.value = false
    return
  }
  selectAllUnassigned.value = newVal.length === filteredUnassigned.value.length
})

watch(selectedMemberClassIds, (newVal) => {
  if (!filteredMembers.value.length) {
    selectAllMembers.value = false
    return
  }
  selectAllMembers.value = newVal.length === filteredMembers.value.length
})

// Reset selection on classroom or semester change
watch([selectedClassroomId, selectedSemesterId], () => {
  selectedUnassignedIds.value = []
  selectedMemberClassIds.value = []
  selectAllUnassigned.value = false
  selectAllMembers.value = false
})

// ACTION: Batch Assign Unassigned Students to Classroom
async function assignSelectedStudents() {
  if (!selectedClassroomId.value || !selectedSemesterId.value) {
    toast.add({ title: 'Perhatian', description: 'Pilih semester dan kelas target.', color: 'warning' })
    return
  }
  if (!selectedUnassignedIds.value.length) {
    toast.add({ title: 'Perhatian', description: 'Pilih setidaknya satu siswa untuk dimasukkan.', color: 'warning' })
    return
  }

  isAssigning.value = true
  try {
    const payload = selectedUnassignedIds.value.map(studentId => ({
      studentId,
      classroomId: selectedClassroomId.value,
      semesterId: selectedSemesterId.value
    }))

    const doFetch: any = $fetch
    const res: any = await doFetch('/api/student-classes/bulk', {
      method: 'POST',
      body: { items: payload }
    })

    toast.add({
      title: 'Berhasil',
      description: res.message || `Berhasil memasukkan ${selectedUnassignedIds.value.length} siswa ke kelas.`,
      color: 'success'
    })

    selectedUnassignedIds.value = []
    selectAllUnassigned.value = false
    await Promise.all([refreshUnassigned(), refreshMembers()])
  } catch (err: any) {
    toast.add({
      title: 'Gagal',
      description: err.statusMessage || 'Gagal merubah rombel siswa.',
      color: 'error'
    })
  } finally {
    isAssigning.value = false
  }
}

// ACTION: Batch Remove (Delete StudentClass)
async function removeSelectedMembers() {
  if (!selectedMemberClassIds.value.length) {
    toast.add({ title: 'Perhatian', description: 'Pilih siswa yang akan dikeluarkan.', color: 'warning' })
    return
  }

  isRemoving.value = true
  try {
    const doFetch: any = $fetch
    const res: any = await doFetch('/api/student-classes/batch-delete', {
      method: 'POST',
      body: { ids: selectedMemberClassIds.value }
    })

    toast.add({
      title: 'Berhasil Dikeluarkan',
      description: res.message || `Berhasil mengeluarkan ${selectedMemberClassIds.value.length} siswa dari kelas.`,
      color: 'success'
    })

    selectedMemberClassIds.value = []
    selectAllMembers.value = false
    await Promise.all([refreshUnassigned(), refreshMembers()])
  } catch (err: any) {
    toast.add({
      title: 'Gagal',
      description: err.statusMessage || 'Gagal mengeluarkan siswa.',
      color: 'error'
    })
  } finally {
    isRemoving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Controls: Target Semester & Target Kelas -->
    <UCard>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Select Target Semester -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-gray-700 dark:text-gray-300">1. Pilih Target Semester</label>
          <USelect
            v-model="selectedSemesterId"
            :items="semesterOptions"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </div>

        <!-- Select Target Kelas -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-gray-700 dark:text-gray-300">2. Pilih Target Kelas / Rombel</label>
          <USelect
            v-model="selectedClassroomId"
            :items="classOptions"
            value-key="value"
            label-key="label"
            class="w-full"
          />
        </div>
      </div>
    </UCard>

    <!-- Dual Column Transfer Panel -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- LEFT COLUMN: Siswa Belum Ada Kelas -->
      <UCard class="lg:col-span-5 border border-amber-200 dark:border-amber-900/50 shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-user-x" class="w-5 h-5 text-amber-500" />
              <h3 class="font-bold text-sm text-gray-900 dark:text-white">
                Siswa Belum Punya Kelas
              </h3>
            </div>
            <UBadge color="warning" variant="subtle" size="sm" class="font-bold font-mono">
              {{ filteredUnassigned.length }} Siswa
            </UBadge>
          </div>
        </template>

        <!-- Search & Select All -->
        <div class="space-y-3 mb-3">
          <UInput
            v-model="searchUnassigned"
            icon="i-lucide-search"
            placeholder="Cari nama / NIS siswa..."
            class="w-full"
          />

          <div class="flex items-center justify-between text-xs px-1">
            <label class="flex items-center gap-2 cursor-pointer font-medium text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                v-model="selectAllUnassigned"
                @change="toggleSelectAllUnassigned"
                class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              Pilih Semua ({{ filteredUnassigned.length }})
            </label>

            <span class="text-emerald-600 dark:text-emerald-400 font-bold">
              {{ selectedUnassignedIds.length }} Terpilih
            </span>
          </div>
        </div>

        <!-- Scrollable Student List -->
        <div class="h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
          <div v-if="pendingUnassigned" class="p-8 text-center text-xs text-gray-400">
            <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
            Memuat daftar siswa belum ada kelas...
          </div>

          <div v-else-if="filteredUnassigned.length === 0" class="p-8 text-center text-xs text-gray-400">
            Tidak ada siswa belum berkelas yang ditemukan.
          </div>

          <div
            v-for="s in filteredUnassigned"
            :key="s.id"
            class="flex items-center justify-between p-3 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 cursor-pointer transition-colors"
            @click="() => {
              const idx = selectedUnassignedIds.indexOf(s.id)
              if (idx > -1) selectedUnassignedIds.splice(idx, 1)
              else selectedUnassignedIds.push(s.id)
            }"
          >
            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                :value="s.id"
                v-model="selectedUnassignedIds"
                class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                @click.stop
              />
              <div>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ s.user?.fullname || '-' }}</p>
                <p class="text-xs font-mono text-gray-400">NIS: {{ s.nis || '-' }}</p>
              </div>
            </div>

            <UBadge color="warning" variant="subtle" size="xs">
              Unassigned
            </UBadge>
          </div>
        </div>
      </UCard>

      <!-- MIDDLE COLUMN: Action Buttons -->
      <div class="lg:col-span-2 flex flex-col items-center justify-center gap-3 py-4 lg:py-24">
        <!-- Button: Assign to Class -->
        <UButton
          color="success"
          size="md"
          icon="i-lucide-arrow-right-circle"
          class="w-full cursor-pointer font-bold shadow-sm"
          :loading="isAssigning"
          :disabled="selectedUnassignedIds.length === 0"
          @click="assignSelectedStudents"
        >
          Masukkan ({{ selectedUnassignedIds.length }})
        </UButton>

        <!-- Button: Remove from Class -->
        <UButton
          color="error"
          variant="soft"
          size="md"
          icon="i-lucide-arrow-left-circle"
          class="w-full cursor-pointer font-medium"
          :loading="isRemoving"
          :disabled="selectedMemberClassIds.length === 0"
          @click="removeSelectedMembers"
        >
          Keluarkan ({{ selectedMemberClassIds.length }})
        </UButton>
      </div>

      <!-- RIGHT COLUMN: Anggota Kelas Terpilih -->
      <UCard class="lg:col-span-5 border border-emerald-200 dark:border-emerald-900/50 shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-users" class="w-5 h-5 text-emerald-500" />
              <h3 class="font-bold text-sm text-gray-900 dark:text-white">
                Anggota Kelas Terpilih
              </h3>
            </div>
            <UBadge color="success" variant="subtle" size="sm" class="font-bold font-mono">
              {{ filteredMembers.length }} Siswa
            </UBadge>
          </div>
        </template>

        <!-- Search & Select All -->
        <div class="space-y-3 mb-3">
          <UInput
            v-model="searchMembers"
            icon="i-lucide-search"
            placeholder="Cari nama / NIS di kelas ini..."
            class="w-full"
          />

          <div class="flex items-center justify-between text-xs px-1">
            <label class="flex items-center gap-2 cursor-pointer font-medium text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                v-model="selectAllMembers"
                @change="toggleSelectAllMembers"
                class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              Pilih Semua ({{ filteredMembers.length }})
            </label>

            <span class="text-emerald-600 dark:text-emerald-400 font-bold">
              {{ selectedMemberClassIds.length }} Terpilih
            </span>
          </div>
        </div>

        <!-- Scrollable Student List -->
        <div class="h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
          <div v-if="pendingMembers" class="p-8 text-center text-xs text-gray-400">
            <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
            Memuat anggota kelas...
          </div>

          <div v-else-if="filteredMembers.length === 0" class="p-8 text-center text-xs text-gray-400">
            Belum ada siswa terdaftar di kelas ini.
          </div>

          <div
            v-for="m in filteredMembers"
            :key="m.id"
            class="flex items-center justify-between p-3 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors"
            @click="() => {
              const idx = selectedMemberClassIds.indexOf(m.id)
              if (idx > -1) selectedMemberClassIds.splice(idx, 1)
              else selectedMemberClassIds.push(m.id)
            }"
          >
            <div class="flex items-center gap-3">
              <input
                type="checkbox"
                :value="m.id"
                v-model="selectedMemberClassIds"
                class="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                @click.stop
              />
              <div>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ m.student?.user?.fullname || '-' }}</p>
                <p class="text-xs font-mono text-gray-400">NIS: {{ m.student?.nis || '-' }}</p>
              </div>
            </div>

            <UBadge color="success" variant="subtle" size="xs">
              Aktif
            </UBadge>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
