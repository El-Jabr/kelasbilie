<script setup lang="ts">
const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#020618' : 'white')

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
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
  titleTemplate: 'Kelas Bilie - %s',
  twitterCard: 'summary_large_image'
})

const { data: navigation } = await useAsyncData('navigation', () => queryCollectionNavigation('docs'), {
  transform: data => data.find(item => item.path === '/docs')?.children || []
})
const { data: files } = useLazyAsyncData('search', () => queryCollectionSearchSections('docs'), {
  server: false
})

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
