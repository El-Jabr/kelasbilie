import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Role } from '../prisma/generated/client'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
})

const prisma = new PrismaClient({
  adapter
})

async function main() {
  const password = await bcrypt.hash('password123', 10)

  // ===========================
  // SUPER ADMIN
  // ===========================
  await prisma.user.upsert({
    where: { email: 'superadmin@demo.com' },
    update: {},
    create: {
      fullname: 'Super Admin',
      email: 'superadmin@demo.com',
      password,
      role: Role.SUPER_ADMIN,
      moodleUserId: 1
    }
  })

  // ===========================
  // ADMIN
  // ===========================
  await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      fullname: 'Administrator',
      email: 'admin@demo.com',
      password,
      role: Role.ADMIN,
      moodleUserId: 2
    }
  })

  // ===========================
  // TEACHER
  // ===========================
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@demo.com' },
    update: {},
    create: {
      fullname: 'Pak Ahmad',
      email: 'teacher@demo.com',
      password,
      role: Role.TEACHER,
      moodleUserId: 1001
    }
  })

  await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      nip: '19870001001'
    }
  })

  // ===========================
  // STUDENT
  // ===========================
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@demo.com' },
    update: {},
    create: {
      fullname: 'Ahmad Fauzan',
      email: 'student@demo.com',
      password,
      role: Role.STUDENT,
      moodleUserId: 2001
    }
  })

  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      nis: '202600001'
    }
  })

  console.log('✅ Demo users created')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
