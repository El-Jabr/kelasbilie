<script setup lang="ts">
const defaultIndexData = {
  title: 'Solusi Terintegrasi, [Kelas Bilie]{class="text-primary"} untuk Digitalisasi Sekolah',
  description: 'Platform manajemen akademik terintegrasi yang menghubungkan administrasi sekolah, pembelajaran Moodle, data pengguna, jadwal, nilai, dan monitoring dalam satu sistem.',
  seo: {
    title: 'Kelas Bilie | Sistem Manajemen Akademik Terintegrasi',
    description: 'Kelola seluruh aktivitas akademik sekolah dari satu dashboard. Terintegrasi dengan Moodle untuk pembelajaran digital yang lebih mudah.'
  },
  hero: {
    title: 'Semua Aktivitas Akademik dalam Satu Dashboard',
    description: 'Kelas Bilie membantu sekolah mengelola pembelajaran, pengguna, kelas, kurikulum, nilai, dan administrasi secara terintegrasi dengan Moodle.',
    links: [
      { label: 'Mulai Sekarang', icon: 'i-lucide-arrow-right', trailing: true, to: '/login', size: 'xl' },
      { label: 'Pelajari Fitur', icon: 'i-lucide-book-open', color: 'neutral', variant: 'subtle', to: '#features', size: 'xl' }
    ]
  },
  sections: [
    {
      id: 'features',
      title: 'Mengapa Memilih Kelas Bilie?',
      description: 'Dibangun untuk membantu sekolah mengelola seluruh proses akademik secara lebih efisien dan terintegrasi.',
      orientation: 'horizontal',
      features: [
        { name: 'Terintegrasi dengan Moodle', description: 'Sinkronisasi pembelajaran, peserta, guru, nilai, dan aktivitas Moodle langsung dari satu sistem.', icon: 'i-lucide-book-open-check' },
        { name: 'Manajemen Akademik', description: 'Kelola kelas, jadwal, mata pelajaran, guru, siswa, dan tahun ajaran dengan mudah.', icon: 'i-lucide-school' },
        { name: 'Dashboard Monitoring', description: 'Pantau aktivitas pembelajaran, progres siswa, dan statistik sekolah secara real-time.', icon: 'i-lucide-chart-column' }
      ],
      image: 'https://images.bilter.my.id/image-section-1.png'
    },
    {
      title: 'Dibangun untuk Sekolah Modern',
      description: 'Mendukung digitalisasi sekolah mulai dari administrasi hingga proses belajar mengajar.',
      orientation: 'horizontal',
      reverse: true,
      features: [
        { name: 'Manajemen Pengguna', description: 'Kelola akun administrator, guru, siswa, dan wali kelas dalam satu tempat.', icon: 'i-lucide-users' },
        { name: 'Aman dan Cepat', description: 'Menggunakan autentikasi JWT, kontrol hak akses, dan performa tinggi berbasis Nuxt 4.', icon: 'i-lucide-shield-check' },
        { name: 'Responsif', description: 'Dapat digunakan melalui desktop maupun perangkat mobile.', icon: 'i-lucide-smartphone' }
      ],
      image: 'https://images.bilter.my.id/image-section-2.jpg'
    }
  ],
  features: {
    title: 'Semua yang Dibutuhkan Sekolah',
    description: 'Kelas Bilie menyediakan fitur lengkap untuk mendukung administrasi dan pembelajaran digital.',
    items: [
      { title: 'Dashboard Akademik', description: 'Ringkasan data sekolah, statistik pembelajaran, dan aktivitas terbaru.', icon: 'i-lucide-layout-dashboard' },
      { title: 'Integrasi Moodle', description: 'Sinkronisasi kursus, peserta, guru, kategori, nilai, dan aktivitas.', icon: 'i-lucide-book-marked' },
      { title: 'Manajemen Pengguna', description: 'Kelola admin, guru, siswa, dan role secara terpusat.', icon: 'i-lucide-users' },
      { title: 'Jadwal & Kelas', description: 'Atur kelas, rombel, mata pelajaran, serta jadwal pembelajaran.', icon: 'i-lucide-calendar-days' },
      { title: 'Monitoring Pembelajaran', description: 'Pantau progres belajar siswa dan aktivitas guru secara real-time.', icon: 'i-lucide-chart-line' },
      { title: 'Keamanan Data', description: 'Sistem autentikasi modern dengan kontrol hak akses berdasarkan peran.', icon: 'i-lucide-lock' }
    ]
  },
  testimonials: {
    headline: 'Digunakan untuk Digitalisasi Sekolah',
    title: 'Membantu Administrasi dan Pembelajaran',
    description: 'Dirancang untuk mempermudah pekerjaan administrator, guru, dan pengelola sekolah.',
    items: [
      { quote: 'Integrasi Moodle membuat pengelolaan pembelajaran jauh lebih mudah.', user: { name: 'Administrator Sekolah', description: 'IT Center', avatar: { src: 'https://i.pravatar.cc/120?img=1' } } },
      { quote: 'Dashboard akademik membantu kami memonitor aktivitas belajar setiap hari.', user: { name: 'Marcus Rodriguez', description: 'Wakil Kepala Sekolah Bidang Kurikulum', avatar: { src: 'https://i.pravatar.cc/120?img=7' } } },
      { quote: 'Data guru, siswa, dan kelas kini tersusun rapi dalam satu aplikasi.', user: { name: 'David Kumar', description: 'Kepala Sekolah', avatar: { src: 'https://i.pravatar.cc/120?img=3' } } }
    ]
  },
  cta: {
    title: 'Mulai Digitalisasi Sekolah Anda',
    description: 'Kelola administrasi akademik dan pembelajaran Moodle dalam satu platform yang modern, cepat, dan mudah digunakan.',
    links: [
      { label: 'Masuk ke Dashboard', to: '/login', target: '_blank', trailingIcon: 'i-lucide-arrow-right' },
      { label: 'View our website', to: 'https://smpbilingualterpadu2.sch.id', target: '_blank', variant: 'subtle', icon: 'i-simple-icons-instagram' }
    ]
  }
} as any

const { data: pageData } = await useAsyncData('index-page-content', async () => {
  try {
    const res = await queryCollection('index').first()
    if (res && res.title) return res
  } catch (e) {
    console.warn('Content query fallback activated:', e)
  }
  return defaultIndexData
})

const page = computed<any>(() => pageData.value || defaultIndexData)

const title = computed(() => page.value?.seo?.title || page.value?.title || defaultIndexData.title)
const description = computed(() => page.value?.seo?.description || page.value?.description || defaultIndexData.description)

useSeoMeta({
  titleTemplate: '',
  title: title.value,
  ogTitle: title.value,
  description: description.value,
  ogDescription: description.value,
  ogImage: 'https://images.bilter.my.id/kelasbilie.png'
})
</script>

<template>
  <div v-if="page">
    <UPageHero
      v-if="page.hero"
      :title="page.title"
      :description="page.description"
      :links="page.hero?.links"
    >
      <template #top>
        <HeroBackground />
      </template>

      <template #title>
        <MDC
          v-if="page.title"
          :value="page.title"
          unwrap="p"
        />
      </template>

      <PromotionalVideo />
    </UPageHero>

    <UPageSection
      v-for="(section, index) in page.sections"
      :key="index"
      :title="section.title"
      :description="section.description"
      :orientation="section.orientation"
      :reverse="section.reverse"
      :features="section.features"
    >
      <ImagePlaceholder>
        <img
          :src="section.image"
          :alt="section.title"
          loading="lazy"
          class="w-full h-full object-cover"
        >
      </ImagePlaceholder>
    </UPageSection>

    <UPageSection
      v-if="page.features"
      :title="page.features.title"
      :description="page.features.description"
    >
      <UPageGrid>
        <UPageCard
          v-for="(item, index) in page.features.items"
          :key="index"
          v-bind="item"
          spotlight
        />
      </UPageGrid>
    </UPageSection>

    <UPageSection
      v-if="page.testimonials"
      id="testimonials"
      :headline="page.testimonials.headline"
      :title="page.testimonials.title"
      :description="page.testimonials.description"
    >
      <UPageColumns class="xl:columns-4">
        <UPageCard
          v-for="(testimonial, index) in page.testimonials.items"
          :key="index"
          variant="subtle"
          :description="testimonial.quote"
          :ui="{ description: 'before:content-[open-quote] after:content-[close-quote]' }"
        >
          <template #footer>
            <UUser
              v-bind="testimonial.user"
              size="lg"
            />
          </template>
        </UPageCard>
      </UPageColumns>
    </UPageSection>

    <USeparator />

    <UPageCTA
      v-if="page.cta"
      v-bind="page.cta"
      variant="naked"
      class="overflow-hidden"
    >
      <LazyStarsBg />
    </UPageCTA>
  </div>
</template>
