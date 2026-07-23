import { z } from 'zod'

export const updateSettingSchema = z.object({
  schoolName: z.string().trim().nullable().optional(),
  moodleUrl: z.string().trim().url('Moodle URL tidak valid.').nullable().optional().or(z.literal('')),
  moodleToken: z.string().trim().nullable().optional(),
  syncEnabled: z.boolean().optional(),
  syncInterval: z.number().int().min(5, 'Interval minimal 5 menit.').optional(),
  logo: z.string().nullable().optional()
})

export type UpdateSettingSchema = z.infer<typeof updateSettingSchema>
