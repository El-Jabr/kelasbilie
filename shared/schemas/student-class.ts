import { z } from 'zod'

export const createStudentClassSchema = z.object({
  studentId: z.string().min(1, 'Siswa wajib dipilih.'),
  classroomId: z.string().min(1, 'Kelas wajib dipilih.'),
  semesterId: z.string().min(1, 'Semester wajib dipilih.')
})

export type CreateStudentClassSchema = z.infer<typeof createStudentClassSchema>
