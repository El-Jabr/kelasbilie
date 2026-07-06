import { defineStore } from 'pinia'
import type { User } from '~~/prisma/generated/client'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  function setUser(data: User | null) {
    user.value = data
  }

  function setToken(jwt: string) {
    token.value = jwt
  }

  function logout() {
    user.value = null
    token.value = null
  }

  return {
    user,
    token,
    isAuthenticated,
    setUser,
    setToken,
    logout
  }
})