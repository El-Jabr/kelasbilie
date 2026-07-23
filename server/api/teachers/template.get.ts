export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', 'attachment; filename="teachers-template.csv"')

  const csvContent = [
    'username,nip,nama_lengkap,kelas_rombel,subject_ids',
    'guru.mat,198901012020121001,"Guru Matematika","10",1,2'
  ].join('\n')

  return csvContent
})
