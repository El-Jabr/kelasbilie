<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Login',
  description: 'Login to your account to continue'
})

// Instance toast untuk menampilkan notifikasi
const toast = useToast()

// Pinia Auth Store — satu-satunya tempat menyimpan state user
const authStore = useAuthStore()

// Definisi field-field pada form login
const fields = [{
  name: 'username',
  type: 'text' as const,
  label: 'Username',
  placeholder: 'Masukkan username Anda',
  required: true
}, {
  name: 'password',
  label: 'Password',
  type: 'password' as const,
  placeholder: 'Masukkan password Anda'
}]

// Zod schema untuk validasi form login di sisi frontend
const schema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter')
})

type Schema = z.output<typeof schema>

/**
 * Handler submit form login.
 * Dipanggil oleh komponen UAuthForm saat user klik tombol "Sign In".
 *
 * Alur:
 * 1. Kirim POST ke /api/auth/login dengan username + password
 * 2. Server memvalidasi kredensial, membuat JWT, menyimpan JWT ke HTTP-only Cookie
 * 3. Server mengembalikan data user { id, username, role, fullname }
 * 4. Frontend menyimpan data user ke Pinia store via authStore.setUser()
 * 5. Redirect ke halaman utama sesuai role
 *
 * @param payload - Data form yang sudah divalidasi oleh Zod schema
 */
async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    // Kirim request login ke server
    // credentials: 'include' WAJIB ada agar browser menyimpan cookie dari server
    const res = await $fetch('/api/auth/login', {
      method: 'POST',
      body: payload.data,
      credentials: 'include'
    })

    // Simpan data user ke Pinia store (BUKAN useState!)
    // res.data berisi { id, username, role, fullname } dari server
    authStore.setUser(res.data)

    // Tampilkan notifikasi sukses ke user
    toast.add({
      title: 'Login berhasil',
      description: `Selamat datang, ${res.data.fullname} 👋`
    })

    // Redirect ke halaman dashboard sesuai role
    const role = res.data.role?.toUpperCase()
    if (role === 'SUPER_ADMIN') {
      await navigateTo('/super-admin')
    } else if (role === 'ADMIN' || role === 'TEACHER') {
      await navigateTo('/teacher')
    } else if (role === 'STUDENT') {
      await navigateTo('/student')
    } else {
      await navigateTo('/')
    }
  }
  catch (error: any) {
    // Tampilkan pesan error dari server, atau fallback ke pesan default
    toast.add({
      title: 'Login gagal',
      description: error.data?.message || error.message || 'Username atau password salah',
      color: 'error'
    })
  }
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    :loading-auto="true"
    title="Selamat Datang"
    description="Masuk ke portal akademik Kelas Bilie"
    icon="i-lucide-lock"
    @submit="onSubmit"
  >
    <template #footer>
      Dengan masuk, Anda menyetujui <ULink
        to="/"
        class="text-primary font-medium"
      >Ketentuan Penggunaan</ULink>.
    </template>
  </UAuthForm>
</template>
