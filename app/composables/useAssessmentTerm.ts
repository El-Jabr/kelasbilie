import type { MaybeRef } from 'vue'

export function useAssessmentTerm(semesterTypeRef?: MaybeRef<string | null | undefined>) {
  const activeSemester = useState<{ id?: string, type?: string, isActive?: boolean } | null>(
    'app:active-semester',
    () => null
  )

  if (!activeSemester.value && import.meta.client) {
    $fetch<{ success?: boolean, data?: { id?: string, type?: string, isActive?: boolean } }>('/api/semesters/active')
      .then((res) => {
        if (res?.data) {
          activeSemester.value = res.data
        }
      })
      .catch(() => {
        // Silently ignore if no active semester configured
      })
  }

  const isGenap = computed(() => {
    const raw = toValue(semesterTypeRef) || activeSemester.value?.type
    return String(raw || '').toUpperCase() === 'GENAP'
  })

  const sasLabel = computed(() => (isGenap.value ? 'SAT' : 'SAS'))
  const sasFullLabel = computed(() => (isGenap.value ? 'Sumatif Akhir Tahun' : 'Sumatif Akhir Semester'))
  const formulaLabel = computed(() => `50% Avg PH + 25% STS + 25% ${sasLabel.value}`)
  const examModeLabel = computed(() => `Mode Ujian STS/${sasLabel.value}`)

  return {
    isGenap,
    sasLabel,
    sasFullLabel,
    formulaLabel,
    examModeLabel,
    activeSemester
  }
}
