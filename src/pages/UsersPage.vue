<script setup>
import { onMounted, computed } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'

const usersStore = useUsersStore()
const authStore = useAuthStore()

onMounted(() => usersStore.fetchUsers())

function initials(email) {
  return email ? email[0].toUpperCase() : '?'
}

function avatarColor(email) {
  const colors = [
    'bg-indigo-500', 'bg-violet-500', 'bg-pink-500', 'bg-rose-500',
    'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-sky-500'
  ]
  let hash = 0
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
}

const sortedUsers = computed(() =>
  [...usersStore.users].sort((a, b) => b.tripCount - a.tripCount)
)
</script>

<template>
  <div class="p-4">
    <div class="mb-4">
      <h1 class="text-xl font-bold text-gray-900 dark:text-white">Uživatelé</h1>
      <p class="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
        {{ usersStore.users.length }} registrovaných
      </p>
    </div>

    <!-- Loading -->
    <div v-if="usersStore.loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="card animate-pulse flex items-center gap-3">
        <div class="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"></div>
        <div class="flex-1">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2"></div>
          <div class="h-3 bg-gray-100 dark:bg-gray-600 rounded w-1/3"></div>
        </div>
      </div>
    </div>

    <!-- List -->
    <div v-else class="space-y-2 pb-4">
      <div
        v-for="user in sortedUsers"
        :key="user.id"
        class="card flex items-center gap-3"
      >
        <!-- Avatar -->
        <div
          class="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          :class="avatarColor(user.email)"
        >
          {{ initials(user.email) }}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-medium text-gray-900 dark:text-white truncate text-sm">
              {{ user.email }}
            </span>
            <span
              v-if="user.id === authStore.user?.id"
              class="text-xs bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300 px-1.5 py-0.5 rounded-md font-medium flex-shrink-0"
            >
              Ty
            </span>
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Člen od {{ formatDate(user.created_at) }}
          </p>
        </div>

        <!-- Trip count -->
        <div class="flex-shrink-0 text-right">
          <div class="text-lg font-bold text-gray-900 dark:text-white leading-none">
            {{ user.tripCount }}
          </div>
          <div class="text-xs text-gray-400 dark:text-gray-500">
            {{ user.tripCount === 1 ? 'výlet' : user.tripCount >= 2 && user.tripCount <= 4 ? 'výlety' : 'výletů' }}
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="!usersStore.loading && usersStore.users.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
        <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300">Žádní uživatelé</h3>
      </div>
    </div>
  </div>
</template>
