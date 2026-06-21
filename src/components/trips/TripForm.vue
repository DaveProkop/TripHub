<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTagsStore } from '@/stores/tags'
import { usePhotoUpload } from '@/composables/usePhotoUpload'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import MarkdownEditor from '@/components/ui/MarkdownEditor.vue'
import TripMap from '@/components/map/TripMap.vue'

const props = defineProps({
  initialData: { type: Object, default: null },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['submit', 'cancel'])
const tagsStore = useTagsStore()
const { uploadFile, uploadFromUrl } = usePhotoUpload()

const name = ref('')
const description = ref('')
const lat = ref(null)
const lng = ref(null)
const parkingLat = ref(null)
const parkingLng = ref(null)
const parkingDescription = ref('')
// Each photo: { id, url: string|null, previewUrl: string|null, uploading: bool, error: string|null }
const photos = ref([])
const photoUrlInput = ref('')
const selectedTagIds = ref([])
const errors = ref({})

// Which GPS section is active on the shared map
const activeGpsPicker = ref('trip') // 'trip' | 'parking'

// Google Maps paste helpers
const tripGmPaste = ref('')
const parkingGmPaste = ref('')

function parseCoords(input) {
  const text = input.trim()
  if (!text) return null
  // Plain: "50.0755, 14.4378" or "50.0755,14.4378"
  const plain = text.match(/^(-?\d{1,3}\.?\d*)[,\s]+(-?\d{1,3}\.?\d*)$/)
  if (plain) return { lat: parseFloat(plain[1]), lng: parseFloat(plain[2]) }
  // Google Maps @lat,lng
  const atMatch = text.match(/@(-?\d+\.?\d+),(-?\d+\.?\d+)/)
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) }
  // Google Maps ?q=lat,lng or ?q=lat+lng
  const qMatch = text.match(/[?&]q=(-?\d+\.?\d+)[,+](-?\d+\.?\d+)/)
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) }
  return null
}

function applyTripPaste() {
  const result = parseCoords(tripGmPaste.value)
  if (result) {
    lat.value = parseFloat(result.lat.toFixed(8))
    lng.value = parseFloat(result.lng.toFixed(8))
    delete errors.value.lat
    delete errors.value.lng
    tripGmPaste.value = ''
  } else {
    errors.value.tripGmPaste = 'Nepodařilo se rozpoznat souřadnice'
  }
}

function applyParkingPaste() {
  const result = parseCoords(parkingGmPaste.value)
  if (result) {
    parkingLat.value = parseFloat(result.lat.toFixed(8))
    parkingLng.value = parseFloat(result.lng.toFixed(8))
    parkingGmPaste.value = ''
  } else {
    errors.value.parkingGmPaste = 'Nepodařilo se rozpoznat souřadnice'
  }
}

function clearParkingGps() {
  parkingLat.value = null
  parkingLng.value = null
  parkingDescription.value = ''
}

function handleLocationPicked({ lat: pickedLat, lng: pickedLng, target }) {
  if (target === 'parking') {
    parkingLat.value = parseFloat(pickedLat.toFixed(8))
    parkingLng.value = parseFloat(pickedLng.toFixed(8))
  } else {
    lat.value = parseFloat(pickedLat.toFixed(8))
    lng.value = parseFloat(pickedLng.toFixed(8))
    delete errors.value.lat
    delete errors.value.lng
  }
}

function validate() {
  errors.value = {}
  if (!name.value.trim()) errors.value.name = 'Název je povinný'
  if (lat.value === null || lat.value === '') errors.value.lat = 'Zadejte zeměpisnou šířku'
  if (lng.value === null || lng.value === '') errors.value.lng = 'Zadejte zeměpisnou délku'
  const latN = parseFloat(lat.value), lngN = parseFloat(lng.value)
  if (lat.value !== null && lat.value !== '' && (isNaN(latN) || latN < -90 || latN > 90))
    errors.value.lat = 'Platná šířka je -90 až 90'
  if (lng.value !== null && lng.value !== '' && (isNaN(lngN) || lngN < -180 || lngN > 180))
    errors.value.lng = 'Platná délka je -180 až 180'
  return Object.keys(errors.value).length === 0
}

onMounted(async () => {
  await tagsStore.fetchTags()
  if (props.initialData) {
    name.value = props.initialData.name || ''
    description.value = props.initialData.description || ''
    lat.value = props.initialData.lat || null
    lng.value = props.initialData.lng || null
    parkingLat.value = props.initialData.parking_lat || null
    parkingLng.value = props.initialData.parking_lng || null
    parkingDescription.value = props.initialData.parking_description || ''
    photos.value = (props.initialData.photos ?? []).map(url => ({
      id: crypto.randomUUID(), url, previewUrl: url, uploading: false, error: null
    }))
    selectedTagIds.value = props.initialData.tags?.map(t => t.id) || []
  }
})

function toggleTag(tagId) {
  const idx = selectedTagIds.value.indexOf(tagId)
  if (idx === -1) selectedTagIds.value.push(tagId)
  else selectedTagIds.value.splice(idx, 1)
}

function removePhoto(i) {
  photos.value.splice(i, 1)
}

async function handleFileSelect(event) {
  const files = Array.from(event.target.files || [])
  const remaining = 6 - photos.value.length
  event.target.value = ''
  if (!remaining) return

  for (const file of files.slice(0, remaining)) {
    const idx = photos.value.length
    photos.value.push({
      id: crypto.randomUUID(), url: null,
      previewUrl: URL.createObjectURL(file),
      uploading: true, error: null
    })
    const photo = photos.value[idx]
    try {
      photo.url = await uploadFile(file)
    } catch (e) {
      photo.error = 'Nahrávání selhalo'
    } finally {
      photo.uploading = false
    }
  }
}

async function handleUrlAdd() {
  const url = photoUrlInput.value.trim()
  if (!url || photos.value.length >= 6) return
  photoUrlInput.value = ''

  const idx = photos.value.length
  photos.value.push({
    id: crypto.randomUUID(), url: null,
    previewUrl: url, uploading: true, error: null
  })
  const photo = photos.value[idx]
  try {
    photo.url = await uploadFromUrl(url)
    photo.previewUrl = photo.url
  } catch {
    // CORS or compression failed — store the URL directly as an external reference
    photo.url = url
  } finally {
    photo.uploading = false
  }
}

function handleSubmit() {
  if (!validate()) return
  const cleanPhotos = photos.value.filter(p => p.url && !p.uploading && !p.error).map(p => p.url)
  emit('submit', {
    tripData: {
      name: name.value.trim(),
      description: description.value.trim(),
      lat: parseFloat(lat.value),
      lng: parseFloat(lng.value),
      parking_lat: parkingLat.value ? parseFloat(parkingLat.value) : null,
      parking_lng: parkingLng.value ? parseFloat(parkingLng.value) : null,
      parking_description: parkingDescription.value.trim(),
      photos: cleanPhotos
    },
    tagIds: selectedTagIds.value
  })
}

const hasParkingGps = computed(() => parkingLat.value && parkingLng.value)
const mapTrips = computed(() => lat.value && lng.value ? [{ lat: lat.value, lng: lng.value, name: name.value || 'Výlet' }] : [])
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">

    <!-- Name -->
    <AppInput v-model="name" label="Název výletu" placeholder="Např. Krkonošský ráj" :error="errors.name" required />

    <!-- Description with markdown -->
    <MarkdownEditor
      v-model="description"
      label="Popis"
      placeholder="Popište výlet — co uvidíte, jak se dostat, co vzít s sebou...&#10;&#10;Formátování: **tučně**, *kurzíva*, - odrážka"
      :rows="10"
    />

    <!-- GPS výletu -->
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <p class="label">GPS poloha výletu <span class="text-red-500">*</span></p>
        <div class="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs">
          <button type="button" @click="activeGpsPicker = 'trip'"
            class="px-3 py-1 transition-colors"
            :class="activeGpsPicker === 'trip' ? 'bg-primary-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'">
            Výlet
          </button>
          <button type="button" @click="activeGpsPicker = 'parking'"
            class="px-3 py-1 transition-colors"
            :class="activeGpsPicker === 'parking' ? 'bg-amber-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'">
            Parkoviště
          </button>
        </div>
      </div>

      <!-- Trip GPS inputs -->
      <div v-show="activeGpsPicker === 'trip'" class="space-y-3">
        <!-- Google Maps paste helper -->
        <div class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
          <p class="text-xs text-blue-700 dark:text-blue-300 font-medium mb-1.5">
            Vložit z Google Maps
          </p>
          <p class="text-xs text-blue-600 dark:text-blue-400 mb-2">
            V Google Maps klikněte pravým tlačítkem na místo → <strong>Kopírovat souřadnice</strong>, nebo zkopírujte celou URL.
          </p>
          <div class="flex gap-2">
            <input
              v-model="tripGmPaste"
              type="text"
              placeholder="50.0755, 14.4378  nebo  google.com/maps/@50.07..."
              class="input-base flex-1 text-xs"
              @keydown.enter.prevent="applyTripPaste"
            />
            <button type="button" @click="applyTripPaste" class="btn-primary text-xs px-3 py-2 whitespace-nowrap">Použít</button>
          </div>
          <p v-if="errors.tripGmPaste" class="mt-1 text-xs text-red-500">{{ errors.tripGmPaste }}</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label text-xs">Zeměpisná šířka (lat)</label>
            <input v-model.number="lat" type="number" step="any" min="-90" max="90" placeholder="50.0755"
              class="input-base" :class="{ 'border-red-400 focus:ring-red-400': errors.lat }" />
            <p v-if="errors.lat" class="mt-1 text-xs text-red-500">{{ errors.lat }}</p>
          </div>
          <div>
            <label class="label text-xs">Zeměpisná délka (lng)</label>
            <input v-model.number="lng" type="number" step="any" min="-180" max="180" placeholder="14.4378"
              class="input-base" :class="{ 'border-red-400 focus:ring-red-400': errors.lng }" />
            <p v-if="errors.lng" class="mt-1 text-xs text-red-500">{{ errors.lng }}</p>
          </div>
        </div>
      </div>

      <!-- Parking GPS inputs -->
      <div v-show="activeGpsPicker === 'parking'" class="space-y-3">
        <div class="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
          <p class="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1.5">
            Vložit parkoviště z Google Maps
          </p>
          <p class="text-xs text-amber-600 dark:text-amber-400 mb-2">
            Najděte parkoviště v Google Maps → pravý klik → <strong>Kopírovat souřadnice</strong>.
          </p>
          <div class="flex gap-2">
            <input
              v-model="parkingGmPaste"
              type="text"
              placeholder="50.0800, 14.4200  nebo  URL z Google Maps"
              class="input-base flex-1 text-xs"
              @keydown.enter.prevent="applyParkingPaste"
            />
            <button type="button" @click="applyParkingPaste" class="text-xs px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl whitespace-nowrap transition-colors">Použít</button>
          </div>
          <p v-if="errors.parkingGmPaste" class="mt-1 text-xs text-red-500">{{ errors.parkingGmPaste }}</p>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label text-xs">Šířka parkoviště</label>
            <input v-model.number="parkingLat" type="number" step="any" min="-90" max="90" placeholder="50.0800" class="input-base" />
          </div>
          <div>
            <label class="label text-xs">Délka parkoviště</label>
            <input v-model.number="parkingLng" type="number" step="any" min="-180" max="180" placeholder="14.4200" class="input-base" />
          </div>
        </div>

        <div>
          <label class="label text-xs">Popis parkoviště <span class="text-gray-400 font-normal">(nepovinné)</span></label>
          <input v-model="parkingDescription" type="text" placeholder="Např. Velké parkoviště u rozcestí, zdarma" class="input-base" />
        </div>

        <div v-if="hasParkingGps" class="flex justify-end">
          <button type="button" @click="clearParkingGps" class="text-xs text-red-500 hover:text-red-600">
            Odstranit GPS parkoviště
          </button>
        </div>
      </div>

      <!-- Shared map -->
      <p class="text-xs text-gray-400 dark:text-gray-500">
        Klikněte na mapu pro výběr
        <span v-if="activeGpsPicker === 'trip'" class="text-primary-500 font-medium">polohy výletu</span>
        <span v-else class="text-amber-500 font-medium">polohy parkoviště</span>
        — nebo táhněte příslušný marker.
      </p>
      <TripMap
        :trips="mapTrips"
        height="280px"
        :interactive="true"
        :initial-lat="lat"
        :initial-lng="lng"
        :parking-lat="parkingLat"
        :parking-lng="parkingLng"
        :picker-target="activeGpsPicker"
        @location-picked="handleLocationPicked"
      />
    </div>

    <!-- Tagy -->
    <div v-if="tagsStore.tags.length > 0">
      <p class="label mb-2">Tagy</p>
      <div class="flex flex-wrap gap-2">
        <AppBadge
          v-for="tag in tagsStore.tags"
          :key="tag.id"
          :label="tag.name"
          :color="tag.color"
          :clickable="true"
          :selected="selectedTagIds.includes(tag.id)"
          @click="toggleTag(tag.id)"
        />
      </div>
    </div>
    <div v-else class="text-sm text-gray-400 dark:text-gray-500">
      Žádné tagy. <router-link to="/tags" class="text-primary-500 hover:underline">Vytvořte tagy</router-link> pro lepší organizaci.
    </div>

    <!-- Fotky -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <p class="label">Fotografie <span class="text-gray-400 text-xs font-normal">(max 6)</span></p>
        <span class="text-xs text-gray-400 dark:text-gray-500">{{ photos.length }}/6</span>
      </div>

      <!-- Photo grid -->
      <div class="grid grid-cols-3 gap-2 mb-3">
        <div v-for="(photo, i) in photos" :key="photo.id"
          class="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img v-if="photo.previewUrl" :src="photo.previewUrl" class="w-full h-full object-cover"
            @error="photo.previewUrl = null" />
          <div v-if="photo.uploading" class="absolute inset-0 flex items-center justify-center bg-black/40">
            <div class="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div v-else-if="photo.error" class="absolute inset-0 flex flex-col items-center justify-center bg-red-500/90 p-2">
            <svg class="w-5 h-5 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-white text-xs text-center leading-tight">{{ photo.error }}</p>
          </div>
          <button v-if="!photo.uploading" type="button" @click="removePhoto(i)"
            class="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-500 transition-colors">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Add slot -->
        <label v-if="photos.length < 6"
          class="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
          <input type="file" accept="image/*" multiple class="hidden" @change="handleFileSelect" />
          <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span class="text-xs text-gray-400 mt-1">Přidat foto</span>
        </label>
      </div>

      <!-- URL input -->
      <div class="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Nebo přidat z URL</p>
        <div class="flex gap-2">
          <input v-model="photoUrlInput" type="url" placeholder="https://example.com/foto.jpg"
            class="input-base flex-1 text-sm" :disabled="photos.length >= 6"
            @keydown.enter.prevent="handleUrlAdd" />
          <button type="button" @click="handleUrlAdd"
            :disabled="!photoUrlInput.trim() || photos.length >= 6"
            class="btn-primary text-sm px-3 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
            Přidat
          </button>
        </div>
        <p class="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
          Pokud to server povolí, fotka se stáhne a zmenší. Jinak se uloží odkaz.
        </p>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-3 pt-2">
      <AppButton type="button" variant="secondary" @click="$emit('cancel')" class="flex-1">Zrušit</AppButton>
      <AppButton type="submit" variant="primary" :loading="loading" class="flex-1">Uložit výlet</AppButton>
    </div>
  </form>
</template>
