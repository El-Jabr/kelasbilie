import { prisma } from '../../utils/db'
import { callGeminiApi, generateDataHash } from '../../utils/ai'
import { requireRole } from '../../utils/auth'
import { logActivity } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['SUPER_ADMIN', 'ADMIN', 'TEACHER'])

  const body = await readBody(event)
  const { classroomId, semesterId, forceRefresh } = body

  if (!classroomId) {
    throw createError({ statusCode: 400, statusMessage: 'classroomId diperlukan' })
  }

  // 1. Ambil data kelas dan semester target
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId }
  })

  if (!classroom) {
    throw createError({ statusCode: 404, statusMessage: 'Kelas tidak ditemukan' })
  }

  let activeSemesterId = semesterId && semesterId !== 'ACTIVE' ? semesterId : undefined
  let semesterInfo = 'Semester Tidak Diketahui'

  if (!activeSemesterId) {
    const activeSemester = await prisma.semester.findFirst({
      where: { isActive: true },
      include: { academicYear: true }
    })
    if (activeSemester) {
      activeSemesterId = activeSemester.id
      semesterInfo = `${activeSemester.type} ${activeSemester.academicYear.name}`
    }
  } else {
    const sem = await prisma.semester.findUnique({
      where: { id: activeSemesterId },
      include: { academicYear: true }
    })
    if (sem) semesterInfo = `${sem.type} ${sem.academicYear.name}`
  }

  if (!activeSemesterId) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada semester aktif atau semester tidak ditemukan' })
  }

  // 2. Urutkan semester untuk mendapatkan semester sebelumnya
  const allSemesters = await prisma.semester.findMany({
    include: { academicYear: true },
    orderBy: [
      { academicYear: { name: 'desc' } },
      { type: 'desc' }
    ]
  })

  const targetIndex = allSemesters.findIndex(s => s.id === activeSemesterId)
  const prevSemester = (targetIndex >= 0 && targetIndex < allSemesters.length - 1)
    ? allSemesters[targetIndex + 1]
    : null

  // 3. Ambil siswa di kelas tersebut pada semester target
  const studentClasses = await prisma.studentClass.findMany({
    where: { classroomId, semesterId: activeSemesterId },
    include: {
      student: { include: { user: true } }
    }
  })
  const studentIds = studentClasses.map(sc => sc.studentId)

  // 4. Ambil penugasan mengajar (mata pelajaran) di kelas ini pada semester target
  const teachings = await prisma.teachingAssignment.findMany({
    where: { classroomId, semesterId: activeSemesterId },
    include: { subject: true }
  })

  const subjectsMap = new Map(teachings.map(t => [t.id, t.subject.name]))

  // 5. Ambil ringkasan nilai semester target
  const gradeSummaries = await prisma.gradeSummary.findMany({
    where: {
      studentId: { in: studentIds },
      teachingId: { in: Array.from(subjectsMap.keys()) },
      semesterId: activeSemesterId
    }
  })

  // 6. Ambil ringkasan nilai semester sebelumnya untuk siswa-siswa ini
  let prevClassAvg: number | null = null
  let prevSemesterName: string | null = null
  let hasHistoricalData = false

  if (prevSemester && studentIds.length > 0) {
    prevSemesterName = `${prevSemester.type} ${prevSemester.academicYear.name}`
    const prevGradeSummaries = await prisma.gradeSummary.findMany({
      where: {
        studentId: { in: studentIds },
        semesterId: prevSemester.id
      }
    })

    const prevScores = prevGradeSummaries.map(g => g.score).filter(s => s > 0)
    if (prevScores.length > 0) {
      prevClassAvg = Math.round((prevScores.reduce((a, b) => a + b, 0) / prevScores.length) * 10) / 10
      hasHistoricalData = true
    }
  }

  // Hitung nilai per siswa
  const formattedGrades = studentClasses.map((sc) => {
    const studentGrades = gradeSummaries.filter(g => g.studentId === sc.studentId)
    const gradesBySubject: Record<string, { ph: number, sts: number, sas: number, finalScore: number, kkm: number }> = {}

    for (const teaching of teachings) {
      const teachingId = teaching.id
      const ph = studentGrades.find(g => g.teachingId === teachingId && g.category === 'PH')?.score || 0
      const sts = studentGrades.find(g => g.teachingId === teachingId && g.category === 'STS')?.score || 0
      const sas = studentGrades.find(g => g.teachingId === teachingId && g.category === 'SAS')?.score || 0

      const finalScore = Math.round((ph * 0.4) + (sts * 0.3) + (sas * 0.3))

      gradesBySubject[teaching.subject.name] = {
        ph, sts, sas, finalScore, kkm: teaching.subject.kkm
      }
    }

    return {
      name: sc.student.user.fullname,
      nis: sc.student.nis,
      grades: gradesBySubject
    }
  })

  // Hitung rata-rata kelas semester ini
  const allFinalScores: number[] = []
  for (const st of formattedGrades) {
    for (const subj of Object.values(st.grades)) {
      if (subj.finalScore > 0) allFinalScores.push(subj.finalScore)
    }
  }
  const currentClassAvg = allFinalScores.length
    ? Math.round((allFinalScores.reduce((a, b) => a + b, 0) / allFinalScores.length) * 10) / 10
    : 0

  const avgDelta = (prevClassAvg !== null)
    ? Math.round((currentClassAvg - prevClassAvg) * 10) / 10
    : 0

  // Format data untuk AI
  const dataForAi = {
    class: classroom.name,
    semester: semesterInfo,
    studentsCount: studentClasses.length,
    subjects: Array.from(subjectsMap.values()),
    currentClassAvg,
    hasHistoricalData,
    prevSemesterName,
    prevClassAvg,
    avgDelta,
    grades: formattedGrades
  }

  const dataHash = generateDataHash(dataForAi)

  // 7. Cek Cache
  if (!forceRefresh) {
    const cached = await prisma.aiAnalysisCache.findFirst({
      where: {
        type: 'class',
        refId: classroomId,
        semesterId: activeSemesterId
      },
      orderBy: { generatedAt: 'desc' }
    })

    if (cached) {
      if (cached.dataHash === dataHash && cached.expiresAt > new Date()) {
        return {
          success: true,
          cached: true,
          generatedAt: cached.generatedAt,
          data: JSON.parse(cached.result)
        }
      }
    }
  }

  const historicalText = hasHistoricalData
    ? `DATA HISTORIS SEMESTER SEBELUMNYA (${prevSemesterName}):
- Rata-rata Kelas Sebelumnya: ${prevClassAvg}
- Perubahan Nilai: ${avgDelta >= 0 ? '+' : ''}${avgDelta} poin (${avgDelta > 0 ? 'Meningkat' : (avgDelta < 0 ? 'Menurun' : 'Stabil')})`
    : 'Catatan: Belum ada data nilai semester sebelumnya untuk komparasi historis.'

  const statusPerubahan = avgDelta > 0 ? 'meningkat' : (avgDelta < 0 ? 'menurun' : 'stabil')
  const defaultCatatanTren = hasHistoricalData ? 'Ulasan perubahan tren performa kelas dibanding semester lalu' : 'Data semester sebelumnya belum tersedia'

  // 8. Siapkan Prompt
  const prompt = `Kamu adalah konsultan akademik untuk sekolah menengah di Indonesia.
Analisis data nilai berikut dan berikan rekomendasi yang spesifik, termasuk perbandingan historis dengan semester sebelumnya bila data tersedia.

DATA KELAS:
- Nama Kelas: ${dataForAi.class}
- Semester: ${dataForAi.semester}
- Total Siswa: ${dataForAi.studentsCount}
- Rata-rata Kelas Saat Ini: ${currentClassAvg}

${historicalText}

DATA NILAI SISWA (JSON):
${JSON.stringify(dataForAi.grades, null, 2)}

Berikan analisis dalam format JSON berikut (HANYA JSON, tanpa markdown code block apapun, langsung objek JSON):
{
  "ringkasan": {
    "rataRataKelas": ${currentClassAvg},
    "jumlahLulus": 0,
    "jumlahRemidi": 0,
    "mapelTerlemah": "nama mapel",
    "mapelTerkuat": "nama mapel"
  },
  "komparasiHistoris": {
    "adaData": ${hasHistoricalData},
    "semesterSebelumnya": ${prevSemester ? `"${prevSemesterName}"` : 'null'},
    "rataRataSebelumnya": ${prevClassAvg !== null ? prevClassAvg : 0},
    "rataRataSekarang": ${currentClassAvg},
    "selisih": ${avgDelta},
    "statusPerubahan": "${statusPerubahan}",
    "catatanTren": "${defaultCatatanTren}"
  },
  "narasi": "2-3 kalimat ringkas kondisi akademik kelas, sertakan tren dibanding semester lalu bila ada",
  "siswaPerhatianKhusus": [
    { "nama": "...", "alasan": "...", "saran": "..." }
  ],
  "rekomendasiKelas": [
    { "prioritas": "tinggi|sedang|rendah", "tindakan": "...", "mapel": "..." }
  ]
}`

  // 9. Panggil AI
  let aiResultString = await callGeminiApi(prompt)

  // Ekstrak JSON menggunakan regex untuk mengatasi teks tambahan dari AI
  const match = aiResultString.match(/\{[\s\S]*\}/)
  if (match) {
    aiResultString = match[0]
  }

  let aiResultJson
  try {
    aiResultJson = JSON.parse(aiResultString)
  } catch {
    throw createError({ statusCode: 500, statusMessage: 'AI mengembalikan format yang tidak valid.', data: { rawOutput: aiResultString } })
  }

  // 10. Simpan ke Cache
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  await prisma.aiAnalysisCache.deleteMany({
    where: { type: 'class', refId: classroomId, semesterId: activeSemesterId }
  })

  await prisma.aiAnalysisCache.create({
    data: {
      type: 'class',
      refId: classroomId,
      semesterId: activeSemesterId,
      dataHash,
      result: JSON.stringify(aiResultJson),
      expiresAt
    }
  })

  await logActivity({
    event,
    userId: user.id,
    userName: user.fullname,
    category: 'SYSTEM',
    action: 'AI_ANALYZE_CLASS',
    description: `Analisis AI Performa Kelas ${dataForAi.class} (${dataForAi.semester})`,
    status: 'SUCCESS'
  })

  return {
    success: true,
    cached: false,
    generatedAt: new Date(),
    data: aiResultJson
  }
})
