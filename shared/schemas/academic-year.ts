import { z } from 'zod'

export const academicYearSchema = z.object({
  id: z
    .string(),

  name: z
    .string()
    .trim()
    .min(1, 'Tahun ajaran wajib diisi.')
    .max(9),

  createdAt: z
    .string(),

  isActive: z.boolean().default(false),

  isLocked: z.boolean().default(false)
})

export type AcademicYearSchema
  = z.infer<typeof academicYearSchema>
