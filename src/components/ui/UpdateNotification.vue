<script setup>
import { useUpdateNotification } from '@/composables/useUpdateNotification'

const { needRefresh, update } = useUpdateNotification()
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="needRefresh"
      class="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-between gap-3 bg-gray-900 dark:bg-gray-700 text-white px-4 py-3 rounded-2xl shadow-lg"
    >
      <div class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-accent-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span class="text-sm font-medium">Dostupná aktualizace</span>
      </div>
      <button
        @click="update"
        class="px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-colors flex-shrink-0"
      >
        Aktualizovat
      </button>
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
