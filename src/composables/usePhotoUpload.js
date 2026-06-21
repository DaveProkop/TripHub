import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const MAX_PX = 800
const JPEG_QUALITY = 0.8

function loadImg(src, crossOrigin = false) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Nelze načíst obrázek. Zkontrolujte URL nebo použijte přímý upload souboru.'))
    img.src = src
  })
}

function compressToBlob(img) {
  const ratio = Math.min(MAX_PX / img.naturalWidth, MAX_PX / img.naturalHeight, 1)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.naturalWidth * ratio)
  canvas.height = Math.round(img.naturalHeight * ratio)
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Komprese selhala')), 'image/jpeg', JPEG_QUALITY)
  )
}

export function usePhotoUpload() {
  const authStore = useAuthStore()

  async function _upload(blob, subfolder) {
    const path = `${authStore.user.id}/${subfolder}/${crypto.randomUUID()}.jpg`
    const { error } = await supabase.storage
      .from('trip-photos')
      .upload(path, blob, { contentType: 'image/jpeg' })
    if (error) throw new Error(error.message)
    return supabase.storage.from('trip-photos').getPublicUrl(path).data.publicUrl
  }

  async function uploadFile(file, subfolder = 'trips') {
    const blobUrl = URL.createObjectURL(file)
    try {
      const img = await loadImg(blobUrl)
      const blob = await compressToBlob(img)
      return await _upload(blob, subfolder)
    } finally {
      URL.revokeObjectURL(blobUrl)
    }
  }

  // Tries to download + compress image from URL via canvas (requires CORS support from image server).
  // Most CDN-hosted images (Imgur, Wikimedia, etc.) work; some servers block cross-origin canvas access.
  async function uploadFromUrl(url, subfolder = 'trips') {
    const img = await loadImg(url, true)
    const blob = await compressToBlob(img)
    return await _upload(blob, subfolder)
  }

  return { uploadFile, uploadFromUrl }
}
