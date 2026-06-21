import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useVisitsStore = defineStore('visits', () => {
  const visits = ref([])
  const myVisit = ref(null)
  const loading = ref(false)

  async function fetchVisits(tripId) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('trip_visits')
        .select('*, profiles(email)')
        .eq('trip_id', tripId)
        .order('visited_at', { ascending: false })
      if (error) throw error
      const authStore = useAuthStore()
      visits.value = data || []
      myVisit.value = visits.value.find(v => v.user_id === authStore.user?.id) ?? null
    } finally {
      loading.value = false
    }
  }

  async function setVisited(tripId, visited) {
    const authStore = useAuthStore()
    if (visited) {
      const { data, error } = await supabase
        .from('trip_visits')
        .upsert({ trip_id: tripId, user_id: authStore.user.id }, { onConflict: 'trip_id,user_id' })
        .select('*, profiles(email)')
        .single()
      if (error) throw error
      myVisit.value = data
      const idx = visits.value.findIndex(v => v.user_id === authStore.user.id)
      if (idx !== -1) visits.value[idx] = data
      else visits.value.unshift(data)
    } else {
      const { error } = await supabase
        .from('trip_visits')
        .delete()
        .eq('trip_id', tripId)
        .eq('user_id', authStore.user.id)
      if (error) throw error
      myVisit.value = null
      visits.value = visits.value.filter(v => v.user_id !== authStore.user.id)
    }
  }

  async function updatePhotos(tripId, photos) {
    const authStore = useAuthStore()
    const { data, error } = await supabase
      .from('trip_visits')
      .update({ photos })
      .eq('trip_id', tripId)
      .eq('user_id', authStore.user.id)
      .select('*, profiles(email)')
      .single()
    if (error) throw error
    myVisit.value = data
    const idx = visits.value.findIndex(v => v.user_id === authStore.user.id)
    if (idx !== -1) visits.value[idx] = data
  }

  function reset() {
    visits.value = []
    myVisit.value = null
  }

  return { visits, myVisit, loading, fetchVisits, setVisited, updatePhotos, reset }
})
