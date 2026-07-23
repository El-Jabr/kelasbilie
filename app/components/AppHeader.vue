<script setup lang="ts">
import { LazyModalLogout } from '#components'
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

// Pinia Auth Store — satu-satunya sumber data user yang sedang login
const authStore = useAuthStore()

// Computed: data user untuk ditampilkan di header (nama & email)
const user = computed(() => ({
  name: authStore.user?.fullname ?? undefined,
  email: authStore.user?.email ?? undefined
}))

const overlay = useOverlay()
const modal = overlay.create(LazyModalLogout)
const loading = ref(false)

// Computed: link home berdasarkan role
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
 * Navigation Items dinamis berdasarkan status Auth & Role User.
 * Jika BELUM login (authStore.isAuthenticated === false) -> items dikembalikan KOSONG [].
 * Jika SUDAH login -> items disesuaikan berdasarkan role (SUPER_ADMIN/ADMIN, TEACHER, STUDENT).
 */
const items = computed<NavigationMenuItem[]>(() => {
  if (!authStore.isAuthenticated || !authStore.user) {
    return [] // Sembunyikan semua menu jika pengguna belum login
  }

  const role = String(authStore.user.role).toUpperCase()

  if (role === 'SUPER_ADMIN') {
    return [
      {
        label: 'Dashboard',
        icon: 'i-lucide-home',
        to: '/super-admin',
        active: route.path === '/super-admin'
      },
      {
        label: 'Master Data',
        icon: 'i-lucide-box',
        to: '/super-admin/master/users',
        active: route.path.startsWith('/super-admin/master'),
        children: [
          {
            label: 'Users',
            icon: 'i-lucide-users',
            description: 'Kelola seluruh pengguna aplikasi.',
            to: '/super-admin/master/users'
          },
          {
            label: 'Guru',
            icon: 'i-lucide-graduation-cap',
            description: 'Kelola data guru sekolah.',
            to: '/super-admin/master/guru'
          },
          {
            label: 'Siswa',
            icon: 'i-lucide-school',
            description: 'Kelola data siswa sekolah.',
            to: '/super-admin/master/siswa'
          }
        ]
      },
      {
        label: 'Akademik',
        icon: 'i-lucide-book',
        to: '/super-admin/akademik/tahun-ajaran',
        active: route.path.startsWith('/super-admin/akademik'),
        children: [
          {
            label: 'Tahun Ajaran',
            icon: 'i-lucide-calendar',
            description: 'Manage academic years.',
            to: '/super-admin/akademik/tahun-ajaran'
          },
          {
            label: 'Semester',
            icon: 'i-lucide-clock',
            description: 'Manage semesters',
            to: '/super-admin/akademik/semester'
          },
          {
            label: 'Kelas',
            icon: 'i-lucide-layers',
            description: 'Manage class information and schedules.',
            to: '/super-admin/akademik/kelas'
          },
          {
            label: 'Mata Pelajaran',
            icon: 'i-lucide-book-open',
            description: 'Manage subjects and their information.',
            to: '/super-admin/akademik/mata-pelajaran'
          },
          {
            label: 'Penugasan Mengajar',
            icon: 'i-lucide-file-spreadsheet',
            description: 'Assign guru ke kelas dan course Moodle.',
            to: '/super-admin/akademik/teaching-assignments'
          },
          {
            label: 'Wali Kelas',
            icon: 'i-lucide-user-cog',
            description: 'Penetapan wali kelas per rombel.',
            to: '/super-admin/akademik/homerooms'
          },
          {
            label: 'Pembagian Kelas Siswa',
            icon: 'i-lucide-users-round',
            description: 'Pendaftaran siswa ke dalam kelas.',
            to: '/super-admin/akademik/pembagian-kelas'
          }
        ]
      },
      {
        label: 'Moodle',
        icon: 'i-lucide-server',
        to: '/super-admin/moodle/sinkronisasi',
        active: route.path.startsWith('/super-admin/moodle'),
        children: [
          {
            label: 'Sinkronisasi',
            icon: 'i-lucide-cable',
            description: 'Synchronize data with moodle systems.',
            to: '/super-admin/moodle/sinkronisasi'
          },
          {
            label: 'Course Moodle',
            icon: 'i-lucide-book-search',
            description: 'Display course information.',
            to: '/super-admin/moodle/course'
          }
        ]
      },
      {
        label: 'Monitoring',
        icon: 'i-lucide-monitor',
        to: '/super-admin/monitoring/activity-log',
        active: route.path.startsWith('/super-admin/monitoring'),
        children: [
          {
            label: 'Activity Log',
            icon: 'i-lucide-activity',
            description: 'Display a list of user activities.',
            to: '/super-admin/monitoring/activity-log'
          }
        ]
      },
      {
        label: 'Settings',
        icon: 'i-lucide-settings',
        to: '/super-admin/settings',
        active: route.path.startsWith('/super-admin/settings')
      }
    ]
  }

  if (role === 'ADMIN') {
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
        label: 'Kelola Akademik',
        icon: 'i-lucide-book',
        to: '/super-admin/akademik/teaching-assignments',
        active: route.path.startsWith('/super-admin/akademik'),
        children: [
          {
            label: 'Penugasan Mengajar',
            icon: 'i-lucide-file-spreadsheet',
            description: 'Assign guru ke kelas dan course Moodle.',
            to: '/super-admin/akademik/teaching-assignments'
          },
          {
            label: 'Wali Kelas',
            icon: 'i-lucide-user-cog',
            description: 'Penetapan wali kelas per rombel.',
            to: '/super-admin/akademik/homerooms'
          },
          {
            label: 'Pembagian Kelas Siswa',
            icon: 'i-lucide-users-round',
            description: 'Pendaftaran siswa ke dalam kelas.',
            to: '/super-admin/akademik/pembagian-kelas'
          }
        ]
      },
      {
        label: 'Profil Saya',
        icon: 'i-lucide-user',
        to: '/teacher/profile',
        active: route.path === '/teacher/profile'
      }
    ]
  }

  if (role === 'TEACHER') {
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
  }

  if (role === 'STUDENT') {
    return [
      {
        label: 'Dashboard',
        icon: 'i-lucide-home',
        to: '/student',
        active: route.path === '/student'
      },
      {
        label: 'Nilai Saya',
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
  }

  return []
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

    <UNavigationMenu
      v-if="authStore.isAuthenticated"
      :items="items"
      variant="link"
    />

    <template #right>
      <UColorModeButton />

      <div
        v-if="authStore.isAuthenticated"
        class="flex items-center gap-2 lg:gap-4"
      >
        <UUser
          :avatar="{
            src: 'https://i.pravatar.cc/150?u=john-doe',
            loading: 'lazy',
            icon: 'i-lucide-image'
          }"
          class="lg:hidden"
        />
        <UUser
          :name="user?.name"
          :description="user?.email"
          :avatar="{
            src: 'https://i.pravatar.cc/150?u=john-doe',
            loading: 'lazy',
            icon: 'i-lucide-image'
          }"
          class="hidden lg:inline-flex"
        />
        <UTooltip text="Logout">
          <UButton
            class="cursor-pointer lg:hidden"
            icon="i-lucide-log-out"
            color="neutral"
            variant="ghost"
            @click="logout"
          />
        </UTooltip>

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
      <UNavigationMenu
        v-if="authStore.isAuthenticated"
        :items="items"
        orientation="vertical"
        class="-mx-2.5"
      />

      <USeparator class="my-6" />

      <div v-if="!authStore.isAuthenticated">
        <UButton
          label="Sign in"
          color="neutral"
          variant="subtle"
          to="/login"
          block
        />
      </div>
      <div v-else>
        <UButton
          label="Logout"
          color="neutral"
          variant="subtle"
          block
          icon="i-lucide-log-out"
          @click="logout"
        />
      </div>
    </template>
  </UHeader>
</template>
