<script setup>
import { ref, onMounted } from 'vue'
import { useTagsStore } from '@/stores/tags'
import { useToastStore } from '@/stores/toast'
import TagForm from '@/components/tags/TagForm.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'

const tagsStore = useTagsStore()
const toastStore = useToastStore()

const showForm = ref(false)
const editingTag = ref(null)
const formLoading = ref(false)
const showDeleteModal = ref(false)
const tagToDelete = ref(null)
const deleting = ref(false)

onMounted(async () => {
  await tagsStore.fetchTags()
})

function openCreate() {
  editingTag.value = null
  showForm.value = true
}

function openEdit(tag) {
  editingTag.value = { ...tag }
  showForm.value = true
}

function openDelete(tag) {
  tagToDelete.value = tag
  showDeleteModal.value = true
}

async function handleFormSubmit(tagData) {
  formLoading.value = true
  try {
    if (editingTag.value) {
      await tagsStore.updateTag(editingTag.value.id, tagData)
      toastStore.success('Tag byl upraven')
    } else {
      await tagsStore.createTag(tagData)
      toastStore.success('Tag byl přidán')
    }
    showForm.value = false
    editingTag.value = null
  } catch (err) {
    toastStore.error('Uložení selhalo: ' + (err.message || 'Neznámá chyba'))
  } finally {
    formLoading.value = false
  }
}

async function confirmDelete() {
  if (!tagToDelete.value) return
  deleting.value = true
  try {
    await tagsStore.deleteTag(tagToDelete.value.id)
    toastStore.success('Tag byl smazán')
    showDeleteModal.value = false
    tagToDelete.value = null
  } catch (err) {
    toastStore.error('Smazání selhalo: ' + (err.message || 'Neznámá chyba'))
  } finally {
    deleting.value = false
  }
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
  <div class="p-4 max-w-2xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Moje tagy</h1>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{{ tagsStore.tags.length }} tagů</p>
      </div>
      <AppButton variant="primary" @click="openCreate">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Přidat tag
      </AppButton>
    </div>

    <!-- Loading -->
    <div v-if="tagsStore.loading" class="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <div v-for="i in 4" :key="i" class="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="tagsStore.tags.length === 0" class="flex flex-col items-center justify-center py-16 text-center">
      <div class="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">Žádné tagy</h3>
      <p class="text-sm text-gray-400 dark:text-gray-500 mb-6">Vytvořte tagy pro organizaci výletů</p>
      <AppButton variant="primary" @click="openCreate">Vytvořit tag</AppButton>
    </div>

    <!-- Tag grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-8">
      <div
        v-for="tag in tagsStore.tags"
        :key="tag.id"
        class="rounded-2xl p-4 relative overflow-hidden shadow-card"
        :style="{ backgroundColor: tag.color }"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <h3
              class="font-semibold text-sm truncate"
              :style="{ color: getTextColor(tag.color) }"
            >
              {{ tag.name }}
            </h3>
            <p
              v-if="tag.description"
              class="text-xs mt-1 line-clamp-2 opacity-80"
              :style="{ color: getTextColor(tag.color) }"
            >
              {{ tag.description }}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-1 mt-3">
          <button
            @click="openEdit(tag)"
            class="flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
            :style="{
              backgroundColor: 'rgba(255,255,255,0.25)',
              color: getTextColor(tag.color)
            }"
          >
            Upravit
          </button>
          <button
            @click="openDelete(tag)"
            class="flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
            :style="{
              backgroundColor: 'rgba(0,0,0,0.15)',
              color: getTextColor(tag.color)
            }"
          >
            Smazat
          </button>
        </div>
      </div>
    </div>

    <!-- Tag form modal -->
    <AppModal
      :show="showForm"
      :title="editingTag ? 'Upravit tag' : 'Nový tag'"
      @close="showForm = false"
    >
      <TagForm
        :initial-data="editingTag"
        :loading="formLoading"
        @submit="handleFormSubmit"
        @cancel="showForm = false"
      />
    </AppModal>

    <!-- Delete confirmation modal -->
    <AppModal
      :show="showDeleteModal"
      title="Smazat tag"
      @close="showDeleteModal = false"
    >
      <p class="text-gray-600 dark:text-gray-400">
        Opravdu chcete smazat tag
        <strong class="text-gray-900 dark:text-white">{{ tagToDelete?.name }}</strong>?
        Tag bude odpojen od všech výletů.
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
