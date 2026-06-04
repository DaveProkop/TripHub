<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
const authStore = useAuthStore()

const password = ref('')
const passwordConfirm = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

async function handleSubmit() {
  error.value = ''

  if (!password.value || !passwordConfirm.value) {
    error.value = 'Vyplňte obě pole'
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
    await authStore.updatePassword(password.value)
    success.value = true
    setTimeout(() => router.push('/map'), 2000)
  } catch (err) {
    error.value = err.message || 'Změna hesla selhala'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Nastavit nové heslo</h2>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Zadejte své nové heslo.</p>

    <div v-if="success" class="p-4 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 rounded-xl">
      <p class="text-sm text-accent-700 dark:text-accent-300 font-medium">Heslo bylo úspěšně změněno!</p>
      <p class="text-sm text-accent-600 dark:text-accent-400 mt-1">Budete přesměrováni...</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-4">
      <AppInput
        v-model="password"
        label="Nové heslo"
        type="password"
        placeholder="Alespoň 6 znaků"
        required
        :disabled="loading"
      />
      <AppInput
        v-model="passwordConfirm"
        label="Potvrzení nového hesla"
        type="password"
        placeholder="Zopakujte nové heslo"
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
        Nastavit heslo
      </AppButton>
    </form>
  </div>
</template>
