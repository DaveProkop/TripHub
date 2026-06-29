<script setup>
import AppBadge from '@/components/ui/AppBadge.vue'

defineProps({
  trip: {
    type: Object,
    required: true
  }
})

defineEmits(['edit', 'delete'])

function stripMarkdown(text) {
  if (!text) return ''
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*([^*\n]+?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*]\s/gm, '')
}
</script>

<template>
  <div class="card hover:shadow-soft transition-shadow duration-200 cursor-pointer">

    <!-- Title row -->
    <div class="flex items-start justify-between gap-2 mb-2">
      <router-link :to="`/trips/${trip.id}`" class="flex-1 min-w-0">
        <h3 class="font-semibold text-gray-900 dark:text-white truncate text-base">{{ trip.name }}</h3>
      </router-link>
      <div class="flex gap-1 flex-shrink-0">
        <button
          @click.stop="$emit('edit', trip)"
          class="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
          title="Upravit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          @click.stop="$emit('delete', trip)"
          class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          title="Smazat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Photo + description (float layout) -->
    <router-link :to="`/trips/${trip.id}`" class="block">
      <!-- Image floated left -->
      <div v-if="trip.photos && trip.photos.length > 0"
        class="float-left mr-3 mb-1 w-24 h-20 rounded-xl overflow-hidden relative flex-shrink-0">
        <img
          :src="trip.photos[0]"
          :alt="trip.name"
          class="w-full h-full object-contain"
          @error="$event.target.closest('div').remove()"
        />
        <span v-if="trip.photos.length > 1"
          class="absolute bottom-0.5 right-0.5 bg-black/50 text-white text-xs px-1 py-0.5 rounded leading-none">
          {{ trip.photos.length }}×
        </span>
      </div>

      <!-- Text wraps around image -->
      <p v-if="trip.description" class="text-gray-500 dark:text-gray-400 text-sm line-clamp-3">
        {{ stripMarkdown(trip.description) }}
      </p>
      <div v-if="trip.lat && trip.lng" class="flex items-center gap-1 mt-1 text-xs text-gray-400 dark:text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        </svg>
        <span>{{ Number(trip.lat).toFixed(4) }}, {{ Number(trip.lng).toFixed(4) }}</span>
      </div>
      <div class="clear-both"></div>
    </router-link>

    <!-- Tags -->
    <div v-if="trip.tags && trip.tags.length > 0" class="flex flex-wrap gap-1.5 mt-3">
      <AppBadge
        v-for="tag in trip.tags"
        :key="tag.id"
        :label="tag.name"
        :color="tag.color"
      />
    </div>
  </div>
</template>
