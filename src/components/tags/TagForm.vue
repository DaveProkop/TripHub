<script setup>
import { ref, onMounted } from 'vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppTextarea from '@/components/ui/AppTextarea.vue'
import AppButton from '@/components/ui/AppButton.vue'

const PRESET_COLORS = [
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#84cc16'  // lime
]

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'cancel'])

const name = ref('')
const description = ref('')
const color = ref('#6366f1')
const customColor = ref('#6366f1')
const errors = ref({})

onMounted(() => {
  if (props.initialData) {
    name.value = props.initialData.name || ''
    description.value = props.initialData.description || ''
    color.value = props.initialData.color || '#6366f1'
    customColor.value = props.initialData.color || '#6366f1'
  }
})

function selectColor(c) {
  color.value = c
  customColor.value = c
}

function handleCustomColor(e) {
  color.value = e.target.value
  customColor.value = e.target.value
}

function validate() {
  errors.value = {}
  if (!name.value.trim()) errors.value.name = 'Název tagu je povinný'
  return Object.keys(errors.value).length === 0
}

function handleSubmit() {
  if (!validate()) return
  emit('submit', {
    name: name.value.trim(),
    description: description.value.trim(),
    color: color.value
  })
}

function getTextColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#1f2937' : '#ffffff'
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <!-- Name -->
    <AppInput
      v-model="name"
      label="Název tagu"
      placeholder="Např. Hory, Příroda, Romantika..."
      :error="errors.name"
      required
    />

    <!-- Description -->
    <AppTextarea
      v-model="description"
      label="Popis"
      placeholder="Volitelný popis tagu..."
      :rows="2"
    />

    <!-- Color picker -->
    <div>
      <p class="label mb-2">Barva tagu</p>

      <!-- Preview -->
      <div class="mb-3 flex items-center gap-3">
        <span
          class="px-3 py-1.5 rounded-full text-sm font-medium"
          :style="{ backgroundColor: color, color: getTextColor(color) }"
        >
          {{ name || 'Náhled tagu' }}
        </span>
        <span class="text-sm text-gray-500 dark:text-gray-400 font-mono">{{ color }}</span>
      </div>

      <!-- Preset colors -->
      <div class="flex flex-wrap gap-2 mb-3">
        <button
          v-for="c in PRESET_COLORS"
          :key="c"
          type="button"
          @click="selectColor(c)"
          class="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none"
          :class="{ 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600 scale-110': color === c }"
          :style="{ backgroundColor: c }"
          :title="c"
        />
      </div>

      <!-- Custom color input -->
      <div class="flex items-center gap-3">
        <label class="text-sm text-gray-600 dark:text-gray-400">Vlastní barva:</label>
        <input
          type="color"
          :value="customColor"
          @input="handleCustomColor"
          class="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent p-0.5"
        />
        <input
          type="text"
          :value="color"
          @change="e => { if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) selectColor(e.target.value) }"
          placeholder="#6366f1"
          class="input-base w-32 font-mono text-sm"
          maxlength="7"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-3 pt-2">
      <AppButton
        type="button"
        variant="secondary"
        @click="$emit('cancel')"
        class="flex-1"
      >
        Zrušit
      </AppButton>
      <AppButton
        type="submit"
        variant="primary"
        :loading="loading"
        class="flex-1"
      >
        Uložit tag
      </AppButton>
    </div>
  </form>
</template>
