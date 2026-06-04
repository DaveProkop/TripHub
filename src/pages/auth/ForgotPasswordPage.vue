<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const authStore = useAuthStore()

const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

async function handleSubmit() {
  error.value = ''
  if (!email.value) {
    error.value = 'Zadejte email'
    return
  }
  loading.value = true
  try {
    await authStore.resetPassword(email.value)
    success.value = true
  } catch (err) {
    error.value = err.message || 'Odeslání emailu selhalo'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Zapomenuté heslo</h2>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Zadejte svůj email a pošleme vám odkaz na obnovení hesla.</p>

    <div v-if="success" class="p-4 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-xl">
      <p class="text-sm text-accent-700 dark:text-accent-300 font-medium">Email odeslán!</p>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">Zkontrolujte svou emailovou schránku a klikněte na odkaz pro obnovení hesla.</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-4">
      <AppInput
        v-model="email"
        label="Email"
        type="email"
        placeholder="vas@email.cz"
        required
        :disabled="loading"
      />

      <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
        {{ error }}
      </div>

      <AppButton
        type="submit"
        variant="primary"
        :loading="loading"
        :full-width="true"
        size="lg"
      >
        Odeslat odkaz
      </AppButton>
    </form>

    <div class="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
      <router-link to="/auth/login" class="text-sm text-primary-500 hover:text-primary-600 hover:underline">
        Zpět na přihlášení
      </router-link>
    </div>
  </div>
</template>
