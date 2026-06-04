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
const passwordConfirm = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

async function handleSubmit() {
  error.value = ''

  if (!email.value || !password.value || !passwordConfirm.value) {
    error.value = 'Vyplňte všechna pole'
    return
  }
  if (password.value.length < 6) {
    error.value = 'Heslo musí mít alespoň 6 znaků'
    return
  }
  if (password.value !== passwordConfirm.value) {
    error.value = 'Hesla se neshodují'
    return
  }

  loading.value = true
  try {
    await authStore.signUp(email.value, password.value)
    success.value = true
  } catch (err) {
    error.value = err.message || 'Registrace selhala'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-6">Registrace</h2>

    <div v-if="success" class="p-4 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-xl mb-4">
      <p class="text-sm text-accent-700 dark:text-accent-300 font-medium">Registrace proběhla úspěšně!</p>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">Zkontrolujte svůj email a potvrďte účet.</p>
      <router-link to="/auth/login" class="mt-3 inline-block text-sm text-primary-500 hover:underline font-medium">
        Přejít na přihlášení
      </router-link>
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
      <AppInput
        v-model="password"
        label="Heslo"
        type="password"
        placeholder="Alespoň 6 znaků"
        required
        :disabled="loading"
      />
      <AppInput
        v-model="passwordConfirm"
        label="Potvrzení hesla"
        type="password"
        placeholder="Zopakujte heslo"
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
        Zaregistrovat se
      </AppButton>
    </form>

    <div class="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Již máte účet?
        <router-link to="/auth/login" class="text-primary-500 hover:text-primary-600 font-medium hover:underline">
          Přihlaste se
        </router-link>
      </p>
    </div>
  </div>
</template>
