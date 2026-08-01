import { z } from 'zod'

export const subjectSchema = z.object({
  id: z.string(),

  code: z
    .string()
    .trim()
    .min(1, 'Kode mata pelajaran wajib diisi.'),

  name: z
    .string()
    .trim()
    .min(1, 'Nama mata pelajaran wajib diisi.'),

  kkm: z
    .number()
    .min(0, 'KKM tidak boleh kurang dari 0')
    .max(100, 'KKM tidak boleh lebih dari 100')
    .default(70),

  classroomId: z.string().optional().nullable()
})

export type SubjectSchema = z.infer<typeof subjectSchema>

export const createSubjectSchema = subjectSchema.omit({
  id: true
})

export type CreateSubjectSchema = z.infer<typeof createSubjectSchema>

export const updateSubjectSchema = createSubjectSchema.partial()

export type UpdateSubjectSchema = z.infer<typeof updateSubjectSchema>
