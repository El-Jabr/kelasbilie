import { z } from 'zod'

export const createHomeroomAssignmentSchema = z.object({
  teacherId: z.string().min(1, 'Guru wajib dipilih.'),
  classroomId: z.string().min(1, 'Kelas wajib dipilih.'),
  semesterId: z.string().min(1, 'Semester wajib dipilih.')
})

export const updateHomeroomAssignmentSchema = createHomeroomAssignmentSchema.partial()

export type CreateHomeroomAssignmentSchema = z.infer<typeof createHomeroomAssignmentSchema>
export type UpdateHomeroomAssignmentSchema = z.infer<typeof updateHomeroomAssignmentSchema>
