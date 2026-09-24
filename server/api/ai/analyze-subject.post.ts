import { prisma } from '../../utils/db'
import { callGeminiApi, generateDataHash } from '../../utils/ai'
import { requireRole } from '../../utils/auth'
import { logActivity } from '../../utils/logger'

export default defineEventHandler(async (event) => {
  const user = requireRole(event, ['SUPER_ADMIN', 'ADMIN', 'TEACHER'])

  const body = await readBody(event)
  const { teachingId, forceRefresh } = body

  if (!teachingId) {
    throw createError({ statusCode: 400, statusMessage: 'teachingId diperlukan' })
  }

  // 1. Ambil data penugasan
  const teaching = await prisma.teachingAssignment.findUnique({
    where: { id: teachingId },
    include: {
      teacher: { include: { user: true } },
      subject: true,
      classroom: true,
      semester: { include: { academicYear: true } }
    }
  })

  if (!teaching) {
    throw createError({ statusCode: 404, statusMessage: 'Penugasan mengajar tidak ditemukan' })
  }

  // Verifikasi jika TEACHER, harus miliknya
  if (user.role === 'TEACHER' && teaching.teacher.userId !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Anda tidak berhak menganalisis kelas ini' })
  }

  // 2. Ambil siswa di kelas ini
  const studentClasses = await prisma.studentClass.findMany({
    where: { classroomId: teaching.classroomId, semesterId: teaching.semesterId }
  })
  const totalStudents = studentClasses.length

  // 3. Ambil ringkasan nilai
  const gradeSummaries = await prisma.gradeSummary.findMany({
    where: { teachingId, semesterId: teaching.semesterId }
  })

  let belowKkmCount = 0
  const kkm = teaching.subject.kkm
  const distributionData = { ph: [] as number[], sts: [] as number[], sas: [] as number[], final: [] as number[] }

  for (const sc of studentClasses) {
    const studentGrades = gradeSummaries.filter(g => g.studentId === sc.studentId)
    const ph = studentGrades.find(g => g.category === 'PH')?.score || 0
    const sts = studentGrades.find(g => g.category === 'STS')?.score || 0
    const sas = studentGrades.find(g => g.category === 'SAS')?.score || 0

    distributionData.ph.push(ph)
    distributionData.sts.push(sts)
    distributionData.sas.push(sas)

    const finalScore = Math.round((ph * 0.4) + (sts * 0.3) + (sas * 0.3))
    distributionData.final.push(finalScore)

    if (finalScore < kkm) {
      belowKkmCount++
    }
  }

  // 4. Hitung rata-rata distribusi
  const averageDistribution = {
    ph: distributionData.ph.length ? Math.round(distributionData.ph.reduce((a, b) => a + b, 0) / distributionData.ph.length) : 0,
    sts: distributionData.sts.length ? Math.round(distributionData.sts.reduce((a, b) => a + b, 0) / distributionData.sts.length) : 0,
    sas: distributionData.sas.length ? Math.round(distributionData.sas.reduce((a, b) => a + b, 0) / distributionData.sas.length) : 0,
    final: distributionData.final.length ? Math.round(distributionData.final.reduce((a, b) => a + b, 0) / distributionData.final.length) : 0
  }

  const dataForAi = {
    subjectName: teaching.subject.name,
    teacherName: teaching.teacher.user.fullname,
    classroomName: teaching.classroom.name,
    semester: `${teaching.semester.type} ${teaching.semester.academicYear.name}`,
    kkm,
    totalStudents,
    belowKkmCount,
    averageDistribution
  }

  const dataHash = generateDataHash(dataForAi)

  // 5. Cek Cache
  if (!forceRefresh) {
    const cached = await prisma.aiAnalysisCache.findFirst({
      where: {
        type: 'subject',
        refId: teachingId,
        semesterId: teaching.semesterId
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

  // 4b. Cek data historis semester sebelumnya untuk guru & mapel & kelas ini
  const prevTeaching = await prisma.teachingAssignment.findFirst({
    where: {
      teacherId: teaching.teacherId,
      subjectId: teaching.subjectId,
      classroomId: teaching.classroomId,
      semesterId: { not: teaching.semesterId }
    },
    include: {
      semester: { include: { academicYear: true } }
    },
    orderBy: {
      semester: {
        createdAt: 'desc'
      }
    }
  })

  let prevAverageFinal: number | null = null
  let prevSemesterName: string | null = null
  let hasHistoricalData = false

  if (prevTeaching) {
    const prevGrades = await prisma.gradeSummary.findMany({
      where: { teachingId: prevTeaching.id }
    })
    const validScores = prevGrades.map(g => g.score).filter(s => s > 0)
    if (validScores.length > 0) {
      prevAverageFinal = Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 10) / 10
      prevSemesterName = `${prevTeaching.semester.type} ${prevTeaching.semester.academicYear.name}`
      hasHistoricalData = true
    }
  }

  const avgDelta = (prevAverageFinal !== null)
    ? Math.round((dataForAi.averageDistribution.final - prevAverageFinal) * 10) / 10
    : 0

  const historicalText = hasHistoricalData
    ? `DATA HISTORIS SEMESTER SEBELUMNYA (${prevSemesterName}):
- Rata-rata Nilai Akhir Sebelumnya: ${prevAverageFinal}
- Perubahan Nilai Rata-rata: ${avgDelta >= 0 ? '+' : ''}${avgDelta} poin (${avgDelta > 0 ? 'Meningkat' : (avgDelta < 0 ? 'Menurun' : 'Stabil')})`
    : 'Catatan: Belum ada data historis semester sebelumnya untuk mata pelajaran dan kelas ini.'

  const defaultCatatanTren = hasHistoricalData ? 'Ulasan perubahan performa pembelajaran dibanding semester lalu' : 'Data semester sebelumnya belum tersedia'

  // 6. Siapkan Prompt
  const prompt = `Kamu adalah konsultan pedagogi. Analisis efektivitas pembelajaran dari data nilai berikut dan bandingkan dengan historis semester sebelumnya bila ada.

MATA PELAJARAN: ${dataForAi.subjectName}
GURU: ${dataForAi.teacherName}
KELAS: ${dataForAi.classroomName} | SEMESTER: ${dataForAi.semester}
KKM: ${dataForAi.kkm}

DISTRIBUSI NILAI KELAS (Rata-rata):
- Penilaian Harian (PH): ${dataForAi.averageDistribution.ph}
- Sumatif Tengah Semester (STS): ${dataForAi.averageDistribution.sts}
- Sumatif Akhir Semester (SAS): ${dataForAi.averageDistribution.sas}
- Rata-rata Nilai Akhir: ${dataForAi.averageDistribution.final}

${historicalText}

SISWA DI BAWAH KKM: ${dataForAi.belowKkmCount} dari ${dataForAi.totalStudents} siswa

Output JSON (HANYA JSON, tanpa markdown):
{
  "efektivitas": "tinggi|sedang|rendah",
  "narasi": "2-3 kalimat evaluasi proses pembelajaran kelas ini beserta tren historisnya jika ada",
  "komparasiHistoris": {
    "adaData": ${hasHistoricalData},
    "semesterSebelumnya": ${prevSemesterName ? `"${prevSemesterName}"` : 'null'},
    "rataRataSebelumnya": ${prevAverageFinal !== null ? prevAverageFinal : 0},
    "rataRataSekarang": ${dataForAi.averageDistribution.final},
    "selisih": ${avgDelta},
    "catatanTren": "${defaultCatatanTren}"
  },
  "itemBermasalah": [
    { "nama": "Kategori yang nilainya paling anjlok (misal PH atau SAS)", "rataRata": 0.0, "saran": "..." }
  ],
  "strategiPembelajaran": [
    { "prioritas": "tinggi|sedang", "saran": "..." }
  ]
}`

  // 7. Panggil AI
  let aiResultString = await callGeminiApi(prompt)

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

  // 8. Simpan ke Cache
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24)

  await prisma.aiAnalysisCache.deleteMany({
    where: { type: 'subject', refId: teachingId, semesterId: teaching.semesterId }
  })

  await prisma.aiAnalysisCache.create({
    data: {
      type: 'subject',
      refId: teachingId,
      semesterId: teaching.semesterId,
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
    action: 'AI_ANALYZE_SUBJECT',
    description: `Analisis AI Pembelajaran Mapel ${dataForAi.subjectName} (Kelas ${dataForAi.classroomName})`,
    status: 'SUCCESS'
  })

  return {
    success: true,
    cached: false,
    generatedAt: new Date(),
    data: aiResultJson
  }
})
