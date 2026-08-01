import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../prisma/generated/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('=== INSPEKSI DATA DATABASE ===')

  const activeSem = await prisma.semester.findFirst({
    where: { isActive: true },
    include: { academicYear: true }
  })
  console.log('Active Semester:', activeSem ? `${activeSem.type} (${activeSem.academicYear?.name}) - ID: ${activeSem.id}` : 'NONE')

  const classrooms = await prisma.classroom.findMany({
    take: 10,
    include: {
      students: true,
      teachings: {
        include: {
          subject: true,
          course: {
            include: {
              gradeItems: true
            }
          }
        }
      }
    }
  })

  console.log(`Jumlah Kelas: ${classrooms.length}`)
  for (const c of classrooms) {
    console.log(`\n--- Kelas: ${c.name} (ID: ${c.id}) ---`)
    console.log(`Siswa terdaftar: ${c.students.length}`)
    console.log(`Mata Pelajaran (Teachings): ${c.teachings.length}`)
    for (const t of c.teachings) {
      console.log(`  Mapel: ${t.subject.code} - ${t.subject.name} (Teaching ID: ${t.id}, Course ID: ${t.courseId})`)
      console.log(`  Course Name: ${t.course?.fullname || 'NO COURSE'}`)
      console.log(`  GradeItems Count: ${t.course?.gradeItems?.length || 0}`)
      if (t.course?.gradeItems?.length) {
        for (const gi of t.course.gradeItems) {
          console.log(`    - Item ID: ${gi.id}, Name: ${gi.name}, Category: ${gi.category || 'NULL'}`)
        }
      }
    }
  }

  const allGradeItems = await prisma.gradeItem.findMany({ take: 20 })
  console.log(`\nTotal GradeItems di DB: ${allGradeItems.length}`)

  const allGradeComponents = await prisma.gradeComponent.findMany({ take: 20 })
  console.log(`Total GradeComponents di DB: ${allGradeComponents.length}`)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
