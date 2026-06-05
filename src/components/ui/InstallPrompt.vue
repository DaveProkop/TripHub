<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const installPromptEvent = ref(null)
const showPrompt = ref(false)
const DISMISSED_KEY = 'pwa-install-dismissed'

function handleBeforeInstallPrompt(e) {
  e.preventDefault()
  if (localStorage.getItem(DISMISSED_KEY)) return
  installPromptEvent.value = e
  showPrompt.value = true
}

function handleAppInstalled() {
  showPrompt.value = false
  installPromptEvent.value = null
}

async function install() {
  if (!installPromptEvent.value) return
  installPromptEvent.value.prompt()
  const { outcome } = await installPromptEvent.value.userChoice
  installPromptEvent.value = null
  showPrompt.value = false
  if (outcome === 'accepted') {
    localStorage.setItem(DISMISSED_KEY, '1')
  }
}

function dismiss() {
  showPrompt.value = false
  localStorage.setItem(DISMISSED_KEY, '1')
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.removeEventListener('appinstalled', handleAppInstalled)
})
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="showPrompt"
      class="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-between gap-3 bg-gray-900 dark:bg-gray-700 text-white px-4 py-3 rounded-2xl shadow-lg"
    >
      <div class="flex items-center gap-2 min-w-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-primary-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span class="text-sm font-medium truncate">Přidat TripHub na plochu</span>
      </div>
      <div class="flex items-center gap-2 flex-shrink-0">
        <button
          @click="install"
          class="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Instalovat
        </button>
        <button
          @click="dismiss"
          class="p-1.5 text-gray-400 hover:text-white transition-colors"
          aria-label="Zavřít"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
