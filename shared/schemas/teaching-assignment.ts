import { z } from 'zod'

export const teachingAssignmentSchema = z.object({
  id: z.string(),
  teacherId: z.string().min(1, 'Guru (teacherId) wajib diisi.'),
  subjectId: z.string().min(1, 'Mata pelajaran (subjectId) wajib diisi.'),
  classroomId: z.string().min(1, 'Kelas (classroomId) wajib diisi.'),
  semesterId: z.string().min(1, 'Semester (semesterId) wajib diisi.'),
  courseId: z.number({ message: 'Course Moodle wajib diisi.' }).int('Course ID harus berupa angka integer.')
})

export type TeachingAssignmentSchema = z.infer<typeof teachingAssignmentSchema>

export const createTeachingAssignmentSchema = teachingAssignmentSchema.omit({ id: true })
export type CreateTeachingAssignmentSchema = z.infer<typeof createTeachingAssignmentSchema>

export const updateTeachingAssignmentSchema = createTeachingAssignmentSchema.partial()
export type UpdateTeachingAssignmentSchema = z.infer<typeof updateTeachingAssignmentSchema>
