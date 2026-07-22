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
  name: 'email',
  type: 'text' as const,
  label: 'Email',
  placeholder: 'Enter your email',
  required: true
}, {
  name: 'password',
  label: 'Password',
  type: 'password' as const,
  placeholder: 'Enter your password'
}, {
  name: 'remember',
  label: 'Remember me',
  type: 'checkbox' as const
}]

// const providers = [{
//   label: 'Google',
//   icon: 'i-simple-icons-google',
//   onClick: () => {
//     toast.add({ title: 'Google', description: 'Login with Google' })
//   }
// }, {
//   label: 'GitHub',
//   icon: 'i-simple-icons-github',
//   onClick: () => {
//     toast.add({ title: 'GitHub', description: 'Login with GitHub' })
//   }
// }]

// Zod schema untuk validasi form login di sisi frontend
const schema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(6, 'Must be at least 6 characters')
})

type Schema = z.output<typeof schema>

/**
 * Handler submit form login.
 * Dipanggil oleh komponen UAuthForm saat user klik tombol "Sign In".
 *
 * Alur:
 * 1. Kirim POST ke /api/auth/login dengan email + password
 * 2. Server memvalidasi kredensial, membuat JWT, menyimpan JWT ke HTTP-only Cookie
 * 3. Server mengembalikan data user { id, email, role, fullname }
 * 4. Frontend menyimpan data user ke Pinia store via authStore.setUser()
 * 5. Redirect ke halaman utama '/'
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
    // res.data berisi { id, email, role, fullname } dari server
    authStore.setUser(res.data)

    // Tampilkan notifikasi sukses ke user
    toast.add({
      title: 'Login berhasil',
      description: `Selamat datang, ${res.data.fullname} 👋`
    })

    // Redirect ke halaman dashboard sesuai role
    await navigateTo('/')
  }
  catch (error: any) {
    // Tampilkan pesan error dari server, atau fallback ke pesan default
    toast.add({
      title: 'Login gagal',
      description: error.data?.message || error.message || 'Email atau password salah',
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
    title="Welcome back"
    icon="i-lucide-lock"
    @submit="onSubmit"
  >
    <template #description>
      Don't have an account? <ULink
        to="/signup"
        class="text-primary font-medium"
      >Sign up</ULink>.
    </template>

    <template #password-hint>
      <ULink
        to="/"
        class="text-primary font-medium"
        tabindex="-1"
      >Forgot password?</ULink>
    </template>

    <template #footer>
      By signing in, you agree to our <ULink
        to="/"
        class="text-primary font-medium"
      >Terms of Service</ULink>.
    </template>
  </UAuthForm>
</template>
