<script setup lang="ts">
const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#020618' : 'white')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'keywords', content: 'lms, manajemen kelas, moodle, ai, sekolah, akademik, pendidikan, rapor' },
    { name: 'author', content: 'Kelas Bilie' },
    { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' },
    { name: 'google-site-verification', content: 'fy66n-SOYpTS_qBFw115cXQ651jsEJZeqP9zvMQWU20' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'en'
  }
})

useSeoMeta({
  title: 'Beranda',
  titleTemplate: 'Kelas Bilie - %s',
  description: 'Platform manajemen kelas, rapor, sinkronisasi Moodle, dan analisis belajar berbasis Artificial Intelligence (AI) terlengkap.',
  ogTitle: 'Kelas Bilie - Platform Manajemen Akademik & AI',
  ogDescription: 'Platform manajemen kelas, rapor, sinkronisasi Moodle, dan analisis belajar berbasis Artificial Intelligence (AI) terlengkap.',
  ogUrl: 'https://kelasbilie.id',
  ogSiteName: 'Kelas Bilie',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Kelas Bilie - Platform Manajemen Akademik & AI',
  twitterDescription: 'Platform manajemen kelas, rapor, sinkronisasi Moodle, dan analisis belajar berbasis Artificial Intelligence (AI) terlengkap.'
})

const navigation = ref([])
const files = ref([])

const links = [{
  label: 'Dashboard',
  icon: 'i-lucide-home',
  to: '/'
},
{
  label: 'Akademik',
  icon: 'i-lucide-book',
  to: '/super-admin/akademik'
},
{
  label: 'Moodle',
  icon: 'i-lucide-box',
  to: '/super-admin/moodle'
},
{
  label: 'Master',
  icon: 'i-lucide-box',
  to: '/super-admin/master'
},
{
  label: 'Monitoring',
  icon: 'i-lucide-monitor',
  to: '/super-admin/monitoring'
},
{
  label: 'Settings',
  icon: 'i-lucide-settings',
  to: '/super-admin/settings'
}
]

provide('navigation', navigation)
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        shortcut="meta_k"
        :navigation="navigation"
        :links="links"
        :fuse="{ resultLimit: 42 }"
      />
    </ClientOnly>
  </UApp>
</template>
