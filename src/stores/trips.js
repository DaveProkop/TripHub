import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useTripsStore = defineStore('trips', () => {
  const trips = ref([])
  const myTrips = ref([])
  const currentTrip = ref(null)
  const loading = ref(false)

  function mapTripTags(trip) {
    return {
      ...trip,
      tags: (trip.trip_tags || []).map(tt => tt.tags).filter(Boolean)
    }
  }

  async function fetchAllTrips() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*, trip_tags(tag_id, tags(id, name, color, description))')
        .order('created_at', { ascending: false })

      if (error) throw error
      trips.value = (data || []).map(mapTripTags)
    } finally {
      loading.value = false
    }
  }

  async function fetchMyTrips() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*, trip_tags(tag_id, tags(id, name, color, description))')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      myTrips.value = (data || []).map(mapTripTags)
    } finally {
      loading.value = false
    }
  }

  async function getTrip(id) {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('trips')
        .select('*, trip_tags(tag_id, tags(id, name, color, description))')
        .eq('id', id)
        .single()

      if (error) throw error
      currentTrip.value = mapTripTags(data)
      return currentTrip.value
    } finally {
      loading.value = false
    }
  }

  async function createTrip(tripData, tagIds = []) {
    const authStore = useAuthStore()
    const { data: trip, error } = await supabase
      .from('trips')
      .insert({
        name: tripData.name,
        description: tripData.description,
        lat: tripData.lat,
        lng: tripData.lng,
        photos: tripData.photos || [],
        parking_lat: tripData.parking_lat || null,
        parking_lng: tripData.parking_lng || null,
        parking_description: tripData.parking_description || '',
        user_id: authStore.user.id
      })
      .select()
      .single()

    if (error) throw error

    if (tagIds.length > 0) {
      const tripTagRows = tagIds.map(tag_id => ({ trip_id: trip.id, tag_id }))
      const { error: tagError } = await supabase.from('trip_tags').insert(tripTagRows)
      if (tagError) throw tagError
    }

    await fetchMyTrips()
    return trip
  }

  async function updateTrip(id, tripData, tagIds = []) {
    const { error } = await supabase
      .from('trips')
      .update({
        name: tripData.name,
        description: tripData.description,
        lat: tripData.lat,
        lng: tripData.lng,
        photos: tripData.photos || [],
        parking_lat: tripData.parking_lat || null,
        parking_lng: tripData.parking_lng || null,
        parking_description: tripData.parking_description || '',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error

    // Replace tags
    await supabase.from('trip_tags').delete().eq('trip_id', id)

    if (tagIds.length > 0) {
      const tripTagRows = tagIds.map(tag_id => ({ trip_id: id, tag_id }))
      const { error: tagError } = await supabase.from('trip_tags').insert(tripTagRows)
      if (tagError) throw tagError
    }

    await fetchMyTrips()
  }

  async function deleteTrip(id) {
    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', id)

    if (error) throw error
    myTrips.value = myTrips.value.filter(t => t.id !== id)
    trips.value = trips.value.filter(t => t.id !== id)
  }

  return {
    trips,
    myTrips,
    currentTrip,
    loading,
    fetchAllTrips,
    fetchMyTrips,
    getTrip,
    createTrip,
    updateTrip,
    deleteTrip
  }
})
