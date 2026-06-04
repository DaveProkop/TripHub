<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTripsStore } from '@/stores/trips'
import { useTagsStore } from '@/stores/tags'
import { useToastStore } from '@/stores/toast'
import TripCard from '@/components/trips/TripCard.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import TagFilter from '@/components/ui/TagFilter.vue'

const router = useRouter()
const tripsStore = useTripsStore()
const tagsStore = useTagsStore()
const toastStore = useToastStore()

const showDeleteModal = ref(false)
const tripToDelete = ref(null)
const deleting = ref(false)
const selectedTagIds = ref([])

onMounted(async () => {
  await Promise.all([tripsStore.fetchMyTrips(), tagsStore.fetchTags()])
})

const filteredTrips = computed(() => {
  if (selectedTagIds.value.length === 0) return tripsStore.myTrips
  return tripsStore.myTrips.filter(trip =>
    trip.tags && trip.tags.some(tag => selectedTagIds.value.includes(tag.id))
  )
})

function handleEdit(trip) {
  router.push(`/trips/${trip.id}/edit`)
}

function handleDelete(trip) {
  tripToDelete.value = trip
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!tripToDelete.value) return
  deleting.value = true
  try {
    await tripsStore.deleteTrip(tripToDelete.value.id)
    toastStore.success('Výlet byl smazán')
    showDeleteModal.value = false
    tripToDelete.value = null
  } catch (err) {
    toastStore.error('Smazání selhalo: ' + (err.message || 'Neznámá chyba'))
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Moje výlety</h1>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          {{ filteredTrips.length }}{{ selectedTagIds.length > 0 ? ' / ' + tripsStore.myTrips.length : '' }} výletů
        </p>
      </div>
    </div>

    <!-- Tag filter -->
    <div v-if="tagsStore.tags.length > 0" class="mb-4">
      <TagFilter v-model="selectedTagIds" :tags="tagsStore.tags" />
    </div>

    <!-- Loading -->
    <div v-if="tripsStore.loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="card animate-pulse">
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div class="h-3 bg-gray-100 dark:bg-gray-600 rounded w-full mb-1"></div>
        <div class="h-3 bg-gray-100 dark:bg-gray-600 rounded w-2/3"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredTrips.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
      <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
        {{ selectedTagIds.length > 0 ? 'Žádné výlety pro vybrané tagy' : 'Žádné výlety' }}
      </h3>
      <p class="text-sm text-gray-400 dark:text-gray-500 mb-6">
        {{ selectedTagIds.length > 0 ? 'Zkuste jiné tagy nebo zrušte filtr' : 'Přidejte svůj první tip na výlet' }}
      </p>
      <router-link
        to="/trips/new"
        class="btn-primary"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Přidat výlet
      </router-link>
    </div>

    <!-- Trip list -->
    <div v-else class="space-y-3 pb-24">
      <TripCard
        v-for="trip in filteredTrips"
        :key="trip.id"
        :trip="trip"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <!-- FAB -->
    <router-link
      to="/trips/new"
      class="fixed bottom-20 right-4 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
      title="Přidat výlet"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
      </svg>
    </router-link>

    <!-- Delete confirmation modal -->
    <AppModal
      :show="showDeleteModal"
      title="Smazat výlet"
      @close="showDeleteModal = false"
    >
      <p class="text-gray-600 dark:text-gray-400">
        Opravdu chcete smazat výlet
        <strong class="text-gray-900 dark:text-white">{{ tripToDelete?.name }}</strong>?
        Tuto akci nelze vrátit.
      </p>

      <template #footer>
        <AppButton variant="secondary" @click="showDeleteModal = false" :disabled="deleting">
          Zrušit
        </AppButton>
        <AppButton variant="danger" @click="confirmDelete" :loading="deleting">
          Smazat
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>
