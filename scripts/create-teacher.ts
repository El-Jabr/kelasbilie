import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Role, SemesterType } from '../prisma/generated/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
})

const prisma = new PrismaClient({
  adapter
})

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  // 1. Upsert User Guru
  const user = await prisma.user.upsert({
    where: { username: 'guru' },
    update: {
      email: 'guru@kelasbilie.id',
      password: hashedPassword,
      fullname: 'Bapak Budi Santoso, S.Pd.',
      role: Role.TEACHER,
      isActive: true
    },
    create: {
      username: 'guru',
      email: 'guru@kelasbilie.id',
      password: hashedPassword,
      fullname: 'Bapak Budi Santoso, S.Pd.',
      role: Role.TEACHER,
      isActive: true
    }
  })

  // 2. Upsert Teacher Profile
  const teacher = await prisma.teacher.upsert({
    where: { userId: user.id },
    update: {
      nip: '198501012010011001'
    },
    create: {
      userId: user.id,
      nip: '198501012010011001'
    }
  })

  // 3. Ensure Active Academic Year
  let academicYear = await prisma.academicYear.findFirst({
    where: { isActive: true }
  })
  if (!academicYear) {
    academicYear = await prisma.academicYear.create({
      data: {
        name: '2024/2025',
        isActive: true
      }
    })
  }

  // 4. Ensure Active Semester
  let semester = await prisma.semester.findFirst({
    where: { isActive: true }
  })
  if (!semester) {
    semester = await prisma.semester.create({
      data: {
        academicYearId: academicYear.id,
        type: SemesterType.GANJIL,
        isActive: true
      }
    })
  }

  // 5. Ensure Classroom
  let classroom = await prisma.classroom.findFirst({
    where: { name: 'VII A' }
  })
  if (!classroom) {
    classroom = await prisma.classroom.create({
      data: {
        name: 'VII A',
        level: 7,
        room: 'R-101',
        building: 'Gedung Utama',
        floor: 1
      }
    })
  }

  // 6. Ensure Subject
  let subject = await prisma.subject.findFirst({
    where: { code: 'MTK7' }
  })
  if (!subject) {
    subject = await prisma.subject.create({
      data: {
        code: 'MTK7',
        name: 'Matematika Kelas 7'
      }
    })
  }

  // 7. Ensure Teaching Assignment
  let teachingAssignment = await prisma.teachingAssignment.findFirst({
    where: {
      teacherId: teacher.id,
      subjectId: subject.id,
      classroomId: classroom.id,
      semesterId: semester.id
    }
  })

  if (!teachingAssignment) {
    // Check if Course exists or create dummy course
    let course = await prisma.course.findFirst()
    if (!course) {
      let category = await prisma.courseCategory.findFirst()
      if (!category) {
        category = await prisma.courseCategory.create({
          data: {
            id: 101,
            name: 'Matematika',
            depth: 1
          }
        })
      }
      course = await prisma.course.create({
        data: {
          id: 501,
          shortname: 'MTK-VIIA',
          fullname: 'Matematika VII A - 2024/2025',
          categoryId: category.id
        }
      })
    }

    teachingAssignment = await prisma.teachingAssignment.create({
      data: {
        teacherId: teacher.id,
        subjectId: subject.id,
        classroomId: classroom.id,
        semesterId: semester.id,
        courseId: course.id
      }
    })
  }

  // 8. Ensure Sample Student in Classroom
  const studentUser = await prisma.user.upsert({
    where: { username: 'siswa1' },
    update: {
      email: 'siswa1@kelasbilie.id',
      password: hashedPassword,
      fullname: 'Andi Pratama',
      role: Role.STUDENT,
      isActive: true
    },
    create: {
      username: 'siswa1',
      email: 'siswa1@kelasbilie.id',
      password: hashedPassword,
      fullname: 'Andi Pratama',
      role: Role.STUDENT,
      isActive: true
    }
  })

  const student = await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: { nis: '20240001' },
    create: {
      userId: studentUser.id,
      nis: '20240001'
    }
  })

  const studentClass = await prisma.studentClass.findFirst({
    where: {
      studentId: student.id,
      semesterId: semester.id
    }
  })
  if (!studentClass) {
    await prisma.studentClass.create({
      data: {
        studentId: student.id,
        classroomId: classroom.id,
        semesterId: semester.id
      }
    })
  }

  console.log('----------------------------------------------------')
  console.log('✅ User Guru berhasil dibuat & dikonfigurasi!')
  console.log('📧 Email    : guru@kelasbilie.id')
  console.log('🔑 Username : guru')
  console.log('🔒 Password : admin123')
  console.log('👤 Nama     :', user.fullname)
  console.log('🆔 NIP      :', teacher.nip)
  console.log('📚 Kelas    :', classroom.name, '-', subject.name)
  console.log('----------------------------------------------------')
}

main()
  .catch((err) => {
    console.error('❌ Error creating teacher user:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
