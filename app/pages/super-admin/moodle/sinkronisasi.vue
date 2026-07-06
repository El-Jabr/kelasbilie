<script setup lang="ts">
const toast = useToast()

const moodle = reactive({
  url: '',
  token: ''
})

async function loadSetting() {
  const data = await $fetch('/api/moodle')

  moodle.url = data?.moodleUrl ?? ''
  moodle.token = data?.moodleToken ?? ''
}

onMounted (() => {
  loadSetting()
})

const loading = ref(false)

async function onSubmit() {
  try {
    loading.value = true

    await $fetch('/api/moodle', {
      method: 'POST',
      body: {
        url: moodle.url,
        token: moodle.token
      }
    })

    toast.add({
      title: 'Berhasil',
      description: 'Pengaturan Moodle berhasil disimpan.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    loadSetting()
  } catch (err) {
    toast.add({
      title: 'Gagal',
      description: (err as Error).message || 'Terjadi kesalahan saat menyimpan pengaturan.',
      color: 'error',
      icon: 'i-lucide-circle-alert'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-3xl mx-auto mt-4">
    <h1 class="font-bold text-3xl mt-2 ">
      Sinkronasi Moodle
    </h1>
    <UPageCard
      title="Pengaturan Moodle untuk sinkronisasi data."
      description="Atur URL Moodle dan Web Service Token yang digunakan aplikasi untuk terhubung, mengambil, dan menyinkronkan data dengan server Moodle."
      variant="subtle"
    >
      <UForm
        :state="moodle"
        class="flex flex-col gap-4 max-w-xs"
        @submit="onSubmit"
      >
        <UFormField name="Moodle Url">
          <UInput
            v-model="moodle.url"
            type="text"
            placeholder="Url Moodle"
            class="w-full"
          />
        </UFormField>

        <UFormField name="Moodel web token">
          <UInput
            v-model="moodle.token"
            type="text"
            placeholder="Web token"
            class="w-full"
          />
        </UFormField>

        <UButton
          label="Save"
          class="w-fit"
          type="submit"
          :loading="loading"
        />
      </UForm>
    </UpageCard>
  </div>
</template>
