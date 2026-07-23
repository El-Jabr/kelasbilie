<script setup lang="ts">
definePageMeta({
  layout: 'student',
  middleware: ['auth', 'role'],
  role: 'STUDENT'
})

const { data: studentRes, status: studentStatus } = await useFetch<any>('/api/students/me')
const studentId = computed(() => studentRes.value?.data?.id)

const { data: gradesRes, status: gradesStatus, refresh } = await useAsyncData<any>(
  'student-grades',
  async () => {
    if (!studentId.value) return null
    return await $fetch(`/api/grades/student/${studentId.value}`)
  },
  {
    watch: [studentId]
  }
)

const gradesList = computed(() => gradesRes.value?.data ?? [])

function getScoreBadgeColor(score: number | null) {
  if (score === null) return 'neutral'
  if (score >= 75) return 'success'
  if (score >= 60) return 'warning'
  return 'error'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Rekapitulasi Nilai Saya</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Daftar rekapitulasi nilai per mata pelajaran untuk semester aktif.
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="outline"
        label="Muat Ulang"
        :loading="gradesStatus === 'pending'"
        @click="() => refresh()"
      />
    </div>

    <!-- Loading State -->
    <div v-if="studentStatus === 'pending' || gradesStatus === 'pending'" class="flex items-center justify-center py-16">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
      <span class="ml-2 text-gray-500">Memuat data rekapitulasi nilai...</span>
    </div>

    <template v-else>
      <UCard>
        <div v-if="gradesList.length === 0" class="py-12 text-center text-sm text-gray-400">
          Belum ada data nilai mata pelajaran untuk semester aktif ini.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="py-3 px-4">Mata Pelajaran</th>
                <th class="py-3 px-4">Guru Pengampu</th>
                <th class="py-3 px-4 text-center">PH (Harian)</th>
                <th class="py-3 px-4 text-center">STS (Tengah Sem.)</th>
                <th class="py-3 px-4 text-center">SAS (Akhir Sem.)</th>
                <th class="py-3 px-4 text-center">Nilai Akhir</th>
                <th class="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="item in gradesList" :key="item.teachingId" class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                <td class="py-3 px-4">
                  <span class="font-bold text-gray-900 dark:text-white block">{{ item.subjectName }}</span>
                  <span class="text-xs text-gray-500 font-mono">{{ item.subjectCode }} ({{ item.classroomName }})</span>
                </td>
                <td class="py-3 px-4 text-gray-700 dark:text-gray-300">
                  {{ item.teacherName || '-' }}
                </td>
                <td class="py-3 px-4 text-center">
                  <UBadge :color="getScoreBadgeColor(item.grades?.PH ?? null)" variant="subtle" size="md">
                    {{ item.grades?.PH ?? '-' }}
                  </UBadge>
                </td>
                <td class="py-3 px-4 text-center">
                  <UBadge :color="getScoreBadgeColor(item.grades?.STS ?? null)" variant="subtle" size="md">
                    {{ item.grades?.STS ?? '-' }}
                  </UBadge>
                </td>
                <td class="py-3 px-4 text-center">
                  <UBadge :color="getScoreBadgeColor(item.grades?.SAS ?? null)" variant="subtle" size="md">
                    {{ item.grades?.SAS ?? '-' }}
                  </UBadge>
                </td>
                <td class="py-3 px-4 text-center font-bold text-base">
                  <span v-if="item.finalScore !== null" :class="item.finalScore >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
                    {{ item.finalScore }}
                  </span>
                  <span v-else class="text-gray-400 font-normal text-sm">-</span>
                </td>
                <td class="py-3 px-4 text-right">
                  <UButton
                    :to="`/student/grades/${item.teachingId}`"
                    icon="i-lucide-eye"
                    color="primary"
                    variant="ghost"
                    size="xs"
                    label="Detail Rincian"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </template>
  </div>
</template>
