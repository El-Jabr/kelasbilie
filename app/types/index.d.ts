export interface User {
  id: string
  email: string
  role: 'ADMIN' | 'STUDENT' | 'TEACHER'
}
