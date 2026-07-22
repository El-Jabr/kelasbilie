import { z } from 'zod'

export const classSchema = z.object({
  id: z.string(),

  name: z
    .string()
    .trim()
    .min(1, 'Nama kelas wajib diisi.'),

  level: z
    .number()
    .int(),

  room: z
    .string()
    .trim(),

  building: z
    .string()
    .trim(),

  floor: z
    .number()
    .int(),

  createdAt: z
    .string()
    .default(''),

  updatedAt: z
    .string()
    .default('')
})

export type ClassSchema = z.infer<typeof classSchema>

export const createClassSchema = classSchema.omit({
  id: true
})

export type CreateClassSchema = z.infer<typeof createClassSchema>

export const updateClassSchema = createClassSchema.partial()

export type UpdateClassSchema = z.infer<typeof updateClassSchema>
