<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTripsStore } from '@/stores/trips'
import { useToastStore } from '@/stores/toast'
import { useAuthStore } from '@/stores/auth'
import TripForm from '@/components/trips/TripForm.vue'
import TripVisits from '@/components/trips/TripVisits.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import TripMap from '@/components/map/TripMap.vue'

function renderMarkdown(text) {
  if (!text) return ''
  let html = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
  const lines = html.split('\n')
  const result = []
  let inList = false
  for (const line of lines) {
    if (line.match(/^[-*] /)) {
      if (!inList) { result.push('<ul>'); inList = true }
      result.push(`<li>${line.slice(2)}</li>`)
    } else {
      if (inList) { result.push('</ul>'); inList = false }
      result.push(line.trim() === '' ? '<br>' : `<p>${line}</p>`)
    }
  }
  if (inList) result.push('</ul>')
  return result.join('')
}

const props = defineProps({
  mode: {
    type: String,
    default: 'view',
    validator: v => ['view', 'new', 'edit'].includes(v)
  },
  id: {
    type: String,
    default: null
  }
})

const router = useRouter()
const tripsStore = useTripsStore()
const toastStore = useToastStore()
const authStore = useAuthStore()

const trip = ref(null)
const loading = ref(false)
const formLoading = ref(false)
const showDeleteModal = ref(false)
const lightboxIndex = ref(null)

function onKeydown(e) {
  if (lightboxIndex.value === null) return
  if (e.key === 'Escape') lightboxIndex.value = null
  if (e.key === 'ArrowLeft' && lightboxIndex.value > 0) lightboxIndex.value--
  if (e.key === 'ArrowRight' && lightboxIndex.value < trip.value.photos.length - 1) lightboxIndex.value++
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

const isOwner = computed(() => {
  return trip.value && authStore.user && trip.value.user_id === authStore.user.id
})

const pageTitle = computed(() => {
  if (props.mode === 'new') return 'Nový výlet'
  if (props.mode === 'edit') return 'Upravit výlet'
  return trip.value?.name || 'Detail výletu'
})

onMounted(async () => {
  if (props.id) {
    loading.value = true
    try {
      trip.value = await tripsStore.getTrip(props.id)
    } catch (err) {
      toastStore.error('Výlet nenalezen')
      router.push('/trips')
    } finally {
      loading.value = false
    }
  }
})

async function handleFormSubmit({ tripData, tagIds }) {
  formLoading.value = true
  try {
    if (props.mode === 'new') {
      await tripsStore.createTrip(tripData, tagIds)
      toastStore.success('Výlet byl přidán')
      router.push('/trips')
    } else if (props.mode === 'edit') {
      await tripsStore.updateTrip(props.id, tripData, tagIds)
      toastStore.success('Výlet byl upraven')
      trip.value = await tripsStore.getTrip(props.id)
      router.replace(`/trips/${props.id}`)
    }
  } catch (err) {
    toastStore.error('Uložení selhalo: ' + (err.message || 'Neznámá chyba'))
  } finally {
    formLoading.value = false
  }
}

async function confirmDelete() {
  try {
    await tripsStore.deleteTrip(props.id)
    toastStore.success('Výlet byl smazán')
    router.push('/trips')
  } catch (err) {
    toastStore.error('Smazání selhalo: ' + (err.message || 'Neznámá chyba'))
  }
}
</script>

<template>
  <div class="p-4">
    <!-- Back button + title -->
    <div class="flex items-center gap-3 mb-4">
      <button
        @click="router.back()"
        class="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h1 class="text-xl font-bold text-gray-900 dark:text-white flex-1 min-w-0 truncate">{{ pageTitle }}</h1>

      <!-- Edit/Delete actions in view mode (only owner) -->
      <div v-if="mode === 'view' && isOwner" class="flex gap-2">
        <router-link
          :to="`/trips/${id}/edit`"
          class="p-2 rounded-xl text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
          title="Upravit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </router-link>
        <button
          @click="showDeleteModal = true"
          class="p-2 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Smazat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-16">
      <div class="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <!-- NEW/EDIT FORM MODE -->
    <div v-else-if="mode === 'new' || mode === 'edit'" class="pb-8">
      <div class="card shadow-soft">
        <TripForm
          :initial-data="trip"
          :loading="formLoading"
          @submit="handleFormSubmit"
          @cancel="router.back()"
        />
      </div>
    </div>

    <!-- VIEW MODE -->
    <div v-else-if="mode === 'view' && trip" class="space-y-4 pb-8">
      <!-- Photo gallery -->
      <div v-if="trip.photos && trip.photos.length > 0">
        <div class="grid gap-2" :class="trip.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'">
          <div
            v-for="(photo, index) in trip.photos"
            :key="index"
            class="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer"
            :class="trip.photos.length === 1 ? 'h-56' : 'h-36'"
            @click="lightboxIndex = index"
          >
            <img
              :src="photo"
              :alt="`Fotka ${index + 1}`"
              class="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
              @error="$event.target.parentElement.classList.add('hidden')"
            />
            <!-- Photo count badge on last visible cell -->
            <div v-if="index === 1 && trip.photos.length > 2"
              class="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span class="text-white font-semibold text-lg">+{{ trip.photos.length - 2 }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Lightbox -->
      <Teleport to="body">
        <div v-if="lightboxIndex !== null"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          @click.self="lightboxIndex = null">

          <!-- Close -->
          <button @click="lightboxIndex = null"
            class="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-10">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          <!-- Counter -->
          <div v-if="trip.photos.length > 1"
            class="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm select-none">
            {{ lightboxIndex + 1 }} / {{ trip.photos.length }}
          </div>

          <!-- Image -->
          <img
            :src="trip.photos[lightboxIndex]"
            :key="lightboxIndex"
            class="max-w-full max-h-full object-contain select-none"
            style="padding: 3.5rem 3rem 2rem"
          />

          <!-- Prev -->
          <button v-if="lightboxIndex > 0" @click="lightboxIndex--"
            class="absolute left-2 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <!-- Next -->
          <button v-if="lightboxIndex < trip.photos.length - 1" @click="lightboxIndex++"
            class="absolute right-2 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </Teleport>

      <!-- Main info card -->
      <div class="card shadow-soft">
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">{{ trip.name }}</h2>

        <!-- Tags -->
        <div v-if="trip.tags && trip.tags.length > 0" class="flex flex-wrap gap-1.5 mb-3">
          <AppBadge
            v-for="tag in trip.tags"
            :key="tag.id"
            :label="tag.name"
            :color="tag.color"
          />
        </div>

        <!-- Description rendered as markdown -->
        <div
          v-if="trip.description"
          class="text-gray-600 dark:text-gray-400 leading-relaxed markdown-body"
          v-html="renderMarkdown(trip.description)"
        />
        <p v-else class="text-gray-400 dark:text-gray-500 italic text-sm">Bez popisu</p>
      </div>

      <!-- Location card -->
      <div class="card shadow-soft">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Poloha
        </h3>
        <div class="text-sm text-gray-500 dark:text-gray-400 font-mono mb-1">
          Výlet: {{ Number(trip.lat).toFixed(6) }}, {{ Number(trip.lng).toFixed(6) }}
        </div>
        <div v-if="trip.parking_lat && trip.parking_lng" class="text-sm text-amber-600 dark:text-amber-400 font-mono mb-3">
          🅿 Parkoviště: {{ Number(trip.parking_lat).toFixed(6) }}, {{ Number(trip.parking_lng).toFixed(6) }}
          <span v-if="trip.parking_description" class="font-sans font-normal ml-1 text-gray-500 dark:text-gray-400">— {{ trip.parking_description }}</span>
        </div>
        <div v-else class="mb-3"></div>
        <TripMap
          :trips="[trip]"
          height="240px"
          :interactive="false"
          :parking-lat="trip.parking_lat ? Number(trip.parking_lat) : null"
          :parking-lng="trip.parking_lng ? Number(trip.parking_lng) : null"
          :parking-description="trip.parking_description || ''"
        />
      </div>

      <!-- Byl jsem tam -->
      <TripVisits :trip-id="trip.id" />

      <!-- Metadata -->
      <div class="card shadow-soft">
        <div class="text-xs text-gray-400 dark:text-gray-500 space-y-1">
          <div class="flex justify-between">
            <span>Vytvořeno</span>
            <span>{{ new Date(trip.created_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Naposledy upraveno</span>
            <span>{{ new Date(trip.updated_at).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' }) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete modal -->
    <AppModal
      :show="showDeleteModal"
      title="Smazat výlet"
      @close="showDeleteModal = false"
    >
      <p class="text-gray-600 dark:text-gray-400">
        Opravdu chcete smazat výlet
        <strong class="text-gray-900 dark:text-white">{{ trip?.name }}</strong>?
        Tuto akci nelze vrátit.
      </p>

      <template #footer>
        <AppButton variant="secondary" @click="showDeleteModal = false">Zrušit</AppButton>
        <AppButton variant="danger" @click="confirmDelete">Smazat</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.markdown-body :deep(p) { margin-bottom: 0.5rem; }
.markdown-body :deep(strong) { font-weight: 600; color: inherit; }
.markdown-body :deep(em) { font-style: italic; }
.markdown-body :deep(ul) { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
.markdown-body :deep(li) { margin-bottom: 0.25rem; }
.markdown-body :deep(br) { display: block; content: ''; margin-top: 0.5rem; }
</style>
