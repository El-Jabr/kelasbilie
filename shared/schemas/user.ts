import { z } from 'zod'

export const userSchema = z.object({

  id: z
    .string(),

  username: z
    .string()
    .trim()
    .min(3, 'Username minimal 3 karakter.')
    .max(30),

  fullname: z
    .string()
    .trim()
    .min(3, 'Nama lengkap wajib diisi.'),

  email: z
    .email('Email tidak valid.')
    .optional()
    .or(z.literal('')),

  password: z
    .string()
    .min(6, 'Password minimal 6 karakter.')
    .or(z.literal('')),

  role: z.enum([
    'ADMIN',
    'TEACHER',
    'STUDENT'
  ]),

  moodleUserId: z
    .number()
    .int()
    .nullable(),

  createdAt: z
    .string(),

  isActive: z.boolean()
})

export type UserSchema
  = z.infer<typeof userSchema>

export const updateUserSchema = userSchema.partial().omit({
  id: true,
  createdAt: true
})

export type UpdateUserSchema = z.infer<typeof updateUserSchema>

