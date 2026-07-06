import type { User } from '~/types'

export default defineNuxtRouteMiddleware(async (to) => {
  const userState = useState<User | null>('user')

  if (!userState.value) {
    const { data } = await useFetch('/api/auth/me', {
      credentials: 'include'
    })

    if (data.value) {
      userState.value = data.value
    }
  }

  const required = to.meta.role as string | undefined
  if (!required) return

  if (userState.value?.role !== required) {
    return navigateTo('/login')
  }
})
