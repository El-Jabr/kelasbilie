export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', 'attachment; filename="students-template.csv"')
  return ['username,nis', 'siswa.andi,20260001'].join('\n')
})
