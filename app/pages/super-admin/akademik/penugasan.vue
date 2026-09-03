<script setup lang="ts">
import { LazyModalConfirm } from '#components'

definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Penugasan Kelas'
})

// ── Teaching Assignment ──────────────────────────────────────────────────
const { teachingAssignments, loading: loadingTA, semesters, fetchTeachingAssignments } = useTeachingAssignments()
const { openCreateDialog: openCreateTA, openEditDialog: openEditTA } = useTeachingAssignmentDialogs()
const { deleteTeachingAssignment } = useTeachingAssignmentActions()

// ── Homeroom ─────────────────────────────────────────────────────────────
const { homerooms, loading: loadingHR, fetchHomerooms } = useHomerooms()
const { openCreateDialog: openCreateHomeroom, openEditDialog: openEditHomeroom, openDeleteDialog: openDeleteHomeroom } = useHomeroomDialogs()

// ── Active Tab ────────────────────────────────────────────────────────────
const route = useRoute()
const activeTab = ref(route.query.tab === 'homeroom' ? 'homeroom' : 'teaching')

// ── Semester Filter (Teaching Assignment) ─────────────────────────────────
const selectedSemesterId = ref('')

interface ISemester {
  id: string
  isActive: boolean
  type: string
  academicYear?: { name: string }
}

interface ITeachingAssignment {
  id: string
  semesterId: string
  classroomId: string
  courseId: number | null
  classroom?: { id: string, name: string, level: number }
  subject?: { name: string }
  teacher?: { nip: string, user?: { fullname: string } }
}

interface IHomeroom {
  id: string
  semesterId: string
  classroom?: { id: string, name: string, level: number }
  semester?: { type: string, academicYear?: { name: string } }
  teacher?: { nip: string, user?: { fullname: string } }
}

const semesterOptions = computed(() => [
  { label: 'Semua Semester', value: '' },
  ...(semesters.value as ISemester[]).map(s => ({
    label: `${s.type} ${s.academicYear?.name || ''} ${s.isActive ? '(Aktif)' : ''}`.trim(),
    value: s.id
  }))
])

// ── Teaching Assignments: filter + group by classroom ─────────────────────
const filteredTA = computed(() => {
  const list = teachingAssignments.value as ITeachingAssignment[]
  if (!selectedSemesterId.value) return list
  return list.filter(ta => ta.semesterId === selectedSemesterId.value)
})

const groupedByClassroom = computed(() => {
  const map = new Map<string, { classroom: ITeachingAssignment['classroom'], assignments: ITeachingAssignment[] }>()
  for (const ta of filteredTA.value) {
    const cid = ta.classroomId
    if (!map.has(cid)) {
      map.set(cid, { classroom: ta.classroom, assignments: [] })
    }
    map.get(cid)!.assignments.push(ta)
  }
  return [...map.values()].sort((a, b) => {
    const la = a.classroom?.level ?? 0
    const lb = b.classroom?.level ?? 0
    if (la !== lb) return la - lb
    return (a.classroom?.name ?? '').localeCompare(b.classroom?.name ?? '')
  })
})

// ── Homeroom: filter by semester ──────────────────────────────────────────
const selectedHRSemesterId = ref('')

const filteredHomerooms = computed(() => {
  const list = homerooms.value as IHomeroom[]
  if (!selectedHRSemesterId.value) return list
  return list.filter(h => h.semesterId === selectedHRSemesterId.value)
})

// ── Delete Teaching Assignment ────────────────────────────────────────────
const toast = useToast()
const overlay = useOverlay()
const confirmModal = overlay.create(LazyModalConfirm)

async function handleDeleteTA(id: string) {
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

// ── Sync Moodle ───────────────────────────────────────────────────────────
const syncingId = ref<number | null>(null)

async function syncGrades(courseId: number, subjectName?: string, className?: string) {
  syncingId.value = courseId
  try {
    const res = await $fetch<{ message: string }>('/api/moodle/grades/sync-course', {
      method: 'POST',
      body: { courseId },
      credentials: 'include'
    })
    toast.add({
      title: 'Sync Berhasil',
      description: res.message || `Nilai Moodle berhasil disinkronkan untuk ${subjectName} (${className}).`,
      color: 'success'
    })
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string }, message?: string }
    toast.add({
      title: 'Sync Gagal',
      description: err?.data?.statusMessage || err?.message || 'Gagal menyinkronkan nilai.',
      color: 'error'
    })
  } finally {
    syncingId.value = null
  }
}

// ── Init ──────────────────────────────────────────────────────────────────
onMounted(async () => {
  await Promise.all([fetchTeachingAssignments(), fetchHomerooms()])
  // Default: aktifkan filter semester aktif
  const activeSem = (semesters.value as ISemester[]).find(s => s.isActive)
  if (activeSem) {
    selectedSemesterId.value = activeSem.id
    selectedHRSemesterId.value = activeSem.id
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UIcon
            name="i-lucide-clipboard-list"
            class="w-6 h-6 text-blue-500"
          />
          Penugasan Kelas
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Kelola guru pengampu mata pelajaran dan wali kelas dalam satu halaman.
        </p>
      </div>
      <UButton
        v-if="activeTab === 'teaching'"
        icon="i-lucide-plus"
        color="primary"
        class="cursor-pointer"
        @click="openCreateTA"
      >
        Tambah Penugasan
      </UButton>
      <UButton
        v-else
        icon="i-lucide-user-plus"
        color="primary"
        class="cursor-pointer"
        @click="openCreateHomeroom"
      >
        Assign Wali Kelas
      </UButton>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-gray-200 dark:border-gray-700 gap-6 text-sm font-medium">
      <button
        type="button"
        class="pb-3 pt-1 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
        :class="activeTab === 'teaching'
          ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
        @click="activeTab = 'teaching'"
      >
        <UIcon
          name="i-lucide-book-open-check"
          class="w-4 h-4"
        />
        Penugasan Mengajar
        <UBadge
          v-if="(teachingAssignments as ITeachingAssignment[]).length"
          color="neutral"
          variant="subtle"
          size="xs"
        >
          {{ (teachingAssignments as ITeachingAssignment[]).length }}
        </UBadge>
      </button>

      <button
        type="button"
        class="pb-3 pt-1 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
        :class="activeTab === 'homeroom'
          ? 'border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
          : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
        @click="activeTab = 'homeroom'"
      >
        <UIcon
          name="i-lucide-user-cog"
          class="w-4 h-4"
        />
        Wali Kelas
        <UBadge
          v-if="(homerooms as IHomeroom[]).length"
          color="neutral"
          variant="subtle"
          size="xs"
        >
          {{ (homerooms as IHomeroom[]).length }}
        </UBadge>
      </button>
    </div>

    <!-- ====== TAB 1: PENUGASAN MENGAJAR ====== -->
    <div
      v-if="activeTab === 'teaching'"
      class="space-y-4"
    >
      <!-- Filter Bar -->
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <USelect
          v-model="selectedSemesterId"
          :items="semesterOptions"
          value-key="value"
          label-key="label"
          class="w-full sm:w-72"
          placeholder="Pilih Semester"
        />
        <span class="text-sm text-gray-400">
          {{ filteredTA.length }} penugasan
          {{ selectedSemesterId ? 'pada semester ini' : 'total' }}
        </span>
      </div>

      <!-- Loading -->
      <div
        v-if="loadingTA"
        class="py-12 text-center text-gray-400"
      >
        <UIcon
          name="i-lucide-loader"
          class="w-6 h-6 animate-spin mx-auto mb-2"
        />
        Memuat data...
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!groupedByClassroom.length"
        class="py-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700"
      >
        <UIcon
          name="i-lucide-inbox"
          class="w-10 h-10 mx-auto text-gray-300 mb-2"
        />
        <p class="text-sm text-gray-500">
          Belum ada penugasan mengajar.
        </p>
        <UButton
          icon="i-lucide-plus"
          color="primary"
          size="sm"
          class="mt-3 cursor-pointer"
          @click="openCreateTA"
        >
          Tambah Penugasan
        </UButton>
      </div>

      <!-- Grouped by Classroom (Card sections) -->
      <div
        v-else
        class="space-y-4"
      >
        <div
          v-for="group in groupedByClassroom"
          :key="group.classroom?.id"
          class="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900"
        >
          <!-- Classroom Header -->
          <div class="flex items-center gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-700">
            <div class="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
              <UIcon
                name="i-lucide-building-2"
                class="w-4 h-4"
              />
            </div>
            <span class="font-bold text-gray-900 dark:text-white">
              Kelas {{ group.classroom?.name || '-' }}
            </span>
            <UBadge
              color="neutral"
              variant="subtle"
              size="xs"
            >
              Tingkat {{ group.classroom?.level }}
            </UBadge>
            <span class="ml-auto text-xs text-gray-400">{{ group.assignments.length }} mata pelajaran</span>
          </div>

          <!-- Subject rows -->
          <div class="divide-y divide-gray-100 dark:divide-gray-800">
            <div
              v-for="ta in group.assignments"
              :key="ta.id"
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
            >
              <!-- Left: Mapel + Guru -->
              <div class="flex items-center gap-4 min-w-0">
                <div class="w-1.5 h-8 rounded-full bg-blue-400 dark:bg-blue-600 shrink-0" />
                <div class="min-w-0">
                  <p class="font-semibold text-gray-900 dark:text-white truncate">
                    {{ ta.subject?.name || 'Mata Pelajaran' }}
                  </p>
                  <p class="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <UIcon
                      name="i-lucide-user"
                      class="w-3 h-3"
                    />
                    {{ ta.teacher?.user?.fullname || '-' }}
                  </p>
                </div>
              </div>

              <!-- Right: Course badge + Actions -->
              <div class="flex items-center gap-2 shrink-0">
                <UBadge
                  v-if="ta.courseId"
                  color="primary"
                  variant="subtle"
                  size="xs"
                  class="font-mono"
                >
                  <UIcon
                    name="i-lucide-cloud"
                    class="w-3 h-3 mr-1"
                  />
                  Course #{{ ta.courseId }}
                </UBadge>
                <UBadge
                  v-else
                  color="warning"
                  variant="subtle"
                  size="xs"
                >
                  Belum terhubung Moodle
                </UBadge>

                <UButton
                  v-if="ta.courseId"
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-refresh-cw"
                  :loading="syncingId === ta.courseId"
                  title="Sync nilai Moodle"
                  @click="syncGrades(ta.courseId, ta.subject?.name, ta.classroom?.name)"
                />
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-edit-3"
                  @click="openEditTA(ta)"
                />
                <UButton
                  size="xs"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  @click="handleDeleteTA(ta.id)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ====== TAB 2: WALI KELAS ====== -->
    <div
      v-else-if="activeTab === 'homeroom'"
      class="space-y-4"
    >
      <!-- Filter Bar -->
      <div class="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <USelect
          v-model="selectedHRSemesterId"
          :items="semesterOptions"
          value-key="value"
          label-key="label"
          class="w-full sm:w-72"
          placeholder="Pilih Semester"
        />
        <span class="text-sm text-gray-400">
          {{ filteredHomerooms.length }} kelas terdaftar
        </span>
      </div>

      <!-- Loading -->
      <div
        v-if="loadingHR"
        class="py-12 text-center text-gray-400"
      >
        <UIcon
          name="i-lucide-loader"
          class="w-6 h-6 animate-spin mx-auto mb-2"
        />
        Memuat data...
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!filteredHomerooms.length"
        class="py-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700"
      >
        <UIcon
          name="i-lucide-user-x"
          class="w-10 h-10 mx-auto text-gray-300 mb-2"
        />
        <p class="text-sm text-gray-500">
          Belum ada penetapan wali kelas.
        </p>
        <UButton
          icon="i-lucide-user-plus"
          color="primary"
          size="sm"
          class="mt-3 cursor-pointer"
          @click="openCreateHomeroom"
        >
          Assign Wali Kelas
        </UButton>
      </div>

      <!-- Homeroom Card Grid -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <UCard
          v-for="hm in filteredHomerooms"
          :key="hm.id"
          class="hover:shadow-md transition-shadow"
        >
          <!-- Class Header -->
          <div class="flex items-start gap-3">
            <div class="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 shrink-0">
              <UIcon
                name="i-lucide-school"
                class="w-5 h-5"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <p class="font-bold text-gray-900 dark:text-white truncate">
                  Kelas {{ hm.classroom?.name || '-' }}
                </p>
                <UBadge
                  color="neutral"
                  variant="subtle"
                  size="xs"
                  class="shrink-0"
                >
                  Tingkat {{ hm.classroom?.level }}
                </UBadge>
              </div>
              <p class="text-xs text-gray-400 mt-0.5">
                {{ hm.semester?.type }} {{ hm.semester?.academicYear?.name || '' }}
              </p>
            </div>
          </div>

          <!-- Teacher info -->
          <div class="mt-4 flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
            <UAvatar
              size="sm"
              :alt="hm.teacher?.user?.fullname || 'Wali'"
            />
            <div class="min-w-0">
              <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {{ hm.teacher?.user?.fullname || '-' }}
              </p>
              <p class="text-xs text-gray-400 font-mono">
                NIP: {{ hm.teacher?.nip || '-' }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 mt-4">
            <UButton
              size="sm"
              color="neutral"
              variant="soft"
              icon="i-lucide-edit-3"
              class="flex-1 cursor-pointer"
              @click="openEditHomeroom(hm)"
            >
              Ganti
            </UButton>
            <UButton
              size="sm"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              class="cursor-pointer"
              @click="openDeleteHomeroom(hm)"
            />
          </div>
        </UCard>
      </div>
    </div>

    <!-- ====== Semua Dialog ====== -->
    <TeachingAssignmentsDialogsTeachingAssignmentCreateDialog />
    <TeachingAssignmentsDialogsTeachingAssignmentEditDialog />

    <HomeroomsDialogsHomeroomCreateDialog />
    <HomeroomsDialogsHomeroomEditDialog />
    <HomeroomsDialogsHomeroomDeleteDialog />
  </div>
</template>
