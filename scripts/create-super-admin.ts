import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { PrismaClient, Role } from '../prisma/generated/client'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter
})

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const username = 'superadmin'
  const email = 'superadmin@kelasbilie.id'

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      email,
      password: hashedPassword,
      fullname: 'Super Administrator',
      role: Role.SUPER_ADMIN,
      isActive: true
    },
    create: {
      username,
      email,
      password: hashedPassword,
      fullname: 'Super Administrator',
      role: Role.SUPER_ADMIN,
      isActive: true
    }
  })

  console.log('----------------------------------------------------')
  console.log('✅ User Super Admin berhasil dibuat/diperbarui!')
  console.log('📧 Email    :', user.email)
  console.log('🔑 Username :', user.username)
  console.log('🔒 Password : admin123')
  console.log('👤 Nama     :', user.fullname)
  console.log('----------------------------------------------------')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
