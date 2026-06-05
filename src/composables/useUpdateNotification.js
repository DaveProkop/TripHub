import { inject } from 'vue'

export function useUpdateNotification() {
  const needRefresh = inject('sw-need-refresh')
  const updateServiceWorker = inject('sw-update')

  async function update() {
    await updateServiceWorker?.(true)
  }

  return { needRefresh, update }
}
