import { useRegisterSW } from 'virtual:pwa-register/vue'

export function useUpdateNotification() {
  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
      console.log('SW registered:', r)
    },
    onRegisterError(error) {
      console.error('SW registration error:', error)
    }
  })

  async function update() {
    await updateServiceWorker(true)
  }

  return { needRefresh, update }
}
