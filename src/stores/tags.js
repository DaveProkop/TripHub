import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'

export const useTagsStore = defineStore('tags', () => {
  const tags = ref([])
  const loading = ref(false)

  async function fetchTags() {
    const authStore = useAuthStore()
    if (!authStore.user) return

    loading.value = true
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      tags.value = data || []
    } finally {
      loading.value = false
    }
  }

  async function createTag(tagData) {
    const authStore = useAuthStore()
    const { data, error } = await supabase
      .from('tags')
      .insert({
        ...tagData,
        user_id: authStore.user.id
      })
      .select()
      .single()

    if (error) throw error
    tags.value.unshift(data)
    return data
  }

  async function updateTag(id, tagData) {
    const { data, error } = await supabase
      .from('tags')
      .update({ ...tagData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    const idx = tags.value.findIndex(t => t.id === id)
    if (idx !== -1) tags.value[idx] = data
    return data
  }

  async function deleteTag(id) {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id)

    if (error) throw error
    tags.value = tags.value.filter(t => t.id !== id)
  }

  return { tags, loading, fetchTags, createTag, updateTag, deleteTag }
})
