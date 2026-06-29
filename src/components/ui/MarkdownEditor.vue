<script setup>
import { ref, nextTick } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  rows: { type: Number, default: 10 }
})

const emit = defineEmits(['update:modelValue'])

const textarea = ref(null)
const previewMode = ref(false)

function renderMarkdown(text) {
  if (!text) return '<span class="text-gray-400 italic">Nic k náhledu</span>'
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*\n]+?)\*/g, '<em>$1</em>')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  const lines = html.split('\n')
  const result = []
  let inList = false
  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3}) (.+)/)
    if (headingMatch) {
      if (inList) { result.push('</ul>'); inList = false }
      const tag = headingMatch[1].length === 1 ? 'h2' : headingMatch[1].length === 2 ? 'h2' : 'h3'
      result.push(`<${tag}>${headingMatch[2]}</${tag}>`)
    } else if (line.match(/^[-*] /)) {
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

function wrap(prefix, suffix) {
  const el = textarea.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const val = props.modelValue
  const selected = val.slice(start, end)
  const newText = val.slice(0, start) + prefix + (selected || 'text') + suffix + val.slice(end)
  emit('update:modelValue', newText)
  nextTick(() => {
    el.focus()
    if (selected) {
      el.setSelectionRange(start + prefix.length, end + prefix.length)
    } else {
      el.setSelectionRange(start + prefix.length, start + prefix.length + 4)
    }
  })
}

function insertBullet() {
  const el = textarea.value
  if (!el) return
  const pos = el.selectionStart
  const val = props.modelValue
  const lineStart = val.lastIndexOf('\n', pos - 1) + 1
  const lineContent = val.slice(lineStart, pos)
  if (lineContent.startsWith('- ')) return
  const newText = val.slice(0, lineStart) + '- ' + val.slice(lineStart)
  emit('update:modelValue', newText)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(pos + 2, pos + 2)
  })
}

function insertHeading() {
  const el = textarea.value
  if (!el) return
  const pos = el.selectionStart
  const val = props.modelValue
  const lineStart = val.lastIndexOf('\n', pos - 1) + 1
  const lineContent = val.slice(lineStart)
  if (lineContent.startsWith('## ')) return
  const newText = val.slice(0, lineStart) + '## ' + val.slice(lineStart)
  emit('update:modelValue', newText)
  nextTick(() => {
    el.focus()
    el.setSelectionRange(pos + 3, pos + 3)
  })
}

function insertLink() {
  const el = textarea.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const val = props.modelValue
  const selected = val.slice(start, end)
  const linkText = selected || 'text'
  const newText = val.slice(0, start) + `[${linkText}](url)` + val.slice(end)
  emit('update:modelValue', newText)
  nextTick(() => {
    el.focus()
    const urlStart = start + linkText.length + 3
    el.setSelectionRange(urlStart, urlStart + 3)
  })
}
</script>

<template>
  <div>
    <div v-if="label" class="flex items-center justify-between mb-1.5">
      <label class="label">{{ label }}</label>
      <div class="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs">
        <button
          type="button"
          @click="previewMode = false"
          class="px-3 py-1 transition-colors"
          :class="!previewMode ? 'bg-primary-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >Upravit</button>
        <button
          type="button"
          @click="previewMode = true"
          class="px-3 py-1 transition-colors"
          :class="previewMode ? 'bg-primary-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'"
        >Náhled</button>
      </div>
    </div>

    <!-- Toolbar -->
    <div v-if="!previewMode" class="flex gap-1 mb-1 p-1 bg-gray-50 dark:bg-gray-800 rounded-t-xl border border-b-0 border-gray-200 dark:border-gray-700">
      <button
        type="button"
        @click="wrap('**', '**')"
        class="px-2.5 py-1 rounded text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Tučné (Ctrl+B)"
      ><strong>B</strong></button>
      <button
        type="button"
        @click="wrap('*', '*')"
        class="px-2.5 py-1 rounded text-sm italic text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Kurzíva"
      ><em>I</em></button>
      <button
        type="button"
        @click="insertBullet()"
        class="px-2.5 py-1 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Odrážka"
      >≡</button>
      <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5 self-center"></div>
      <button
        type="button"
        @click="insertHeading()"
        class="px-2.5 py-1 rounded text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Nadpis (##)"
      >H</button>
      <button
        type="button"
        @click="insertLink()"
        class="px-2.5 py-1 rounded text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Odkaz [text](url)"
      >🔗</button>
      <div class="flex-1"></div>
      <span class="text-xs text-gray-400 dark:text-gray-500 self-center pr-1">Markdown</span>
    </div>

    <!-- Editor -->
    <textarea
      v-if="!previewMode"
      ref="textarea"
      :value="modelValue"
      @input="emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      :rows="rows"
      class="w-full px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-b-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y leading-relaxed font-mono"
    />

    <!-- Preview -->
    <div
      v-else
      class="min-h-[160px] px-3 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 leading-relaxed markdown-preview"
      v-html="renderMarkdown(modelValue)"
    />
  </div>
</template>

<style scoped>
.markdown-preview :deep(p) { margin-bottom: 0.5rem; }
.markdown-preview :deep(strong) { font-weight: 600; }
.markdown-preview :deep(em) { font-style: italic; }
.markdown-preview :deep(ul) { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
.markdown-preview :deep(li) { margin-bottom: 0.25rem; }
.markdown-preview :deep(h2) { font-size: 1rem; font-weight: 700; margin: 0.75rem 0 0.25rem; }
.markdown-preview :deep(h3) { font-size: 0.9rem; font-weight: 600; margin: 0.5rem 0 0.25rem; }
.markdown-preview :deep(a) { color: #6366f1; text-decoration: underline; }
.markdown-preview :deep(a:hover) { color: #4f46e5; }
</style>
