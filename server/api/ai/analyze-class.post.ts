import { prisma } from '../../utils/db'
import { callGeminiApi, generateDataHash } from '../../utils/ai'
import { requireRole } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  requireRole(event, ['SUPER_ADMIN', 'ADMIN', 'TEACHER'])

  const body = await readBody(event)
  const { classroomId, semesterId, forceRefresh } = body

  if (!classroomId) {
    throw createError({ statusCode: 400, statusMessage: 'classroomId diperlukan' })
  }

  // 1. Ambil data kelas dan semester aktif
  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId }
  })

  if (!classroom) {
    throw createError({ statusCode: 404, statusMessage: 'Kelas tidak ditemukan' })
  }

  let activeSemesterId = semesterId
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
    throw createError({ statusCode: 400, statusMessage: 'Tidak ada semester aktif' })
  }

  // 2. Ambil siswa di kelas tersebut
  const studentClasses = await prisma.studentClass.findMany({
    where: { classroomId, semesterId: activeSemesterId },
    include: {
      student: { include: { user: true } }
    }
  })
  const studentIds = studentClasses.map(sc => sc.studentId)

  // 3. Ambil penugasan mengajar (mata pelajaran) di kelas ini
  const teachings = await prisma.teachingAssignment.findMany({
    where: { classroomId, semesterId: activeSemesterId },
    include: { subject: true }
  })
  
  const subjectsMap = new Map(teachings.map(t => [t.id, t.subject.name]))
  const kkmMap = new Map(teachings.map(t => [t.id, t.subject.kkm]))

  // 4. Ambil ringkasan nilai
  const gradeSummaries = await prisma.gradeSummary.findMany({
    where: {
      studentId: { in: studentIds },
      teachingId: { in: Array.from(subjectsMap.keys()) },
      semesterId: activeSemesterId
    }
  })

  // Format data untuk AI
  const dataForAi = {
    class: classroom.name,
    semester: semesterInfo,
    studentsCount: studentClasses.length,
    subjects: Array.from(subjectsMap.values()),
    grades: studentClasses.map(sc => {
      const studentGrades = gradeSummaries.filter(g => g.studentId === sc.studentId)
      const gradesBySubject: any = {}
      
      for (const teaching of teachings) {
        const teachingId = teaching.id
        const ph = studentGrades.find(g => g.teachingId === teachingId && g.category === 'PH')?.score || 0
        const sts = studentGrades.find(g => g.teachingId === teachingId && g.category === 'STS')?.score || 0
        const sas = studentGrades.find(g => g.teachingId === teachingId && g.category === 'SAS')?.score || 0
        
        // Perhitungan sederhana nilai akhir (bisa disesuaikan dengan formula sekolah)
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
  }

  const dataHash = generateDataHash(dataForAi)

  // 5. Cek Cache
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

  // 6. Siapkan Prompt
  const prompt = `Kamu adalah konsultan akademik untuk sekolah menengah di Indonesia.
Analisis data nilai berikut dan berikan rekomendasi yang spesifik dan dapat ditindaklanjuti.

DATA KELAS:
- Nama Kelas: ${dataForAi.class}
- Semester: ${dataForAi.semester}
- Total Siswa: ${dataForAi.studentsCount}

DATA NILAI SISWA (JSON):
${JSON.stringify(dataForAi.grades, null, 2)}

Berikan analisis dalam format JSON berikut (HANYA JSON, tanpa markdown code block apapun, langsung objek JSON):
{
  "ringkasan": {
    "rataRataKelas": 0.0,
    "jumlahLulus": 0,
    "jumlahRemidi": 0,
    "mapelTerlemah": "nama mapel",
    "mapelTerkuat": "nama mapel"
  },
  "narasi": "2-3 kalimat ringkas kondisi akademik kelas",
  "siswaPerhatianKhusus": [
    { "nama": "...", "alasan": "...", "saran": "..." }
  ],
  "rekomendasiKelas": [
    { "prioritas": "tinggi|sedang|rendah", "tindakan": "...", "mapel": "..." }
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
    throw createError({ statusCode: 500, statusMessage: 'AI mengembalikan format yang tidak valid.', data: { rawOutput: aiResultString } })
  }

  // 8. Simpan ke Cache
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 24) // Cache 24 jam

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

  return {
    success: true,
    cached: false,
    generatedAt: new Date(),
    data: aiResultJson
  }
})
