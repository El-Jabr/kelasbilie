<script setup lang="ts">
import { LazyModalLogout } from '#components'
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const userState = useState<{ fullname: string, email: string }>('user')
const user = computed(() => ({
  name: userState.value?.fullname,
  email: userState.value?.email
}))
console.log('userState', userState.value)
console.log('user', user.value)

const overlay = useOverlay()

const modal = overlay.create(LazyModalLogout)
const loading = ref(false)

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Dashboard',
    icon: 'i-lucide-home',
    to: '/super-admin',
    active: route.path === '/super-admin'
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
        description: 'Manage academic years and semesters.',
        to: '/super-admin/akademik/tahun-ajaran'
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
      }
    ]
  },
  {
    label: 'Moodle',
    icon: 'i-lucide-box',
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
        label: 'Course',
        icon: 'i-lucide-book-search',
        description: 'Display course information.',
        to: '/super-admin/moodle/course'
      },
      {
        label: 'Nilai',
        icon: 'i-lucide-award',
        description: 'Display a list of grades.',
        to: '/super-admin/moodle/nilai'
      }
    ]
  },
  {
    label: 'Master',
    icon: 'i-lucide-box',
    to: '/super-admin/master/users',
    active: route.path.startsWith('/super-admin/master'),
    children: [
      {
        label: 'User',
        icon: 'i-lucide-users',
        description: 'Display a list of users master.',
        to: '/super-admin/master/users'
      },
      {
        label: 'Role',
        icon: 'i-lucide-shield',
        description: 'Display role information and permissions.',
        to: '/super-admin/master/role'
      },
      {
        label: 'Permission',
        icon: 'i-lucide-key',
        description: 'Display a list of permissions.',
        to: '/super-admin/master/permission'
      },
      {
        label: 'Sekolah',
        icon: 'i-lucide-school',
        description: 'Display a list of schools.',
        to: '/super-admin/master/sekolah'
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
        icon: 'i-lucide-activity-log',
        description: 'Display a list of user activities.',
        to: '/super-admin/monitoring/activity-log'
      },
      {
        label: 'Queue',
        icon: 'i-lucide-list-check',
        description: 'Display a list of queued items.',
        to: '/super-admin/monitoring/queue'
      },
      {
        label: 'Login History',
        icon: 'i-lucide-log-in',
        description: 'Display a list of login attempts.',
        to: '/super-admin/monitoring/login-history'
      }
    ]
  },
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    to: '/super-admin/settings',
    active: route.path.startsWith('/super-admin/settings')
  }
])

async function logout() {
  const confirmed = await modal.open()
  loading.value = true

  if (confirmed) {
    try {
      console.log('Logging out...')
      await $fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      const userState = useState('user')
      userState.value = null
      console.log('User state after logout:', userState.value)
      await navigateTo('/')
      loading.value = false
    } catch (error) {
      console.error('Logout gagal:', error)
    }
  }
}
</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink to="/">
        <img
          src="/logo.png"
          alt="Kelas Bilie"
          class="w-auto h-16 shrink-0"
        >
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="items"
      variant="link"
    />

    <template #right>
      <UColorModeButton />

      <div
        v-if="userState"
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
        <UTooltip
          text="Logout"
        >
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

        <UButton
          label="Sign up"
          color="neutral"
          trailing-icon="i-lucide-arrow-right"
          class="hidden lg:inline-flex"
          to="/signup"
        />
      </div>
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        class="-mx-2.5"
      />

      <USeparator class="my-6" />

      <UButton
        label="Sign in"
        color="neutral"
        variant="subtle"
        to="/login"
        block
        class="mb-3"
      />
      <UButton
        label="Sign up"
        color="neutral"
        to="/signup"
        block
      />
    </template>
  </UHeader>
</template>
