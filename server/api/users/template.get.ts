export default defineEventHandler(async (event) => {
  const csv = [
    'username,fullname,email,password,role',
    'ahmad,Ahmad Fauzi,ahmad@example.com,123456,STUDENT',
    'budi,Budi Santoso,budi@example.com,123456,TEACHER',
    'admin,Administrator,admin@example.com,Admin123!,ADMIN'
  ].join('\n')

  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(
    event,
    'Content-Disposition',
    'attachment; filename="users-template.csv"'
  )

  return csv
})
