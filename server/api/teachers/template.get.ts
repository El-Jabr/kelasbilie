export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', 'attachment; filename="teachers-template.csv"')

  return [
    'fullname,username,nip,email,password,moodleUserId',
    'Drs. Ahmad Dahlan,ahmad.dahlan,198501012010121001,ahmad@sekolah.sch.id,Pass1234!,201',
    'Siti Aminah S.Pd,siti.aminah,199002152015032002,siti@sekolah.sch.id,Pass5678!,202'
  ].join('\n')
})
