<script setup lang="ts">
import { ref, computed } from 'vue'

export interface SubjectScoreItem {
  subjectName: string
  subjectCode: string
  finalScore: number
  kkm: number
  isPassed: boolean
}

export interface SemesterProgressionItem {
  semesterId: string
  semesterName: string
  shortLabel: string
  academicYear: string
  type: 'GANJIL' | 'GENAP'
  isActive: boolean
  className: string
  hasGrades: boolean
  averageScore: number
  totalSubjects: number
  passedSubjectsCount: number
  highestScore: number
  lowestScore: number
  deltaFromPrevious: number | null
  trend: 'up' | 'down' | 'neutral' | 'none'
  subjects: SubjectScoreItem[]
}

export interface ProgressionData {
  student?: {
    id: string
    nis: string
    fullname: string
  }
  overallStats?: {
    totalSemesters: number
    gradedSemestersCount: number
    latestAverage: number
    highestAverage: number
    firstAverage: number
    overallDelta: number
    overallTrend: 'up' | 'down' | 'neutral' | 'none'
  }
  history?: SemesterProgressionItem[]
}

const props = defineProps<{
  progression: ProgressionData | null
  loading?: boolean
}>()

const isDetailModalOpen = ref(false)
const hoveredIndex = ref<number | null>(null)

// Semester yang memiliki nilai
const gradedHistory = computed(() => {
  return (props.progression?.history || []).filter(h => h.hasGrades && h.averageScore > 0)
})

const overallStats = computed(() => props.progression?.overallStats ?? null)

// Dimensi Sparkline Mini SVG
const sparkWidth = 200
const sparkHeight = 44
const pad = { top: 8, right: 12, bottom: 8, left: 12 }
const plotW = sparkWidth - pad.left - pad.right
const plotH = sparkHeight - pad.top - pad.bottom

// Skala nilai (min 50, max 100)
const minScoreVal = computed(() => {
  if (!gradedHistory.value.length) return 50
  const min = Math.min(...gradedHistory.value.map(h => h.averageScore))
  return Math.max(0, Math.min(50, Math.floor((min - 10) / 10) * 10))
})
const maxScoreVal = 100

function getSparkY(score: number): number {
  const range = maxScoreVal - minScoreVal.value
  if (range <= 0) return pad.top + plotH / 2
  const ratio = (score - minScoreVal.value) / range
  return pad.top + plotH - (ratio * plotH)
}

function getSparkX(idx: number): number {
  const n = gradedHistory.value.length
  if (n <= 1) return pad.left + plotW / 2
  return pad.left + (idx / (n - 1)) * plotW
}

const sparkPoints = computed(() => {
  return gradedHistory.value.map((item, idx) => ({
    x: getSparkX(idx),
    y: getSparkY(item.averageScore),
    item,
    idx
  }))
})

// Path curve
const sparkLinePath = computed(() => {
  const pts = sparkPoints.value
  if (!pts || pts.length < 2) return ''
  const first = pts[0]
  if (!first) return ''

  let d = `M ${first.x} ${first.y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const curr = pts[i]
    const next = pts[i + 1]
    if (!curr || !next) continue
    const cx = (curr.x + next.x) / 2
    d += ` C ${cx} ${curr.y}, ${cx} ${next.y}, ${next.x} ${next.y}`
  }
  return d
})

// Area fill
const sparkAreaPath = computed(() => {
  const pts = sparkPoints.value
  if (!pts || pts.length < 2) return ''
  const first = pts[0]
  const last = pts[pts.length - 1]
  if (!first || !last) return ''

  const bottomY = pad.top + plotH
  return `${sparkLinePath.value} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`
})

const hoveredPoint = computed(() => {
  if (hoveredIndex.value === null) return null
  return sparkPoints.value[hoveredIndex.value] ?? null
})

const latestScore = computed(() => {
  if (overallStats.value?.latestAverage) return overallStats.value.latestAverage
  if (gradedHistory.value.length > 0) {
    const last = gradedHistory.value[gradedHistory.value.length - 1]
    return last?.averageScore ?? 0
  }
  return 0
})

function closeModal() {
  isDetailModalOpen.value = false
}
</script>

<template>
  <div>
    <!-- Compact 1/4 Card -->
    <UCard
      class="hover:shadow-md transition-all cursor-pointer group h-full border border-gray-100 dark:border-gray-800"
      @click="isDetailModalOpen = true"
    >
      <div class="flex items-start gap-4">
        <!-- Icon -->
        <div class="p-3.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-2xl shrink-0 border border-purple-200 dark:border-purple-800/50 group-hover:scale-105 transition-transform">
          <UIcon
            name="i-lucide-trending-up"
            class="w-7 h-7"
          />
        </div>

        <!-- Content -->
        <div class="min-w-0 flex-1 space-y-1">
          <!-- Header: Label & Trend Badge -->
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Nilai Akademik
            </p>
            <UBadge
              v-if="overallStats && overallStats.overallDelta !== 0 && gradedHistory.length >= 2"
              :color="overallStats.overallDelta > 0 ? 'success' : 'error'"
              variant="subtle"
              size="xs"
              class="font-bold"
            >
              {{ overallStats.overallDelta > 0 ? `+${overallStats.overallDelta}` : overallStats.overallDelta }}
            </UBadge>
            <UBadge
              v-else-if="gradedHistory.length === 1"
              color="neutral"
              variant="subtle"
              size="xs"
              class="font-semibold"
            >
              1 Smt
            </UBadge>
          </div>

          <!-- Main Value -->
          <div class="flex items-baseline gap-1.5">
            <h3 class="text-xl font-extrabold text-gray-900 dark:text-white truncate">
              {{ latestScore > 0 ? latestScore : '-' }}
            </h3>
            <span class="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Rata-rata
            </span>
          </div>

          <!-- Mini Sparkline SVG -->
          <div class="pt-1">
            <div
              v-if="loading"
              class="h-10 flex items-center"
            >
              <USkeleton class="h-6 w-full rounded" />
            </div>

            <div
              v-else-if="gradedHistory.length >= 2"
              class="relative"
            >
              <svg
                :viewBox="`0 0 ${sparkWidth} ${sparkHeight}`"
                class="w-full h-11 overflow-visible select-none"
              >
                <defs>
                  <linearGradient
                    id="sparkGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stop-color="#8b5cf6"
                      stop-opacity="0.35"
                    />
                    <stop
                      offset="100%"
                      stop-color="#8b5cf6"
                      stop-opacity="0.0"
                    />
                  </linearGradient>
                </defs>

                <!-- Guideline KKM 75 -->
                <line
                  :x1="pad.left"
                  :y1="getSparkY(75)"
                  :x2="sparkWidth - pad.right"
                  :y2="getSparkY(75)"
                  stroke="#f59e0b"
                  stroke-dasharray="2 2"
                  stroke-width="1"
                  stroke-opacity="0.5"
                />

                <!-- Area Fill -->
                <path
                  v-if="sparkAreaPath"
                  :d="sparkAreaPath"
                  fill="url(#sparkGradient)"
                />

                <!-- Curve Line -->
                <path
                  v-if="sparkLinePath"
                  :d="sparkLinePath"
                  fill="none"
                  stroke="#8b5cf6"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />

                <!-- Dots -->
                <g
                  v-for="(pt, i) in sparkPoints"
                  :key="i"
                >
                  <circle
                    :cx="pt.x"
                    :cy="pt.y"
                    :r="hoveredIndex === i ? 4.5 : 3"
                    fill="white"
                    stroke="#8b5cf6"
                    :stroke-width="hoveredIndex === i ? 2.5 : 1.5"
                    class="transition-all cursor-pointer"
                    @mouseenter.stop="hoveredIndex = i"
                    @mouseleave.stop="hoveredIndex = null"
                  />
                </g>
              </svg>

              <!-- Hover Tooltip -->
              <div
                v-if="hoveredPoint"
                class="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-gray-900 text-white text-[10px] font-bold rounded shadow pointer-events-none whitespace-nowrap z-10"
              >
                {{ hoveredPoint.item.shortLabel }}: {{ hoveredPoint.item.averageScore }}
              </div>
            </div>

            <!-- Single Semester Point -->
            <div
              v-else-if="gradedHistory.length === 1"
              class="flex items-center gap-2 py-1 text-xs text-gray-500 dark:text-gray-400"
            >
              <span class="w-2 h-2 rounded-full bg-purple-500 inline-block" />
              <span>Semester {{ gradedHistory[0]?.shortLabel }} tercatat</span>
            </div>

            <!-- Empty State -->
            <div
              v-else
              class="py-1 text-[11px] text-gray-400 dark:text-gray-500 italic"
            >
              Belum ada riwayat semester
            </div>
          </div>

          <!-- Bottom Summary -->
          <div class="text-[11px] text-gray-500 dark:text-gray-400 pt-0.5 font-medium flex items-center justify-between">
            <span>{{ gradedHistory.length }} Semester</span>
            <span
              v-if="overallStats?.highestAverage"
              class="text-purple-600 dark:text-purple-400 font-semibold"
            >
              Rekor: {{ overallStats.highestAverage }}
            </span>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Modal Detail Perkembangan Semester ke Semester -->
    <UModal
      v-model:open="isDetailModalOpen"
      title="Grafik Perkembangan Nilai Akademik Siswa"
    >
      <template #body>
        <div class="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <!-- Summary Cards in Modal -->
          <div class="grid grid-cols-3 gap-2">
            <div class="p-3 bg-purple-50/70 dark:bg-purple-950/30 rounded-xl border border-purple-200/60 dark:border-purple-800/40 text-center">
              <p class="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                Rata-rata Terkini
              </p>
              <p class="text-xl font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">
                {{ latestScore || '-' }}
              </p>
            </div>
            <div class="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 text-center">
              <p class="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                Nilai Tertinggi
              </p>
              <p class="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {{ overallStats?.highestAverage || '-' }}
              </p>
            </div>
            <div class="p-3 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-800/40 text-center">
              <p class="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                Total Semester
              </p>
              <p class="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                {{ gradedHistory.length }}
              </p>
            </div>
          </div>

          <!-- Timeline of Semesters -->
          <div class="space-y-3 pt-2">
            <h4 class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Riwayat Nilai per Semester
            </h4>

            <div
              v-if="!gradedHistory.length"
              class="p-6 text-center text-xs text-gray-500 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700"
            >
              Belum ada data rekap nilai yang tercatat pada semester mana pun.
            </div>

            <div
              v-for="(item, idx) in gradedHistory"
              :key="idx"
              class="p-4 rounded-xl border border-gray-100 dark:border-gray-700/80 bg-gray-50/60 dark:bg-gray-800/40 space-y-2.5"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-600 text-white">
                    {{ item.semesterName }}
                  </span>
                  <span
                    v-if="item.className"
                    class="text-xs text-gray-600 dark:text-gray-400 font-medium"
                  >
                    Kelas {{ item.className }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span
                    v-if="item.deltaFromPrevious !== null"
                    class="text-xs font-extrabold px-2 py-0.5 rounded-full"
                    :class="item.deltaFromPrevious > 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : (item.deltaFromPrevious < 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200')"
                  >
                    {{ item.deltaFromPrevious > 0 ? `+${item.deltaFromPrevious}` : item.deltaFromPrevious }}
                  </span>
                  <span class="text-base font-black text-gray-900 dark:text-white">
                    {{ item.averageScore }}
                  </span>
                </div>
              </div>

              <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200/50 dark:border-gray-700/50">
                <span>Tuntas: {{ item.passedSubjectsCount }} / {{ item.totalSubjects }} Mapel</span>
                <span>Tertinggi: {{ item.highestScore || '-' }} • Terendah: {{ item.lowestScore || '-' }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex justify-end">
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            @click="closeModal"
          >
            Tutup
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
