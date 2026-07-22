import { z } from 'zod'

export const semesterTypeSchema = z.enum([
  'GANJIL',
  'GENAP'
])

export const semesterSchema = z.object({
  id: z.string().default(''),

  academicYearId: z.string().min(1, 'Tahun ajaran wajib dipilih'),

  type: semesterTypeSchema,

  isActive: z.boolean().default(false),

  isLocked: z.boolean().default(false),

  createdAt: z.string().default(''),

  updatedAt: z.string().default(''),

  academicYear: z.object({
    id: z.string().uuid(),
    name: z.string()
  })
})

export type SemesterSchema = z.infer<typeof semesterSchema>

export const createSemesterSchema = z.object({
  academicYearId: z
    .string({
      error: 'Tahun ajaran wajib dipilih.'
    })
    .uuid(),

  type: semesterTypeSchema,

  isActive: z.boolean().default(false),

  isLocked: z.boolean().default(false)
})

export type CreateSemesterSchema = z.infer<typeof createSemesterSchema>

export const updateSemesterSchema = createSemesterSchema.partial()

export type UpdateSemesterSchema = z.infer<typeof updateSemesterSchema>

export const semesterFilterSchema = z.object({
  search: z.string().optional(),

  academicYearId: z.string().uuid().optional(),

  isActive: z.boolean().optional(),

  page: z.coerce.number().min(1).default(1),

  limit: z.coerce.number().min(1).max(100).default(10)
})

export type SemesterFilterSchema = z.infer<typeof semesterFilterSchema>

export const semesterTableSchema = semesterSchema.extend({
  academicYear: z.object({
    id: z.string().uuid(),
    name: z.string()
  })
})

export type SemesterTableSchema = z.infer<typeof semesterTableSchema>
