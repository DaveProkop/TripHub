<script setup>
import { computed, provide } from 'vue'
import { useRoute } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'

const route = useRoute()
const isAuthLayout = computed(() => route.meta.layout === 'auth')

// SW registration here ensures it runs regardless of auth state
const { needRefresh, updateServiceWorker } = useRegisterSW({
  onRegistered(r) { console.log('SW registered:', r) },
  onRegisterError(error) { console.error('SW registration error:', error) }
})

provide('sw-need-refresh', needRefresh)
provide('sw-update', updateServiceWorker)
</script>

<template>
  <component :is="isAuthLayout ? AuthLayout : AppLayout" />
</template>
