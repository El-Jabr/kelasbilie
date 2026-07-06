export default defineNuxtRouteMiddleware(async () => {
  const userState = useState('user')

  try {
    const user = await $fetch('/api/auth/me', {
      credentials: 'include'
    })

    userState.value = user
  } catch {
    userState.value = null
    // return navigateTo('/login')
  }
})
