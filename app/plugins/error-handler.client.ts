export default defineNuxtPlugin((nuxtApp) => {
  const sendErrorLog = (error: any, info?: string) => {
    try {
      const message = error?.message || String(error)
      const stack = error?.stack || ''
      const url = window.location.href

      $fetch('/api/monitoring/client-log', {
        method: 'POST',
        body: {
          level: 'error',
          message: message,
          details: {
            info,
            stack,
            url,
            userAgent: navigator.userAgent
          }
        }
      }).catch(() => {
        // Abaikan jika fetch log gagal
      })
    } catch {
      // Ignore
    }
  }

  nuxtApp.vueApp.config.errorHandler = (error, _instance, info) => {
    console.error('[Vue Error]', error, info)
    sendErrorLog(error, info)
  }

  if (import.meta.client) {
    window.addEventListener('error', (event) => {
      if (event.error) {
        sendErrorLog(event.error, 'window.onerror')
      }
    })

    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason) {
        sendErrorLog(event.reason, 'unhandledrejection')
      }
    })
  }
})
