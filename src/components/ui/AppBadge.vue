<script setup>
defineProps({
  color: {
    type: String,
    default: '#6366f1'
  },
  label: {
    type: String,
    required: true
  },
  removable: {
    type: Boolean,
    default: false
  },
  clickable: {
    type: Boolean,
    default: false
  },
  selected: {
    type: Boolean,
    default: false
  }
})

defineEmits(['remove', 'click'])

function getTextColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1f2937' : '#ffffff'
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200"
    :class="{
      'cursor-pointer': clickable,
      'opacity-40 hover:opacity-70': clickable && !selected,
      'ring-2 ring-offset-1 ring-gray-600 dark:ring-gray-300': clickable && selected
    }"
    :style="{
      backgroundColor: color,
      color: getTextColor(color)
    }"
    @click="clickable ? $emit('click') : undefined"
  >
    {{ label }}
    <button
      v-if="removable"
      @click.stop="$emit('remove')"
      class="ml-0.5 hover:opacity-70 transition-opacity"
      :style="{ color: getTextColor(color) }"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </span>
</template>
