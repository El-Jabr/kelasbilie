<script setup lang="ts">
import { LazyModalLogout } from '#components'

const authStore = useAuthStore()

// Computed: data user untuk ditampilkan di header (nama & email)
const user = computed(() => ({
  name: authStore.user?.fullname ?? undefined,
  email: authStore.user?.email ?? undefined
}))

const overlay = useOverlay()
const modal = overlay.create(LazyModalLogout)
const loading = ref(false)

// Computed: link home / dashboard berdasarkan role
const homeLink = computed(() => {
  if (!authStore.isAuthenticated || !authStore.user) return '/'
  const role = String(authStore.user.role).toUpperCase()
  if (role === 'SUPER_ADMIN') return '/super-admin'
  if (role === 'ADMIN' || role === 'TEACHER') return '/teacher'
  if (role === 'STUDENT') return '/student'
  return '/'
})

onMounted(async () => {
  if (!authStore.user) {
    try {
      const u = await $fetch('/api/auth/me', { credentials: 'include' })
      if (u) {
        authStore.setUser(u as any)
      }
    } catch {
      // User is not authenticated
    }
  }
})

/**
 * Fungsi logout: menutup sesi user.
 */
async function logout() {
  const confirmed = await modal.open()
  loading.value = true

  if (confirmed) {
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      authStore.logout()
      await navigateTo('/login')
    } catch (error) {
      console.error('[AppHeader] Logout gagal:', error)
    } finally {
      loading.value = false
    }
  } else {
    loading.value = false
  }
}
</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink :to="homeLink">
        <img
          src="/logo.png"
          alt="Kelas Bilie"
          class="w-auto h-16 shrink-0"
        >
      </NuxtLink>
    </template>

    <template #right>
      <UColorModeButton />

      <div
        v-if="authStore.isAuthenticated"
        class="flex items-center gap-2 lg:gap-4"
      >
        <UButton
          :to="homeLink"
          label="Ke Dashboard"
          icon="i-lucide-layout-dashboard"
          color="primary"
          variant="subtle"
          size="sm"
        />

        <UUser
          :name="user?.name"
          :description="user?.email"
          :avatar="{
            src: 'https://i.pravatar.cc/150?u=user',
            loading: 'lazy',
            icon: 'i-lucide-image'
          }"
          class="hidden lg:inline-flex"
        />

        <UButton
          class="cursor-pointer lg:hidden"
          icon="i-lucide-log-out"
          color="neutral"
          variant="ghost"
          title="Logout"
          @click="logout"
        />

        <UButton
          class="cursor-pointer hidden lg:inline-flex"
          label="Logout"
          icon="i-lucide-log-out"
          color="neutral"
          variant="outline"
          @click="logout"
        />
      </div>

      <div
        v-else
        class="flex items-center gap-2"
      >
        <UButton
          icon="i-lucide-log-in"
          color="neutral"
          variant="ghost"
          to="/login"
          class="lg:hidden"
        />

        <UButton
          label="Sign in"
          color="neutral"
          variant="outline"
          to="/login"
          class="hidden lg:inline-flex"
        />
      </div>
    </template>

    <template #body>
      <div
        v-if="authStore.isAuthenticated"
        class="space-y-3"
      >
        <UButton
          :to="homeLink"
          label="Ke Dashboard"
          icon="i-lucide-layout-dashboard"
          color="primary"
          block
        />
        <UButton
          label="Logout"
          color="neutral"
          variant="subtle"
          block
          icon="i-lucide-log-out"
          @click="logout"
        />
      </div>
      <div v-else>
        <UButton
          label="Sign in"
          color="neutral"
          variant="subtle"
          to="/login"
          block
        />
      </div>
    </template>
  </UHeader>
</template>
