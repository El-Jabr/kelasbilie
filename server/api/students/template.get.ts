export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', 'attachment; filename="students-template.csv"')
  return [
    'fullname,username,nis,email,password,moodleUserId',
    'Andi Pratama,andi.pratama,20260001,andi@sekolah.sch.id,Pass1234!,101',
    'Budi Santoso,budi.santoso,20260002,budi@sekolah.sch.id,Pass5678!,102'
  ].join('\n')
})

