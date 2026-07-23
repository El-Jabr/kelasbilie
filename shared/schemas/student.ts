import { z } from 'zod'

const userSummarySchema = z.object({
  id: z.string(),
  username: z.string(),
  fullname: z.string()
})

export const studentSchema = z.object({
  id: z.string(),
  userId: z.string().uuid('Akun pengguna tidak valid.'),
  nis: z.string().trim().min(1, 'NIS wajib diisi.')
})

export type StudentSchema = z.infer<typeof studentSchema>

export const studentTableSchema = studentSchema.extend({
  user: userSummarySchema
})

export type StudentTableSchema = z.infer<typeof studentTableSchema>

export const createStudentSchema = studentSchema.omit({ id: true })
export type CreateStudentSchema = z.infer<typeof createStudentSchema>

export const updateStudentSchema = createStudentSchema.partial()
export type UpdateStudentSchema = z.infer<typeof updateStudentSchema>
