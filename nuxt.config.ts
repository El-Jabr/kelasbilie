// Fix fileURLToPath on Windows when Nitro prerender shims import.meta.url with file:///_entry.js
if (typeof globalThis !== 'undefined' && !(globalThis as any)._importMeta_) {
  (globalThis as any)._importMeta_ = {
    url: 'file:///C:/_entry.js',
    env: process.env
  }
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/content',
    '@vueuse/nuxt',
    'nuxt-og-image',
    '@pinia/nuxt'
  ],

  devtools: {
    enabled: true
  },

  app: {
    baseURL: '/'
  },

  css: ['~/assets/css/main.css'],

  content: {
    experimental: {
      sqliteConnector: 'native'
    }
  },

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET
  },

  routeRules: {
    '/docs': { redirect: '/docs/getting-started', prerender: false }
  },

  compatibilityDate: '2025-01-01',

  nitro: {
    prerender: {
      routes: [],
      crawlLinks: false
    },
    replace: {
      'file:///_entry.js': 'file:///C:/_entry.js'
    }
  },

  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'maska/vue',
        'zod'
      ]
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  ogImage: {
    zeroRuntime: false
  }
})
