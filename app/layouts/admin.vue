<script setup lang="ts">
import { LazyModalLogout } from '#components'

const route = useRoute()
const authStore = useAuthStore()
const isMobileSidebarOpen = ref(false)

const overlay = useOverlay()
const modal = overlay.create(LazyModalLogout)
const loading = ref(false)

// Close mobile sidebar on route change
watch(() => route.path, () => {
  isMobileSidebarOpen.value = false
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

// Compute page title based on current route
const pageTitle = computed(() => {
  const path = route.path
  if (path === '/super-admin') return 'Dashboard Utama'
  if (path.includes('/master/users')) return 'Kelola User'
  if (path.includes('/master/guru')) return 'Kelola Data Guru'
  if (path.includes('/master/siswa')) return 'Kelola Data Siswa'
  if (path.includes('/akademik/tahun-ajaran')) return 'Kelola Tahun Ajaran'
  if (path.includes('/akademik/semester')) return 'Kelola Semester'
  if (path.includes('/akademik/kelas')) return 'Kelola Kelas'
  if (path.includes('/akademik/mata-pelajaran')) return 'Kelola Mata Pelajaran'
  if (path.includes('/akademik/teaching-assignments')) return 'Penugasan Mengajar'
  if (path.includes('/akademik/homerooms')) return 'Wali Kelas'
  if (path.includes('/akademik/pembagian-kelas')) return 'Pembagian Kelas Siswa'
  if (path.includes('/moodle/sinkronisasi')) return 'Sinkronisasi Moodle'
  if (path.includes('/moodle/course')) return 'Course Moodle'
  if (path.includes('/moodle/nilai')) return 'Cek Nilai Per Kelas'
  if (path.includes('/monitoring/activity-log')) return 'Activity Log'
  if (path.includes('/settings')) return 'Pengaturan Sistem'
  return 'Panel Admin'
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
      console.error('[AdminLayout] Logout gagal:', error)
    } finally {
      loading.value = false
    }
  } else {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 flex">
    <!-- Desktop Sidebar -->
    <div class="hidden lg:block fixed inset-y-0 left-0 z-30 w-64">
      <AdminSidebar />
    </div>

    <!-- Mobile Slideover Sidebar -->
    <USlideover
      v-model:open="isMobileSidebarOpen"
      side="left"
      title="Menu Navigasi Admin"
    >
      <template #content>
        <AdminSidebar
          is-mobile
          @close="isMobileSidebarOpen = false"
        />
      </template>
    </USlideover>

    <!-- Main Wrapper -->
    <div class="flex-1 flex flex-col min-w-0 lg:pl-64">
      <!-- Top Navbar Header -->
      <header class="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
        <div class="flex items-center gap-3">
          <!-- Mobile Menu Toggle Button -->
          <UButton
            icon="i-lucide-menu"
            color="neutral"
            variant="ghost"
            class="lg:hidden cursor-pointer"
            aria-label="Open Sidebar"
            @click="() => { isMobileSidebarOpen = true }"
          />

          <!-- Current Page Breadcrumb / Title -->
          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-gray-400 hidden sm:inline-block">Admin /</span>
            <h1 class="text-base font-bold text-gray-900 dark:text-white truncate">
              {{ pageTitle }}
            </h1>
          </div>
        </div>

        <!-- Top Right Actions -->
        <div class="flex items-center gap-2 sm:gap-3">
          <UColorModeButton />

          <USeparator
            orientation="vertical"
            class="h-6"
          />

          <!-- User Info & Logout Button -->
          <div
            v-if="authStore.user"
            class="flex items-center gap-2"
          >
            <div class="hidden md:flex flex-col text-right">
              <span class="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[160px]">
                {{ authStore.user.fullname }}
              </span>
              <span class="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {{ authStore.user.role }}
              </span>
            </div>

            <UDropdownMenu
              :items="[
                [{
                  label: authStore.user.fullname,
                  slot: 'account',
                  disabled: true
                }],
                [{
                  label: 'Logout',
                  icon: 'i-lucide-log-out',
                  color: 'error',
                  onSelect: handleLogout
                }]
              ]"
            >
              <UAvatar
                src="https://i.pravatar.cc/150?u=admin"
                :alt="authStore.user.fullname"
                size="sm"
                class="cursor-pointer ring-2 ring-primary-500/20"
              />
            </UDropdownMenu>
          </div>
        </div>
      </header>

      <!-- Main Content Area -->
      <main class="flex-1 p-4 sm:p-6 w-full mx-auto">
        <slot />
      </main>


    </div>
  </div>
</template>
