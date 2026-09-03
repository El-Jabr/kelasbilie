<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Kalender Akademik'
})

const { academicYears, loading: loadingYears, fetchAcademicYears } = useAcademicYears()
const { semesters, fetchSemesters } = useSemesters()
const { openCreateDialog: openCreateYear } = useAcademicYearDialogs()
const { openCreateDialog: openCreateSemester } = useSemesterDialogs()

// Accordion: menyimpan ID tahun yang sedang terbuka
const openYearIds = ref<string[]>([])

interface IAcademicYear {
  id: string
  name: string
  isActive: boolean
  isLocked: boolean
  createdAt: string
  updatedAt: string
}

interface ISemester {
  id: string
  academicYearId: string
  isActive: boolean
  isLocked: boolean
  type: 'GANJIL' | 'GENAP'
  createdAt: string
  updatedAt: string
  academicYear: { id: string, name: string }
}

const sortedYears = computed(() => {
  return [...(academicYears.value as IAcademicYear[])].sort((a, b) => {
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1
    }
    return b.name.localeCompare(a.name)
  })
})

function semestersForYear(yearId: string) {
  return (semesters.value as ISemester[]).filter(s => s.academicYearId === yearId)
}

function isOpen(yearId: string) {
  return openYearIds.value.includes(yearId)
}

function toggleYear(yearId: string) {
  const idx = openYearIds.value.indexOf(yearId)
  if (idx > -1) {
    openYearIds.value.splice(idx, 1)
  } else {
    openYearIds.value.push(yearId)
  }
}

onMounted(async () => {
  await Promise.all([fetchAcademicYears(), fetchSemesters()])
  // Buka tahun aktif secara otomatis
  const activeYear = (academicYears.value as IAcademicYear[]).find(y => y.isActive)
  if (activeYear) {
    openYearIds.value = [activeYear.id]
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
            name="i-lucide-calendar-range"
            class="w-6 h-6 text-emerald-500"
          />
          Kalender Akademik
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Kelola tahun ajaran dan semester dalam satu tampilan.
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        color="primary"
        class="cursor-pointer"
        @click="openCreateYear"
      >
        Tambah Tahun Ajaran
      </UButton>
    </div>

    <!-- Loading -->
    <div
      v-if="loadingYears"
      class="py-16 text-center text-gray-400"
    >
      <UIcon
        name="i-lucide-loader"
        class="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-500"
      />
      <p class="text-sm">
        Memuat kalender akademik...
      </p>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!sortedYears.length"
      class="py-16 text-center bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800"
    >
      <UIcon
        name="i-lucide-calendar-x"
        class="w-12 h-12 mx-auto text-gray-300 mb-3"
      />
      <p class="font-medium text-gray-700 dark:text-gray-300">
        Belum ada tahun ajaran.
      </p>
      <p class="text-sm text-gray-400 mt-1">
        Mulai dengan menambahkan tahun ajaran pertama.
      </p>
      <UButton
        icon="i-lucide-plus"
        color="primary"
        class="mt-4 cursor-pointer"
        @click="openCreateYear"
      >
        Tambah Tahun Ajaran
      </UButton>
    </div>

    <!-- Accordion: daftar tahun ajaran -->
    <div
      v-else
      class="space-y-3"
    >
      <div
        v-for="year in sortedYears"
        :key="year.id"
        class="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900 transition-shadow"
        :class="year.isActive ? 'border-emerald-200 dark:border-emerald-800/50 shadow-sm' : ''"
      >
        <!-- Year Row (Accordion Header) -->
        <div
          class="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          @click="toggleYear(year.id)"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="p-2 rounded-xl shrink-0"
              :class="year.isActive ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'"
            >
              <UIcon
                name="i-lucide-calendar"
                class="w-5 h-5"
              />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold text-gray-900 dark:text-white text-base">{{ year.name }}</span>
                <AcademicYearsBadgesAcademicYearStatusBadge :active="year.isActive" />
                <AcademicYearsBadgesAcademicYearLockBadge :locked="year.isLocked" />
              </div>
              <p class="text-xs text-gray-400 mt-0.5">
                {{ semestersForYear(year.id).length }} semester
              </p>
            </div>
          </div>
          <div
            class="flex items-center gap-2 shrink-0"
            @click.stop
          >
            <AcademicYearsTableAcademicYearActions :academic-year="year" />
            <UIcon
              :name="isOpen(year.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="w-5 h-5 text-gray-400 transition-transform"
            />
          </div>
        </div>

        <!-- Expanded: Semesters inside this year -->
        <div
          v-if="isOpen(year.id)"
          class="border-t border-gray-100 dark:border-gray-800 px-5 pb-4 pt-3"
        >
          <!-- Semester list -->
          <div class="space-y-2 mb-3">
            <div
              v-for="sem in semestersForYear(year.id)"
              :key="sem.id"
              class="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/50"
            >
              <div class="flex items-center gap-3 flex-wrap">
                <SemestersBadgesSemesterTypeBadge :type="sem.type" />
                <SemestersBadgesSemesterStatusBadge :active="sem.isActive" />
                <SemestersBadgesSemesterLockBadge :locked="sem.isLocked" />
              </div>
              <SemestersTableSemesterActions :semester="sem" />
            </div>

            <!-- No semesters yet -->
            <div
              v-if="!semestersForYear(year.id).length"
              class="py-4 text-center text-xs text-gray-400 italic rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-dashed border-gray-200 dark:border-gray-700"
            >
              Belum ada semester untuk tahun ajaran ini.
            </div>
          </div>

          <!-- Add semester button -->
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-plus"
            class="cursor-pointer"
            @click="openCreateSemester"
          >
            Tambah Semester untuk {{ year.name }}
          </UButton>
        </div>
      </div>
    </div>

    <!-- ====== Semua Dialog ====== -->
    <AcademicYearsDialogsAcademicYearCreateDialog />
    <AcademicYearsDialogsAcademicYearEditDialog />
    <AcademicYearsDialogsAcademicYearDeleteDialog />
    <AcademicYearsDialogsAcademicYearStatusDialog />

    <SemestersDialogsSemesterCreateDialog />
    <SemestersDialogsSemesterEditDialog />
    <SemestersDialogsSemesterDeleteDialog />
    <SemestersDialogsSemesterStatusDialog />
  </div>
</template>
