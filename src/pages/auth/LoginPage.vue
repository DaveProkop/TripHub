<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = 'Vyplňte email a heslo'
    return
  }
  loading.value = true
  try {
    await authStore.signIn(email.value, password.value)
    router.push('/map')
  } catch (err) {
    error.value = err.message || 'Přihlášení selhalo'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">Přihlášení</h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <AppInput
        v-model="email"
        label="Email"
        type="email"
        placeholder="vas@email.cz"
        required
        :disabled="loading"
      />
      <AppInput
        v-model="password"
        label="Heslo"
        type="password"
        placeholder="••••••••"
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
        Přihlásit se
      </AppButton>
    </form>

    <div class="mt-4 text-center">
      <router-link
        to="/auth/forgot-password"
        class="text-sm text-primary-500 hover:text-primary-600 hover:underline"
      >
        Zapomněli jste heslo?
      </router-link>
    </div>

    <div class="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Nemáte účet?
        <router-link to="/auth/register" class="text-primary-500 hover:text-primary-600 font-medium hover:underline">
          Zaregistrujte se
        </router-link>
      </p>
    </div>
  </div>
</template>
