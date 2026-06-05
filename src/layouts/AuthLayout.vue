<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const isStandalone = window.matchMedia('(display-mode: standalone)').matches
const canInstall = ref(!!window.__pwaInstallEvent)

function handleInstallAvailable() {
  canInstall.value = true
}

onMounted(() => {
  window.addEventListener('pwa-install-available', handleInstallAvailable)
})

onUnmounted(() => {
  window.removeEventListener('pwa-install-available', handleInstallAvailable)
})

async function triggerInstall() {
  if (!window.__pwaInstallEvent) return
  window.__pwaInstallEvent.prompt()
  await window.__pwaInstallEvent.userChoice
  window.__pwaInstallEvent = null
  canInstall.value = false
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
    <!-- Theme toggle top right -->
    <div class="absolute top-4 right-4">
      <button
        @click="themeStore.toggle()"
        class="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-card text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors"
        aria-label="Toggle dark mode"
      >
        <svg v-if="themeStore.isDark" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 flex items-center justify-center p-4">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-2xl shadow-lg mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">TripHub</h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">Tipy na výlety na jednom místě</p>
        </div>

        <!-- Auth card -->
        <div class="card shadow-soft">
          <router-view />
        </div>

        <!-- Install hint -->
        <div v-if="!isStandalone" class="mt-6 text-center">
          <button
            v-if="canInstall"
            @click="triggerInstall"
            class="inline-flex items-center gap-1.5 text-sm text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Přidat TripHub na plochu
          </button>
          <p v-else class="text-xs text-gray-400 dark:text-gray-500">
            Přidej na plochu přes menu prohlížeče → Přidat na plochu
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
