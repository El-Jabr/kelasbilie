<<<<<<< HEAD
import bcrypt from 'bcryptjs'
import { prisma } from '../../utils/db'

type UserRole = 'ADMIN' | 'STUDENT' | 'TEACHER'
interface user {
  username: string
  fullname: string
  email?: string
  password: string
  role: UserRole
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<user>(event)
=======
import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ name: string, email: string }>(event)
>>>>>>> 6241400dd781327f55c768d022ee5ccb1736bca1
    if (!body.email) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email is required'
      })
    }
<<<<<<< HEAD

    const password = await bcrypt.hash(body.password, 10)
    const user = await prisma.user.create({
      data: {
        username: body.username,
        fullname: body.fullname,
        email: body.email || '',
        password: password,
        role: body.role
=======
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email
>>>>>>> 6241400dd781327f55c768d022ee5ccb1736bca1
      }
    })
    return user
  } catch (error) {
    console.error('Error creating user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create user'
    })
  }
})
