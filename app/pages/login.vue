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

const toast = useToast()

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

const schema = z.object({
  email: z.email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  try {
    const res = await $fetch('api/auth/login', {
      method: 'POST',
      body: payload.data,
      credentials: 'include' // 🔥 WAJIB agar cookie tersimpan
    })

    console.log('Login response:', res)

    toast.add({
      title: 'Login successful',
      description: 'Selamat datang 👋'
    })

    // // optional: ambil user untuk cek
    // await $fetch('/api/auth/me', {
    //   credentials: 'include'
    // })

    // redirect
    const userState = useState('user')
    userState.value = res.user

    console.log('User state after login:', userState.value)
    await navigateTo('/')
  } catch (err) {
    toast.add({
      title: 'Login gagal',
      description: (err as Error).message || 'Email atau password salah',
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
