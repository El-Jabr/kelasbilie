import { prisma } from '../../utils/db'
import { callGeminiApi, generateDataHash } from '../../utils/ai'
import { requireRole } from '../../utils/auth'
import { logActivity } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT'])

  const body = await readBody(event)
  const { studentId, semesterId, forceRefresh } = body

  if (!studentId) {
    throw createError({ statusCode: 400, statusMessage: 'studentId diperlukan' })
  }

  // Jika role adalah STUDENT, pastikan hanya mengakses datanya sendiri
  if (user.role === 'STUDENT') {
    const currentStudent = await prisma.student.findUnique({
      where: { userId: user.id }
    })
    if (!currentStudent || currentStudent.id !== studentId) {
      throw createError({ statusCode: 403, statusMessage: 'Anda hanya dapat melihat analisis AI diri sendiri.' })
    }
  }

  // 1. Ambil data siswa
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true }
  })

  if (!student) {
    throw createError({ statusCode: 404, statusMessage: 'Siswa tidak ditemukan' })
  }

  // 2. Ambil data semester target
  let activeSemesterId = semesterId && semesterId !== 'ACTIVE' ? semesterId : undefined

  if (!activeSemesterId) {
    const activeSemester = await prisma.semester.findFirst({
      where: { isActive: true }
    })
    if (activeSemester) activeSemesterId = activeSemester.id
  }

  if (!activeSemesterId) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada semester aktif atau semester yang dipilih tidak ditemukan' })
  }

  const studentClass = await prisma.studentClass.findUnique({
    where: { studentId_semesterId: { studentId, semesterId: activeSemesterId } },
    include: { classroom: true, semester: { include: { academicYear: true } } }
  })

  if (!studentClass) {
    throw createError({ statusCode: 404, statusMessage: 'Siswa tidak terdaftar di kelas pada semester yang dipilih' })
  }

  // 3. Urutkan semua semester untuk menemukan semester sebelumnya secara akurat
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

  // 4. Ambil riwayat nilai siswa
  const allGrades = await prisma.gradeSummary.findMany({
    where: { studentId },
    include: {
      teaching: { include: { subject: true } },
      semester: { include: { academicYear: true } }
    }
  })

  const currentGrades = allGrades.filter(g => g.semesterId === activeSemesterId)
  const prevGrades = prevSemester ? allGrades.filter(g => g.semesterId === prevSemester.id) : []

  // Format nilai semester target per mapel
  const gradesBySubject: Record<string, { ph: number, sts: number, sas: number, finalScore: number, kkm: number }> = {}
  for (const g of currentGrades) {
    const mapel = g.teaching.subject.name
    if (!gradesBySubject[mapel]) {
      gradesBySubject[mapel] = { ph: 0, sts: 0, sas: 0, finalScore: 0, kkm: g.teaching.subject.kkm }
    }
    if (g.category === 'PH') gradesBySubject[mapel].ph = g.score
    if (g.category === 'STS') gradesBySubject[mapel].sts = g.score
    if (g.category === 'SAS') gradesBySubject[mapel].sas = g.score
    gradesBySubject[mapel].finalScore = Math.round(
      (gradesBySubject[mapel].ph * 0.4)
      + (gradesBySubject[mapel].sts * 0.3)
      + (gradesBySubject[mapel].sas * 0.3)
    )
  }

  // Format nilai semester sebelumnya per mapel
  const prevGradesBySubject: Record<string, { ph: number, sts: number, sas: number, finalScore: number, kkm: number }> = {}
  for (const g of prevGrades) {
    const mapel = g.teaching.subject.name
    if (!prevGradesBySubject[mapel]) {
      prevGradesBySubject[mapel] = { ph: 0, sts: 0, sas: 0, finalScore: 0, kkm: g.teaching.subject.kkm }
    }
    if (g.category === 'PH') prevGradesBySubject[mapel].ph = g.score
    if (g.category === 'STS') prevGradesBySubject[mapel].sts = g.score
    if (g.category === 'SAS') prevGradesBySubject[mapel].sas = g.score
    prevGradesBySubject[mapel].finalScore = Math.round(
      (prevGradesBySubject[mapel].ph * 0.4)
      + (prevGradesBySubject[mapel].sts * 0.3)
      + (prevGradesBySubject[mapel].sas * 0.3)
    )
  }

  // Komparasi per mapel
  const subjectComparison: Record<string, { current: number, previous: number, diff: number, trend: string }> = {}
  for (const [mapel, curr] of Object.entries(gradesBySubject)) {
    const prev = prevGradesBySubject[mapel]
    if (prev && prev.finalScore > 0) {
      const diff = curr.finalScore - prev.finalScore
      subjectComparison[mapel] = {
        current: curr.finalScore,
        previous: prev.finalScore,
        diff,
        trend: diff > 0 ? 'meningkat' : diff < 0 ? 'menurun' : 'stabil'
      }
    }
  }

  const currentScores = Object.values(gradesBySubject).map(g => g.finalScore).filter(s => s > 0)
  const currentAvg = currentScores.length ? Math.round((currentScores.reduce((a, b) => a + b, 0) / currentScores.length) * 10) / 10 : 0

  const prevScores = Object.values(prevGradesBySubject).map(g => g.finalScore).filter(s => s > 0)
  const prevAvg = prevScores.length ? Math.round((prevScores.reduce((a, b) => a + b, 0) / prevScores.length) * 10) / 10 : 0

  const hasHistoricalData = prevSemester !== null && prevScores.length > 0

  // 5. Data untuk AI
  const dataForAi = {
    studentName: student.user.fullname,
    nis: student.nis,
    classroom: studentClass.classroom.name,
    semester: `${studentClass.semester.type} ${studentClass.semester.academicYear.name}`,
    currentGrades: gradesBySubject,
    hasHistoricalData,
    previousSemesterName: prevSemester ? `${prevSemester.type} ${prevSemester.academicYear.name}` : null,
    previousGrades: prevGradesBySubject,
    historicalComparison: {
      currentAvg,
      prevAvg,
      avgDiff: Math.round((currentAvg - prevAvg) * 10) / 10,
      subjectComparison
    }
  }

  const dataHash = generateDataHash(dataForAi)

  // 6. Cek Cache
  if (!forceRefresh) {
    const cached = await prisma.aiAnalysisCache.findFirst({
      where: {
        type: 'student',
        refId: studentId,
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
    ? `DATA HISTORIS SEMESTER SEBELUMNYA (${dataForAi.previousSemesterName}):
- Rata-rata Semester Sebelumnya: ${prevAvg}
- Rata-rata Semester Sekarang: ${currentAvg}
- Selisih Rata-rata: ${dataForAi.historicalComparison.avgDiff >= 0 ? '+' : ''}${dataForAi.historicalComparison.avgDiff}
- Komparasi Per Mapel:
${JSON.stringify(dataForAi.historicalComparison.subjectComparison, null, 2)}`
    : 'Catatan: Belum ada data nilai semester sebelumnya untuk komparasi historis.'

  const statusPerubahan = currentAvg > prevAvg ? 'meningkat' : (currentAvg < prevAvg ? 'menurun' : 'stabil')
  const defaultCatatanTren = hasHistoricalData ? 'Ulasan singkat perubahan performa dibanding semester lalu' : 'Data semester sebelumnya belum tersedia'

  // 7. Siapkan Prompt
  const prompt = `Kamu adalah konsultan akademik sekolah di Indonesia. Analisis perkembangan akademik satu siswa berikut, termasuk membandingkan performanya dengan semester sebelumnya bila data tersedia.

DATA SISWA:
- Nama: ${dataForAi.studentName}
- NIS: ${dataForAi.nis}
- Kelas: ${dataForAi.classroom}
- Semester Dianalisis: ${dataForAi.semester}

NILAI SEMESTER INI PER MAPEL:
${JSON.stringify(dataForAi.currentGrades, null, 2)}

${historicalText}

Output dalam JSON (HANYA JSON murni, tanpa markdown code blocks):
{
  "statusUmum": "baik|perlu_perhatian|kritis",
  "narasi": "2-3 kalimat perkembangan siswa, evaluasi performa saat ini dan komparasi dengan semester sebelumnya jika ada",
  "kekuatan": ["mapel/aspek kuat 1", "..."],
  "kelemahan": ["mapel/aspek lemah 1", "..."],
  "tren": "meningkat|stabil|menurun",
  "komparasiHistoris": {
    "adaData": ${hasHistoricalData},
    "semesterSebelumnya": ${prevSemester ? `"${dataForAi.previousSemesterName}"` : 'null'},
    "rataRataSebelumnya": ${prevAvg},
    "rataRataSekarang": ${currentAvg},
    "selisih": ${dataForAi.historicalComparison.avgDiff},
    "statusPerubahan": "${statusPerubahan}",
    "catatanTren": "${defaultCatatanTren}"
  },
  "rekomendasi": [
    { "tipe": "remedial|pengayaan|motivasi|orang_tua", "mapel": "...", "tindakan": "..." }
  ]
}`

  // 8. Panggil AI
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
    console.error('Failed to parse Gemini output:', aiResultString)
    throw createError({ statusCode: 500, statusMessage: 'AI mengembalikan format yang tidak valid.' })
  }

  // 9. Simpan ke Cache
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  await prisma.aiAnalysisCache.deleteMany({
    where: { type: 'student', refId: studentId, semesterId: activeSemesterId }
  })

  await prisma.aiAnalysisCache.create({
    data: {
      type: 'student',
      refId: studentId,
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
    action: 'AI_ANALYZE_STUDENT',
    description: `Analisis AI Performa Siswa ${dataForAi.studentName} (Kelas ${dataForAi.classroom} - NIS: ${dataForAi.nis}) [Semester: ${dataForAi.semester}]`,
    status: 'SUCCESS'
  })

  return {
    success: true,
    cached: false,
    generatedAt: new Date(),
    data: aiResultJson
  }
})
