import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

export const useUsersStore = defineStore('users', () => {
  const users = ref([])
  const loading = ref(false)

  async function fetchUsers() {
    loading.value = true
    try {
      const [profilesResult, tripsResult] = await Promise.all([
        supabase.from('profiles').select('id, email, created_at').order('created_at', { ascending: true }),
        supabase.from('trips').select('user_id')
      ])

      if (profilesResult.error) throw profilesResult.error
      if (tripsResult.error) throw tripsResult.error

      const tripCountMap = {}
      for (const trip of tripsResult.data || []) {
        tripCountMap[trip.user_id] = (tripCountMap[trip.user_id] || 0) + 1
      }

      users.value = (profilesResult.data || []).map(profile => ({
        ...profile,
        tripCount: tripCountMap[profile.id] || 0
      }))
    } finally {
      loading.value = false
    }
  }

  return { users, loading, fetchUsers }
})
