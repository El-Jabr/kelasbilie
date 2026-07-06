<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

interface MoodleCourse {
  id: number
  fullname: string
  categoryid: number
}

const UButton = resolveComponent('UButton')

const loading = ref(false)

const courseSections = {
  headline: 'Course Moodle',
  title: 'Course Moodle',
  description: 'Kursus yang tersedia di Moodle Sekolah'
}

const courses = ref<MoodleCourse[]>([])

async function syncCourses() {
  loading.value = true
  const setting = await $fetch('/api/moodle')
  const moodle_url = setting?.moodleUrl
  const moodle_token = setting?.moodleToken
  const api_function = 'core_course_get_courses'

  try {
    // Contoh memanggil API Nuxt Anda
    const data = await $fetch<MoodleCourse[]>(`${moodle_url}/webservice/rest/server.php?wstoken=${moodle_token}&wsfunction=${api_function}&moodlewsrestformat=json`)

    courses.value = data
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const columns: TableColumn<MoodleCourse>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'ID',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-arrow-up-narrow-wide'
            : 'i-lucide-arrow-down-wide-narrow'
          : 'i-lucide-arrow-up-down',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    }
  },
  { accessorKey: 'fullname', header: 'NAMA KURSUS' }
]
</script>

<template>
  <div>
    <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-3xl mx-auto mt-4">
      <UContainer class="flex justify-between items-center border border-gray-300 bg-gray-100 py-1 rounded-xl">
        <h1>
          Klik Sinkronasi untuk melihat Kursus moodle yang tersedia
        </h1>
        <UButton
          label="Sync Now"
          class="w-fit"
          :loading="loading"
          @click="syncCourses"
        />
      </UContainer>
    </div>
    <UPageSection
      id="Course_Sections"
      :headline="courseSections.headline"
      :title="courseSections.title"
      :description="courseSections.description"
    >
      <UContainer class="border border-gray-200 py-2 rounded-2xl">
        <UTable
          ref="table"
          class="shrink-0"
          :data="courses"
          :columns="columns"
          :ui="{
            base: 'table-fixed border-separate border-spacing-0',
            thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
            tbody: '[&>tr]:last:[&>td]:border-b-0',
            th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
            td: 'border-b border-default',
            separator: 'h-0'
          }"
        />
      </UContainer>
    </UPageSection>
  </div>
</template>
