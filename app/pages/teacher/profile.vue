<script setup lang="ts">
definePageMeta({
  layout: 'teacher',
  middleware: ['auth', 'role'],
  role: ['TEACHER', 'ADMIN']
})

const toast = useToast()

const { data: teacherRes, pending, refresh } = await useFetch('/api/teachers/me')
const teacher = computed(() => teacherRes.value?.data)

const state = reactive({
  nip: ''
})

watch(teacher, (val) => {
  if (val) {
    state.nip = val.nip || ''
  }
}, { immediate: true })

const isSaving = ref(false)

async function onSubmit() {
  if (!teacher.value) return
  isSaving.value = true

  try {
    await $fetch(`/api/teachers/${teacher.value.id}`, {
      method: 'PATCH',
      body: {
        nip: state.nip
      }
    })

    toast.add({
      title: 'Berhasil',
      description: 'Profil Anda telah diperbarui.',
      color: 'success'
    })
    await refresh()
  } catch (err: any) {
    toast.add({
      title: 'Gagal',
      description: err.data?.statusMessage || 'Gagal memperbarui profil.',
      color: 'error'
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Profil Saya</h1>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Kelola dan perbarui data profil guru Anda.
      </p>
    </div>

    <UCard v-if="pending">
      <USkeleton class="h-64 rounded-xl" />
    </UCard>

    <UCard v-else-if="teacher">
      <template #header>
        <div class="flex items-center gap-3">
          <UAvatar
            src="https://i.pravatar.cc/150?u=teacher"
            size="lg"
          />
          <div>
            <h2 class="text-base font-bold text-gray-900 dark:text-white">
              {{ teacher.user?.fullname }}
            </h2>
            <UBadge color="success" variant="subtle" size="xs">
              Role: {{ teacher.user?.role }}
            </UBadge>
          </div>
        </div>
      </template>

      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Nama Lengkap
          </label>
          <UInput
            :model-value="teacher.user?.fullname"
            disabled
            icon="i-lucide-user"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Username
          </label>
          <UInput
            :model-value="teacher.user?.username"
            disabled
            icon="i-lucide-at-sign"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <UInput
            :model-value="teacher.user?.email || '-'"
            disabled
            icon="i-lucide-mail"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            NIP (Nomor Induk Pegawai)
          </label>
          <UInput
            v-model="state.nip"
            icon="i-lucide-id-card"
            placeholder="Masukkan NIP Anda"
          />
        </div>

        <div class="pt-4 flex justify-end">
          <UButton
            type="submit"
            color="success"
            variant="solid"
            icon="i-lucide-save"
            :loading="isSaving"
          >
            Simpan Perubahan
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>
