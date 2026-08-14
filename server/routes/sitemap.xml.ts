export default defineEventHandler((event) => {
  // Hanya mengekspos route publik untuk kebutuhan crawling Google SEO
  // Route portal siswa, guru, dan admin tidak boleh terindeks karena membutuhkan login
  const publicRoutes = [
    '/',
    '/login'
  ]
  
  // Mengambil Base URL dari environment variable atau fallback ke domain default
  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://kelasbilie.id'
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicRoutes.map(route => `  <url>
    <loc>${siteUrl}${route === '/' ? '' : route}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`

  setHeader(event, 'Content-Type', 'application/xml')
  return sitemap
})
