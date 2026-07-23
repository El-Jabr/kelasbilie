import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Role, SemesterType, GradeCategory } from '../prisma/generated/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
})

const prisma = new PrismaClient({
  adapter
})

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // 1. User Student
  const user = await prisma.user.upsert({
    where: { username: 'siswa' },
    update: {
      email: 'siswa@kelasbilie.id',
      password: hashedPassword,
      fullname: 'Andi Pratama',
      role: Role.STUDENT,
      isActive: true
    },
    create: {
      username: 'siswa',
      email: 'siswa@kelasbilie.id',
      password: hashedPassword,
      fullname: 'Andi Pratama',
      role: Role.STUDENT,
      isActive: true
    }
  })

  // 2. Student record
  let student = await prisma.student.findUnique({
    where: { userId: user.id }
  })

  if (!student) {
    student = await prisma.student.create({
      data: {
        userId: user.id,
        nis: '20240002'
      }
    })
  }

  // 3. Active Semester & Class
  const semester = await prisma.semester.findFirst({ where: { isActive: true } })
  const classroom = await prisma.classroom.findFirst({ where: { name: 'VII A' } })
  const teaching = await prisma.teachingAssignment.findFirst({
    where: { classroomId: classroom?.id, semesterId: semester?.id }
  })

  if (semester && classroom) {
    // StudentClass
    const sc = await prisma.studentClass.findFirst({
      where: { studentId: student.id, semesterId: semester.id }
    })
    if (!sc) {
      await prisma.studentClass.create({
        data: {
          studentId: student.id,
          classroomId: classroom.id,
          semesterId: semester.id
        }
      })
    }
  }

  if (teaching && semester) {
    // Mock GradeSummary
    await prisma.gradeSummary.upsert({
      where: {
        studentId_teachingId_semesterId_category: {
          studentId: student.id,
          teachingId: teaching.id,
          semesterId: semester.id,
          category: GradeCategory.PH
        }
      },
      update: { score: 85.5 },
      create: {
        studentId: student.id,
        teachingId: teaching.id,
        semesterId: semester.id,
        category: GradeCategory.PH,
        score: 85.5
      }
    })

    await prisma.gradeSummary.upsert({
      where: {
        studentId_teachingId_semesterId_category: {
          studentId: student.id,
          teachingId: teaching.id,
          semesterId: semester.id,
          category: GradeCategory.STS
        }
      },
      update: { score: 80.0 },
      create: {
        studentId: student.id,
        teachingId: teaching.id,
        semesterId: semester.id,
        category: GradeCategory.STS,
        score: 80.0
      }
    })

    await prisma.gradeSummary.upsert({
      where: {
        studentId_teachingId_semesterId_category: {
          studentId: student.id,
          teachingId: teaching.id,
          semesterId: semester.id,
          category: GradeCategory.SAS
        }
      },
      update: { score: 88.0 },
      create: {
        studentId: student.id,
        teachingId: teaching.id,
        semesterId: semester.id,
        category: GradeCategory.SAS,
        score: 88.0
      }
    })

    // Mock GradeItem & GradeComponent
    if (teaching.courseId) {
      const gradeItem = await prisma.gradeItem.upsert({
        where: { id: 9901 },
        update: { name: 'Kuis Harian 1 - Aljabar', category: GradeCategory.PH },
        create: {
          id: 9901,
          courseId: teaching.courseId,
          name: 'Kuis Harian 1 - Aljabar',
          itemType: 'quiz',
          category: GradeCategory.PH
        }
      })

      await prisma.gradeComponent.upsert({
        where: {
          studentId_gradeItemId: {
            studentId: student.id,
            gradeItemId: gradeItem.id
          }
        },
        update: { score: 85.5 },
        create: {
          studentId: student.id,
          gradeItemId: gradeItem.id,
          score: 85.5
        }
      })
    }
  }

  console.log('----------------------------------------------------')
  console.log('✅ User Siswa berhasil dibuat & dikonfigurasi!')
  console.log('📧 Email    : siswa@kelasbilie.id')
  console.log('🔑 Username : siswa')
  console.log('🔒 Password : admin123')
  console.log('👤 Nama     :', user.fullname)
  console.log('🆔 NIS      :', student.nis)
  console.log('----------------------------------------------------')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
