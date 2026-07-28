<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

useSeoMeta({
  title: 'Pembagian Kelas Siswa'
})

const { pagination, refreshSC, loadSupportingData } = useStudentClasses()
const { openSingleCreateModal } = useStudentClassDialogs()

const activeTab = ref('plotting') // Default to 'plotting' for easy bulk allocation

onMounted(async () => {
  await Promise.all([
    refreshSC(),
    loadSupportingData()
  ])
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <UIcon name="i-lucide-users" class="w-7 h-7 text-emerald-500" />
          Pembagian Kelas Siswa (Rombel)
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Alokasikan rombongan belajar siswa per semester secara massal, plotting transfer list, atau clone semester.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          type="button"
          icon="i-lucide-layers"
          color="success"
          variant="solid"
          class="cursor-pointer font-bold shadow-sm"
          @click="() => { activeTab = 'plotting' }"
        >
          🚀 Plotting Massal Rombel
        </UButton>

        <UButton
          type="button"
          icon="i-lucide-user-plus"
          color="neutral"
          variant="soft"
          class="cursor-pointer"
          @click="openSingleCreateModal"
        >
          Daftarkan 1 Siswa
        </UButton>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex border-b border-gray-200 dark:border-gray-700 gap-4 text-sm font-medium overflow-x-auto">
      <button
        type="button"
        class="pb-3 pt-1 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
        :class="activeTab === 'plotting' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
        @click="activeTab = 'plotting'"
      >
        <UIcon name="i-lucide-arrow-right-left" class="w-4 h-4" />
        Plotting Rombel (Transfer List)
      </button>

      <button
        type="button"
        class="pb-3 pt-1 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
        :class="activeTab === 'table' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
        @click="activeTab = 'table'"
      >
        <UIcon name="i-lucide-table" class="w-4 h-4" />
        Daftar Pembagian Kelas ({{ pagination.total }})
      </button>

      <button
        type="button"
        class="pb-3 pt-1 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
        :class="activeTab === 'bulk' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
        @click="activeTab = 'bulk'"
      >
        <UIcon name="i-lucide-users-round" class="w-4 h-4" />
        Bulk Assign Kelas
      </button>

      <button
        type="button"
        class="pb-3 pt-1 border-b-2 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
        :class="activeTab === 'clone' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'"
        @click="activeTab = 'clone'"
      >
        <UIcon name="i-lucide-copy" class="w-4 h-4" />
        Clone Semester (Auto Naik Kelas)
      </button>
    </div>

    <!-- TAB 1: PLOTTING ROMBEL (TRANSFER LIST) -->
    <div v-if="activeTab === 'plotting'">
      <StudentClassesFormsStudentClassPlottingForm @success="refreshSC" />
    </div>

    <!-- TAB 2: DATA TABLE -->
    <StudentClassesTableStudentClassTable v-else-if="activeTab === 'table'" />

    <!-- TAB 3: BULK ASSIGN -->
    <div v-else-if="activeTab === 'bulk'">
      <StudentClassesFormsStudentClassBulkForm @success="refreshSC" />
    </div>

    <!-- TAB 4: CLONE SEMESTER -->
    <div v-else-if="activeTab === 'clone'" class="max-w-2xl mx-auto">
      <StudentClassesFormsStudentClassCloneForm @success="refreshSC" />
    </div>

    <!-- Modal Single Add/Edit -->
    <StudentClassesDialogsStudentClassSingleDialog />
  </div>
</template>
