<script setup lang="ts">
import { LazyModalLogout } from '#components'
import type { NavigationMenuItem } from '@nuxt/ui'

defineProps<{
  isMobile?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const route = useRoute()
const authStore = useAuthStore()

const overlay = useOverlay()
const modal = overlay.create(LazyModalLogout)
const loading = ref(false)

const user = computed(() => ({
  name: authStore.user?.fullname ?? 'Siswa',
  email: authStore.user?.email ?? '',
  role: authStore.user?.role ?? 'STUDENT'
}))

const navItems = computed<NavigationMenuItem[]>(() => {
  const isSuperOrAdmin = user.value.role === 'SUPER_ADMIN' || user.value.role === 'ADMIN'

  const items: NavigationMenuItem[] = [
    {
      label: 'Dashboard Siswa',
      icon: 'i-lucide-home',
      to: '/student',
      active: route.path === '/student'
    },
    {
      label: 'Nilai Akademik',
      icon: 'i-lucide-award',
      to: '/student/grades',
      active: route.path.startsWith('/student/grades')
    },
    {
      label: 'Profil Saya',
      icon: 'i-lucide-user',
      to: '/student/profile',
      active: route.path === '/student/profile'
    }
  ]

  if (isSuperOrAdmin) {
    items.push({
      label: 'Ke Panel Admin',
      icon: 'i-lucide-shield',
      to: '/super-admin',
      active: route.path.startsWith('/super-admin')
    })
  }

  return items
})

async function handleLogout() {
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
      console.error('[StudentSidebar] Logout gagal:', error)
    } finally {
      loading.value = false
    }
  } else {
    loading.value = false
  }
}
</script>

<template>
  <aside class="flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 w-64 select-none">
    <!-- Header Tanpa Logo Aplikasi -->
    <div class="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
      <NuxtLink to="/student" class="flex items-center gap-3">
        <div class="flex flex-col">
          <span class="font-bold text-base leading-none text-gray-900 dark:text-white">Kelas Bilie</span>
          <span class="text-[10px] font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400 mt-0.5">
            Portal Siswa
          </span>
        </div>
      </NuxtLink>

      <UButton
        v-if="isMobile"
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="emit('close')"
      />
    </div>

    <!-- Navigation List -->
    <div class="flex-1 overflow-y-auto p-3 space-y-1">
      <UNavigationMenu
        :items="navItems"
        orientation="vertical"
        class="w-full"
      />
    </div>

    <!-- Sidebar Footer / User Profile -->
    <div class="p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2.5 min-w-0">
          <UAvatar
            src="https://i.pravatar.cc/150?u=student"
            alt="User Avatar"
            size="sm"
          />
          <div class="flex flex-col truncate">
            <span class="text-xs font-semibold text-gray-900 dark:text-white truncate">
              {{ user.name }}
            </span>
            <span class="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {{ user.email || 'Siswa' }}
            </span>
          </div>
        </div>

        <UButton
          icon="i-lucide-log-out"
          color="error"
          variant="ghost"
          size="xs"
          title="Logout"
          class="shrink-0 cursor-pointer"
          :loading="loading"
          @click="handleLogout"
        />
      </div>
    </div>
  </aside>
</template>
