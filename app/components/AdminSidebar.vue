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
  name: authStore.user?.fullname ?? 'Admin',
  email: authStore.user?.email ?? '',
  role: authStore.user?.role ?? 'ADMIN'
}))

// Navigation items untuk Admin & Super Admin
const navItems = computed<NavigationMenuItem[]>(() => {
  const role = String(authStore.user?.role || '').toUpperCase()

  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    const isSuperAdmin = role === 'SUPER_ADMIN'

    const isMasterActive = route.path.startsWith('/super-admin/master')
    const isAkademikActive = route.path.startsWith('/super-admin/akademik')
    const isMoodleActive = route.path.startsWith('/super-admin/moodle')
    const isMonitoringActive = route.path.startsWith('/super-admin/monitoring')

    const masterChildren = []
    if (isSuperAdmin) {
      masterChildren.push({
        label: 'Users',
        icon: 'i-lucide-users',
        to: '/super-admin/master/users',
        active: route.path.startsWith('/super-admin/master/users')
      })
    }
    masterChildren.push(
      {
        label: 'Guru',
        icon: 'i-lucide-graduation-cap',
        to: '/super-admin/master/guru',
        active: route.path.startsWith('/super-admin/master/guru')
      },
      {
        label: 'Siswa',
        icon: 'i-lucide-school',
        to: '/super-admin/master/siswa',
        active: route.path.startsWith('/super-admin/master/siswa')
      }
    )

    const moodleChildren = [
      {
        label: 'Cek Nilai Per Kelas',
        icon: 'i-lucide-award',
        to: '/super-admin/moodle/nilai',
        active: route.path.startsWith('/super-admin/moodle/nilai')
      },
      {
        label: 'Course Moodle',
        icon: 'i-lucide-book-search',
        to: '/super-admin/moodle/course',
        active: route.path.startsWith('/super-admin/moodle/course')
      }
    ]

    if (isSuperAdmin) {
      moodleChildren.push({
        label: 'Sinkronisasi Moodle',
        icon: 'i-lucide-cable',
        to: '/super-admin/moodle/sinkronisasi',
        active: route.path.startsWith('/super-admin/moodle/sinkronisasi')
      })
    }

    const items: NavigationMenuItem[] = [
      {
        label: 'Dashboard',
        icon: 'i-lucide-home',
        to: '/super-admin',
        active: route.path === '/super-admin'
      },
      {
        label: 'Master Data',
        icon: 'i-lucide-box',
        active: isMasterActive,
        defaultOpen: isMasterActive,
        open: isMasterActive,
        children: masterChildren
      },
      {
        label: 'Akademik',
        icon: 'i-lucide-book',
        active: isAkademikActive,
        defaultOpen: isAkademikActive,
        open: isAkademikActive,
        children: [
          {
            label: 'Tahun Ajaran',
            icon: 'i-lucide-calendar',
            to: '/super-admin/akademik/tahun-ajaran',
            active: route.path.startsWith('/super-admin/akademik/tahun-ajaran')
          },
          {
            label: 'Semester',
            icon: 'i-lucide-clock',
            to: '/super-admin/akademik/semester',
            active: route.path.startsWith('/super-admin/akademik/semester')
          },
          {
            label: 'Kelas',
            icon: 'i-lucide-layers',
            to: '/super-admin/akademik/kelas',
            active: route.path.startsWith('/super-admin/akademik/kelas')
          },
          {
            label: 'Mata Pelajaran',
            icon: 'i-lucide-book-open',
            to: '/super-admin/akademik/mata-pelajaran',
            active: route.path.startsWith('/super-admin/akademik/mata-pelajaran')
          },
          {
            label: 'Penugasan Mengajar',
            icon: 'i-lucide-file-spreadsheet',
            to: '/super-admin/akademik/teaching-assignments',
            active: route.path.startsWith('/super-admin/akademik/teaching-assignments')
          },
          {
            label: 'Wali Kelas',
            icon: 'i-lucide-user-cog',
            to: '/super-admin/akademik/homerooms',
            active: route.path.startsWith('/super-admin/akademik/homerooms')
          },
          {
            label: 'Pembagian Kelas Siswa',
            icon: 'i-lucide-users-round',
            to: '/super-admin/akademik/pembagian-kelas',
            active: route.path.startsWith('/super-admin/akademik/pembagian-kelas')
          }
        ]
      },
      {
        label: 'Nilai & Moodle',
        icon: 'i-lucide-server',
        active: isMoodleActive,
        defaultOpen: isMoodleActive,
        open: isMoodleActive,
        children: moodleChildren
      },
      {
        label: 'Portal Mengajar (Guru)',
        icon: 'i-lucide-graduation-cap',
        to: '/teacher',
        active: route.path.startsWith('/teacher')
      }
    ]

    if (isSuperAdmin) {
      items.push(
        {
          label: 'Monitoring',
          icon: 'i-lucide-monitor',
          active: isMonitoringActive,
          defaultOpen: isMonitoringActive,
          open: isMonitoringActive,
          children: [
            {
              label: 'Activity Log',
              icon: 'i-lucide-activity',
              to: '/super-admin/monitoring/activity-log',
              active: route.path.startsWith('/super-admin/monitoring/activity-log')
            },
            {
              label: 'Debugging (Pino)',
              icon: 'i-lucide-terminal',
              to: '/super-admin/monitoring/debugging',
              active: route.path.startsWith('/super-admin/monitoring/debugging')
            }
          ]
        },
        {
          label: 'Settings',
          icon: 'i-lucide-settings',
          to: '/super-admin/settings',
          active: route.path.startsWith('/super-admin/settings')
        }
      )
    }

    return items
  }

  // Teacher ONLY
  return [
    {
      label: 'Dashboard',
      icon: 'i-lucide-home',
      to: '/teacher',
      active: route.path === '/teacher'
    },
    {
      label: 'Kelas Mengajar',
      icon: 'i-lucide-book-open',
      to: '/teacher/classes',
      active: route.path.startsWith('/teacher/classes')
    },
    {
      label: 'Profil Saya',
      icon: 'i-lucide-user',
      to: '/teacher/profile',
      active: route.path === '/teacher/profile'
    }
  ]
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
      console.error('[AdminSidebar] Logout gagal:', error)
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
    <!-- Sidebar Header / Logo -->
    <div class="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800 shrink-0">
      <NuxtLink to="/super-admin" class="flex items-center gap-3">
        <div class="flex flex-col">
          <span class="font-bold text-base leading-none text-gray-900 dark:text-white">KelasBilie</span>
          <span class="text-[10px] font-semibold tracking-wider uppercase text-emerald-600 dark:text-emerald-400 mt-0.5">
            {{ user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin Panel' }}
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
            src="https://i.pravatar.cc/150?u=admin"
            alt="User Avatar"
            size="sm"
          />
          <div class="flex flex-col truncate">
            <span class="text-xs font-semibold text-gray-900 dark:text-white truncate">
              {{ user.name }}
            </span>
            <span class="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {{ user.email }}
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
