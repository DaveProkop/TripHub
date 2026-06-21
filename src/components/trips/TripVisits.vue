<script setup>
import { ref, computed, watch } from 'vue'
import { useVisitsStore } from '@/stores/visits'
import { useAuthStore } from '@/stores/auth'
import { usePhotoUpload } from '@/composables/usePhotoUpload'
import { useToastStore } from '@/stores/toast'

const props = defineProps({ tripId: { type: String, required: true } })

const visitsStore = useVisitsStore()
const authStore = useAuthStore()
const toastStore = useToastStore()
const { uploadFile } = usePhotoUpload()

const isToggling = ref(false)
const myPhotos = ref([]) // { id, url, previewUrl, uploading, error }

watch(() => props.tripId, id => { if (id) visitsStore.fetchVisits(id) }, { immediate: true })

watch(() => visitsStore.myVisit, visit => {
  myPhotos.value = (visit?.photos ?? []).map(url => ({
    id: crypto.randomUUID(), url, previewUrl: url, uploading: false, error: null
  }))
}, { immediate: true })

const isVisited = computed(() => !!visitsStore.myVisit)
const otherVisits = computed(() => visitsStore.visits.filter(v => v.user_id !== authStore.user?.id))

async function toggleVisit() {
  if (isToggling.value) return
  isToggling.value = true
  try {
    await visitsStore.setVisited(props.tripId, !isVisited.value)
  } catch (e) {
    toastStore.error('Chyba: ' + e.message)
  } finally {
    isToggling.value = false
  }
}

async function handlePhotoSelect(event) {
  const files = Array.from(event.target.files || [])
  const remaining = 6 - myPhotos.value.length
  event.target.value = ''
  if (!remaining) return

  for (const file of files.slice(0, remaining)) {
    const idx = myPhotos.value.length
    myPhotos.value.push({
      id: crypto.randomUUID(), url: null,
      previewUrl: URL.createObjectURL(file),
      uploading: true, error: null
    })
    const photo = myPhotos.value[idx]
    try {
      photo.url = await uploadFile(file, 'visits')
    } catch (e) {
      photo.error = 'Selhalo'
    } finally {
      photo.uploading = false
    }
    await _savePhotos()
  }
}

async function removeMyPhoto(id) {
  myPhotos.value = myPhotos.value.filter(p => p.id !== id)
  await _savePhotos()
}

async function _savePhotos() {
  const urls = myPhotos.value.filter(p => p.url && !p.uploading).map(p => p.url)
  try {
    await visitsStore.updatePhotos(props.tripId, urls)
  } catch (e) {
    toastStore.error('Ukládání fotek selhalo')
  }
}

function displayName(visit) {
  const email = visit.profiles?.email || ''
  return email.split('@')[0] || 'Uživatel'
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="card shadow-soft">
    <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      Byl jsem tam
    </h3>

    <!-- My visit row -->
    <div class="p-3 rounded-xl border transition-colors"
      :class="isVisited
        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
        : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'">

      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 min-w-0">
          <div class="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {{ authStore.user?.email?.[0]?.toUpperCase() ?? '?' }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white">Já</p>
            <p v-if="isVisited" class="text-xs text-gray-400 dark:text-gray-500 truncate">
              {{ formatDate(visitsStore.myVisit.visited_at) }}
            </p>
          </div>
        </div>

        <button @click="toggleVisit" :disabled="isToggling"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex-shrink-0 disabled:opacity-60"
          :class="isVisited
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'">
          <svg v-if="isToggling" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <svg v-else-if="isVisited" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {{ isVisited ? 'Byl jsem tam' : 'Označit' }}
        </button>
      </div>

      <!-- My photos (visible when visited) -->
      <div v-if="isVisited" class="mt-3">
        <div v-if="myPhotos.length > 0" class="grid grid-cols-3 gap-2 mb-2">
          <div v-for="photo in myPhotos" :key="photo.id"
            class="relative aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
            <img v-if="photo.previewUrl" :src="photo.previewUrl" class="w-full h-full object-cover" />
            <div v-if="photo.uploading" class="absolute inset-0 flex items-center justify-center bg-black/40">
              <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div v-else-if="photo.error" class="absolute inset-0 flex items-center justify-center bg-red-500/80">
              <p class="text-white text-xs text-center px-1">{{ photo.error }}</p>
            </div>
            <button v-if="!photo.uploading" type="button" @click="removeMyPhoto(photo.id)"
              class="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <label v-if="myPhotos.length < 6"
          class="flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600 cursor-pointer font-medium">
          <input type="file" accept="image/*" multiple class="hidden" @change="handlePhotoSelect" />
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Přidat moje fotky <span class="text-xs text-gray-400 font-normal">({{ myPhotos.length }}/6)</span>
        </label>
      </div>
    </div>

    <!-- Other visitors -->
    <div v-if="otherVisits.length > 0" class="mt-4 space-y-4">
      <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Ostatní návštěvníci</p>
      <div v-for="visit in otherVisits" :key="visit.id" class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-bold flex-shrink-0">
          {{ displayName(visit)[0]?.toUpperCase() ?? '?' }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-2 flex-wrap">
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ displayName(visit) }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500">{{ formatDate(visit.visited_at) }}</p>
          </div>
          <div v-if="visit.photos?.length > 0" class="mt-2 grid grid-cols-3 gap-1.5">
            <div v-for="(url, i) in visit.photos" :key="i"
              class="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img :src="url" class="w-full h-full object-cover" @error="$event.target.style.display='none'" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="!isVisited && !visitsStore.loading" class="mt-3 text-sm text-gray-400 dark:text-gray-500 text-center">
      Zatím nikdo tento výlet nenavštívil.
    </div>
  </div>
</template>
