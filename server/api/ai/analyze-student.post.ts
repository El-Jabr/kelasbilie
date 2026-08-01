import { prisma } from '../../utils/db'
import { callGeminiApi, generateDataHash } from '../../utils/ai'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN', 'TEACHER'])
  
  const body = await readBody(event)
  const { studentId, semesterId, forceRefresh } = body

  if (!studentId) {
    throw createError({ statusCode: 400, statusMessage: 'studentId diperlukan' })
  }

  // 1. Ambil data siswa
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true }
  })

  if (!student) {
    throw createError({ statusCode: 404, statusMessage: 'Siswa tidak ditemukan' })
  }

  // 2. Ambil data kelas dan semester
  let activeSemesterId = semesterId
  
  if (!activeSemesterId) {
    const activeSemester = await prisma.semester.findFirst({
      where: { isActive: true }
    })
    if (activeSemester) activeSemesterId = activeSemester.id
  }

  if (!activeSemesterId) {
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada semester aktif' })
  }

  const studentClass = await prisma.studentClass.findUnique({
    where: { studentId_semesterId: { studentId, semesterId: activeSemesterId } },
    include: { classroom: true, semester: { include: { academicYear: true } } }
  })

  if (!studentClass) {
    throw createError({ statusCode: 404, statusMessage: 'Siswa tidak terdaftar di kelas pada semester ini' })
  }

  // 3. Ambil riwayat nilai siswa (semua semester yang ada datanya)
  const allGrades = await prisma.gradeSummary.findMany({
    where: { studentId },
    include: { 
      teaching: { include: { subject: true } },
      semester: { include: { academicYear: true } }
    }
  })

  const currentGrades = allGrades.filter(g => g.semesterId === activeSemesterId)
  
  const subjectsMap = new Map()
  
  // Kelompokkan nilai semester ini per mapel
  const gradesBySubject: any = {}
  for (const g of currentGrades) {
    const mapel = g.teaching.subject.name
    subjectsMap.set(g.teachingId, mapel)
    
    if (!gradesBySubject[mapel]) {
      gradesBySubject[mapel] = { ph: 0, sts: 0, sas: 0, kkm: g.teaching.subject.kkm }
    }
    
    if (g.category === 'PH') gradesBySubject[mapel].ph = g.score
    if (g.category === 'STS') gradesBySubject[mapel].sts = g.score
    if (g.category === 'SAS') gradesBySubject[mapel].sas = g.score
    
    gradesBySubject[mapel].finalScore = Math.round(
      (gradesBySubject[mapel].ph * 0.4) + 
      (gradesBySubject[mapel].sts * 0.3) + 
      (gradesBySubject[mapel].sas * 0.3)
    )
  }

  // 4. Data untuk AI
  const dataForAi = {
    studentName: student.user.fullname,
    nis: student.nis,
    classroom: studentClass.classroom.name,
    semester: `${studentClass.semester.type} ${studentClass.semester.academicYear.name}`,
    currentGrades: gradesBySubject
  }

  const dataHash = generateDataHash(dataForAi)

  // 5. Cek Cache
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

  // 6. Siapkan Prompt
  const prompt = `Kamu adalah konsultan akademik. Analisis perkembangan akademik satu siswa berikut.

DATA SISWA:
- Nama: ${dataForAi.studentName}
- NIS: ${dataForAi.nis}
- Kelas: ${dataForAi.classroom}
- Semester Aktif: ${dataForAi.semester}

NILAI SEMESTER AKTIF PER MAPEL:
${JSON.stringify(dataForAi.currentGrades, null, 2)}

Output dalam JSON (HANYA JSON, tanpa markdown):
{
  "statusUmum": "baik|perlu_perhatian|kritis",
  "narasi": "2-3 kalimat perkembangan siswa, sebutkan kelebihan dan kekurangannya secara jelas",
  "kekuatan": ["mapel/aspek kuat 1", "..."],
  "kelemahan": ["mapel/aspek lemah 1", "..."],
  "tren": "meningkat|stabil|menurun",
  "rekomendasi": [
    { "tipe": "remedial|pengayaan|motivasi|orang_tua", "mapel": "...", "tindakan": "..." }
  ]
}`

  // 7. Panggil AI
  let aiResultString = await callGeminiApi(prompt)
  
  // Ekstrak JSON menggunakan regex untuk mengatasi teks tambahan dari AI
  const match = aiResultString.match(/\{[\s\S]*\}/)
  if (match) {
    aiResultString = match[0]
  }

  let aiResultJson
  try {
    aiResultJson = JSON.parse(aiResultString)
  } catch (e) {
    console.error('Failed to parse Gemini output:', aiResultString)
    throw createError({ statusCode: 500, statusMessage: 'AI mengembalikan format yang tidak valid.' })
  }

  // 8. Simpan ke Cache
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

  return {
    success: true,
    cached: false,
    generatedAt: new Date(),
    data: aiResultJson
  }
})
