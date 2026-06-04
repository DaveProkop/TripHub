<script setup>
const props = defineProps({
  tags: { type: Array, default: () => [] },
  modelValue: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue'])

function toggle(tagId) {
  const next = props.modelValue.includes(tagId)
    ? props.modelValue.filter(id => id !== tagId)
    : [...props.modelValue, tagId]
  emit('update:modelValue', next)
}

function clearAll() {
  emit('update:modelValue', [])
}
</script>

<template>
  <div v-if="tags.length > 0" class="flex flex-wrap gap-1.5 items-center">
    <button
      type="button"
      @click="clearAll"
      class="px-3 py-1 rounded-full text-xs font-medium transition-colors"
      :class="modelValue.length === 0
        ? 'bg-primary-500 text-white'
        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'"
    >Vše</button>
    <button
      v-for="tag in tags"
      :key="tag.id"
      type="button"
      @click="toggle(tag.id)"
      class="px-3 py-1 rounded-full text-xs font-medium transition-all border-2"
      :style="modelValue.includes(tag.id)
        ? { backgroundColor: tag.color, color: 'white', borderColor: tag.color }
        : { backgroundColor: 'transparent', color: tag.color, borderColor: tag.color }"
    >{{ tag.name }}</button>
  </div>
</template>
