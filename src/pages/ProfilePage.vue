<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { useTripsStore } from '@/stores/trips'
import { useTagsStore } from '@/stores/tags'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const toastStore = useToastStore()
const tripsStore = useTripsStore()
const tagsStore = useTagsStore()

const loggingOut = ref(false)
const showLogoutModal = ref(false)

async function handleLogout() {
  loggingOut.value = true
  try {
    await authStore.signOut()
    router.push('/auth/login')
  } catch (err) {
    toastStore.error('Odhlášení selhalo')
  } finally {
    loggingOut.value = false
    showLogoutModal.value = false
  }
}

const appVersion = __APP_VERSION__
</script>

<template>
  <div class="p-4 space-y-4">
    <h1 class="text-xl font-bold text-gray-900 dark:text-white mb-4">Profil</h1>

    <!-- User info card -->
    <div class="card shadow-soft">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span class="text-2xl font-bold text-white">
            {{ authStore.user?.email?.charAt(0).toUpperCase() || '?' }}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-900 dark:text-white truncate">
            {{ authStore.user?.email }}
          </p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            Člen od {{ authStore.user?.created_at ? new Date(authStore.user.created_at).toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' }) : 'nedávna' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Stats card -->
    <div class="card shadow-soft">
      <h2 class="font-semibold text-gray-900 dark:text-white mb-3">Statistiky</h2>
      <div class="grid grid-cols-2 gap-4">
        <div class="text-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
          <div class="text-2xl font-bold text-primary-500">{{ tripsStore.myTrips.length }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Výlety</div>
        </div>
        <div class="text-center p-3 bg-accent-50 dark:bg-accent-900/20 rounded-xl">
          <div class="text-2xl font-bold text-accent-500">{{ tagsStore.tags.length }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tagy</div>
        </div>
      </div>
    </div>

    <!-- App info -->
    <div class="card shadow-soft">
      <h2 class="font-semibold text-gray-900 dark:text-white mb-3">O aplikaci</h2>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Verze</span>
          <span class="font-mono text-gray-900 dark:text-white">{{ appVersion }}</span>
        </div>
        <div class="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Technologie</span>
          <span class="text-gray-900 dark:text-white">Vue 3 + Supabase</span>
        </div>
      </div>
    </div>

    <!-- Logout button -->
    <AppButton
      variant="danger"
      :full-width="true"
      size="lg"
      @click="showLogoutModal = true"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
      Odhlásit se
    </AppButton>

    <!-- Logout confirmation modal -->
    <AppModal
      :show="showLogoutModal"
      title="Odhlásit se"
      @close="showLogoutModal = false"
    >
      <p class="text-gray-600 dark:text-gray-400">Opravdu se chcete odhlásit?</p>

      <template #footer>
        <AppButton variant="secondary" @click="showLogoutModal = false">Zrušit</AppButton>
        <AppButton variant="danger" @click="handleLogout" :loading="loggingOut">Odhlásit</AppButton>
      </template>
    </AppModal>
  </div>
</template>
