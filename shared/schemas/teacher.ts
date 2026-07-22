import { z } from 'zod'

const userSummarySchema = z.object({
  id: z.string(),
  username: z.string(),
  fullname: z.string()
})

export const teacherSchema = z.object({
  id: z.string(),
  userId: z.string().uuid('Akun pengguna tidak valid.'),
  nip: z.string().trim().min(1, 'NIP wajib diisi.')
})

export type TeacherSchema = z.infer<typeof teacherSchema>

export const teacherTableSchema = teacherSchema.extend({
  user: userSummarySchema
})

export type TeacherTableSchema = z.infer<typeof teacherTableSchema>

export const createTeacherSchema = teacherSchema.omit({ id: true })
export type CreateTeacherSchema = z.infer<typeof createTeacherSchema>

export const updateTeacherSchema = createTeacherSchema.partial()
export type UpdateTeacherSchema = z.infer<typeof updateTeacherSchema>
