<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTripsStore } from '@/stores/trips'
import { useTagsStore } from '@/stores/tags'
import TripMap from '@/components/map/TripMap.vue'
import TagFilter from '@/components/ui/TagFilter.vue'

const tripsStore = useTripsStore()
const tagsStore = useTagsStore()

const selectedTagIds = ref([])
const showFilter = ref(false)

onMounted(async () => {
  await Promise.all([tripsStore.fetchAllTrips(), tagsStore.fetchTags()])
})

const filteredTrips = computed(() => {
  if (selectedTagIds.value.length === 0) return tripsStore.trips
  return tripsStore.trips.filter(trip =>
    trip.tags && trip.tags.some(tag => selectedTagIds.value.includes(tag.id))
  )
})

const activeFilterCount = computed(() => selectedTagIds.value.length)
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
      <h1 class="text-base font-semibold text-gray-900 dark:text-white">Mapa výletů</h1>
      <div class="flex items-center gap-2">
        <span class="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
          {{ filteredTrips.length }} výletů
        </span>
        <button
          v-if="tagsStore.tags.length > 0"
          type="button"
          @click="showFilter = !showFilter"
          class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition-colors"
          :class="activeFilterCount > 0
            ? 'bg-primary-500 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
          </svg>
          Filtr{{ activeFilterCount > 0 ? ` (${activeFilterCount})` : '' }}
        </button>
      </div>
    </div>

    <!-- Tag filter panel -->
    <div
      v-if="showFilter && tagsStore.tags.length > 0"
      class="px-4 py-2.5 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex-shrink-0"
    >
      <TagFilter v-model="selectedTagIds" :tags="tagsStore.tags" />
    </div>

    <!-- Loading -->
    <div v-if="tripsStore.loading" class="flex-1 flex items-center justify-center">
      <div class="flex flex-col items-center gap-3">
        <div class="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-sm text-gray-400">Načítám mapu...</p>
      </div>
    </div>

    <!-- Map -->
    <div v-else class="flex-1 relative min-h-0">
      <TripMap
        :trips="filteredTrips"
        height="100%"
        :interactive="false"
        class="absolute inset-0 h-full"
      />
    </div>
  </div>
</template>
