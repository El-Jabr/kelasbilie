<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useStudentClassStore } from '~~/app/stores/studentClass'

const toast = useToast()
const store = useStudentClassStore()

const {
  classes,
  semesters,
  unassignedStudents,
  classMembers,
  pendingUnassigned,
  pendingMembers
} = storeToRefs(store)

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

// Options Dropdowns directly from Store
const semesterOptions = computed(() => semesters.value.map((s: any) => ({
  label: `${s.academicYear?.name || ''} - ${s.type} ${s.isActive ? '(AKTIF)' : ''}`.trim(),
  value: s.id
})))

const classOptions = computed(() => classes.value.map((c: any) => ({
  label: `Kelas ${c.name} (Tingkat ${c.level})`,
  value: c.id
})))

function extractId(val: any): string {
  if (!val) return ''
  if (typeof val === 'string') return val.trim()
  if (typeof val === 'object') {
    if (val.value) return String(val.value).trim()
    if (val.id) return String(val.id).trim()
  }
  return String(val).trim()
}

const targetSemesterId = computed(() => extractId(selectedSemesterId.value))
const targetClassroomId = computed(() => extractId(selectedClassroomId.value))

// Filtered lists
const filteredUnassigned = computed(() => unassignedStudents.value)
const filteredMembers = computed(() => classMembers.value)

// Checkbox select all handlers
function toggleSelectAllUnassigned() {
  if (selectAllUnassigned.value) {
    selectedUnassignedIds.value = filteredUnassigned.value.map((s: any) => s.id)
  } else {
    selectedUnassignedIds.value = []
  }
}

function toggleSelectAllMembers() {
  if (selectAllMembers.value) {
    selectedMemberClassIds.value = filteredMembers.value.map((m: any) => m.id)
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

// Unified Debounced Watcher for Plotting Data (Eliminates triple-fetching & race conditions)
const executeFetchPlotting = useDebounceFn(() => {
  selectedUnassignedIds.value = []
  selectedMemberClassIds.value = []
  selectAllUnassigned.value = false
  selectAllMembers.value = false

  if (targetSemesterId.value) {
    store.fetchUnassigned(targetSemesterId.value, searchUnassigned.value)
  }
  if (targetClassroomId.value && targetSemesterId.value) {
    store.fetchClassMembers(targetClassroomId.value, targetSemesterId.value, searchMembers.value)
  }
}, 250)

watch([targetSemesterId, targetClassroomId, searchUnassigned, searchMembers], () => {
  executeFetchPlotting()
})

// Init: Ensure supporting data is loaded and defaults are set
onMounted(async () => {
  await store.loadSupportingData()

  // Set default active semester if not selected
  if (!selectedSemesterId.value) {
    const activeSem = semesters.value.find((s: any) => s.isActive) || semesters.value[0]
    if (activeSem) selectedSemesterId.value = activeSem.id
  }

  // Set default class if not selected
  if (!selectedClassroomId.value && classes.value.length > 0) {
    selectedClassroomId.value = classes.value[0].id
  }
})

// ACTION: Batch Assign Unassigned Students to Classroom
async function assignSelectedStudents() {
  if (!targetClassroomId.value || !targetSemesterId.value) {
    toast.add({ title: 'Perhatian', description: 'Pilih semester dan kelas target.', color: 'warning' })
    return
  }
  if (!selectedUnassignedIds.value.length) {
    toast.add({ title: 'Perhatian', description: 'Pilih setidaknya satu siswa untuk dimasukkan.', color: 'warning' })
    return
  }

  isAssigning.value = true
  try {
    const doFetch: any = $fetch
    const res: any = await doFetch('/api/student-classes/bulk', {
      method: 'POST',
      body: {
        studentIds: selectedUnassignedIds.value,
        classroomId: targetClassroomId.value,
        semesterId: targetSemesterId.value
      }
    })

    toast.add({
      title: 'Berhasil',
      description: res.message || `Berhasil memasukkan ${selectedUnassignedIds.value.length} siswa ke kelas.`,
      color: 'success'
    })

    selectedUnassignedIds.value = []
    selectAllUnassigned.value = false
    store.clearPlottingCache()
    await Promise.all([
      store.fetchUnassigned(targetSemesterId.value, searchUnassigned.value, true),
      store.fetchClassMembers(targetClassroomId.value, targetSemesterId.value, searchMembers.value, true),
      store.refreshSC(true)
    ])
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
    store.clearPlottingCache()
    await Promise.all([
      store.fetchUnassigned(targetSemesterId.value, searchUnassigned.value, true),
      store.fetchClassMembers(targetClassroomId.value, targetSemesterId.value, searchMembers.value, true),
      store.refreshSC(true)
    ])
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
      <div
        class="relative lg:col-span-5 rounded-2xl p-[2px] overflow-hidden border border-amber-200 dark:border-amber-900/50 transition-all duration-300"
        :class="pendingUnassigned ? 'border-transparent dark:border-transparent shadow-lg shadow-amber-500/10' : ''"
      >
        <!-- Rotating Border Beam while loading -->
        <div
          v-if="pendingUnassigned"
          class="absolute -inset-[150%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_260deg,#f59e0b_360deg)] animate-spin"
          style="animation-duration: 2.5s;"
        />

        <UCard class="relative z-10 w-full h-full rounded-[14px] bg-white dark:bg-gray-900 border-0 shadow-none">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-user-x" class="w-5 h-5 text-amber-500" />
                <h3 class="font-bold text-sm text-gray-900 dark:text-white">
                  Siswa Belum Punya Kelas
                </h3>
              </div>
              <UBadge color="warning" variant="subtle" size="sm" class="font-bold font-mono flex items-center gap-1.5">
                <UIcon v-if="pendingUnassigned" name="i-lucide-loader-2" class="w-3.5 h-3.5 animate-spin text-amber-600" />
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

          <!-- Scrollable Student List (Preserved at all times) -->
          <div
            class="h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 transition-opacity duration-200"
            :class="pendingUnassigned ? 'opacity-75' : ''"
          >
            <!-- Empty state when list has 0 items -->
            <div v-if="filteredUnassigned.length === 0" class="p-8 text-center text-xs text-gray-400">
              <template v-if="pendingUnassigned">
                <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
                Memuat daftar siswa belum ada kelas...
              </template>
              <template v-else>
                Tidak ada siswa belum berkelas yang ditemukan.
              </template>
            </div>

            <!-- Student List Items -->
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
      </div>

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
      <div
        class="relative lg:col-span-5 rounded-2xl p-[2px] overflow-hidden border border-emerald-200 dark:border-emerald-900/50 transition-all duration-300"
        :class="pendingMembers ? 'border-transparent dark:border-transparent shadow-lg shadow-emerald-500/10' : ''"
      >
        <!-- Rotating Border Beam while loading -->
        <div
          v-if="pendingMembers"
          class="absolute -inset-[150%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_260deg,#10b981_360deg)] animate-spin"
          style="animation-duration: 2.5s;"
        />

        <UCard class="relative z-10 w-full h-full rounded-[14px] bg-white dark:bg-gray-900 border-0 shadow-none">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-lucide-users" class="w-5 h-5 text-emerald-500" />
                <h3 class="font-bold text-sm text-gray-900 dark:text-white">
                  Anggota Kelas Terpilih
                </h3>
              </div>
              <UBadge color="success" variant="subtle" size="sm" class="font-bold font-mono flex items-center gap-1.5">
                <UIcon v-if="pendingMembers" name="i-lucide-loader-2" class="w-3.5 h-3.5 animate-spin text-emerald-600" />
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

          <!-- Scrollable Student List (Preserved at all times) -->
          <div
            class="h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900 transition-opacity duration-200"
            :class="pendingMembers ? 'opacity-75' : ''"
          >
            <!-- Empty state when list has 0 items -->
            <div v-if="filteredMembers.length === 0" class="p-8 text-center text-xs text-gray-400">
              <template v-if="pendingMembers">
                <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
                Memuat anggota kelas...
              </template>
              <template v-else>
                Belum ada siswa terdaftar di kelas ini.
              </template>
            </div>

            <!-- Student List Items -->
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
  </div>
</template>
