import { defineStore } from 'pinia'

export const useTeacherStore = defineStore('teacher', () => {
  const teacherProfile = ref<any>(null)
  const activeSemester = ref<any>(null)
  const progressData = ref<any>(null)
  
  const isLoaded = ref(false)
  const isLoading = ref(false)
  
  let fetchPromise: Promise<void> | null = null

  async function fetchTeacherData(force = false) {
    if (isLoaded.value && !force) return
    if (fetchPromise) return fetchPromise

    isLoading.value = true

    fetchPromise = (async () => {
      try {
        const [teacherRes, semRes, progressRes]: [any, any, any] = await Promise.all([
          $fetch('/api/teachers/me').catch(() => null),
          $fetch('/api/semesters/active').catch(() => null),
          $fetch('/api/progress/teacher').catch(() => null)
        ])

        if (teacherRes?.data) teacherProfile.value = teacherRes.data
        if (semRes?.data) activeSemester.value = semRes.data
        if (progressRes) progressData.value = progressRes

        isLoaded.value = true
      } catch (err) {
        console.error('[TeacherStore] Failed to fetch data', err)
      } finally {
        isLoading.value = false
        fetchPromise = null
      }
    })()

    return fetchPromise
  }
  
  async function updateProfile(data: any) {
    if (!teacherProfile.value) return
    await $fetch(`/api/teachers/${teacherProfile.value.id}`, {
      method: 'PATCH',
      body: data
    })
    // Force refresh after update
    await fetchTeacherData(true)
  }

  function reset() {
    teacherProfile.value = null
    activeSemester.value = null
    progressData.value = null
    isLoaded.value = false
    isLoading.value = false
    fetchPromise = null
  }

  return {
    teacherProfile,
    activeSemester,
    progressData,
    isLoaded,
    isLoading,
    fetchTeacherData,
    updateProfile,
    reset
  }
})
