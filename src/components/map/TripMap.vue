<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'

import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

const parkingIcon = L.divIcon({
  html: `<div style="background:#f59e0b;color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35)">P</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  className: ''
})

const props = defineProps({
  trips: { type: Array, default: () => [] },
  height: { type: String, default: '400px' },
  interactive: { type: Boolean, default: false },
  initialLat: { type: Number, default: null },
  initialLng: { type: Number, default: null },
  // Parking marker (shown only in detail view)
  parkingLat: { type: Number, default: null },
  parkingLng: { type: Number, default: null },
  parkingDescription: { type: String, default: '' },
  // Interactive mode: which point is being set ('trip' | 'parking')
  pickerTarget: { type: String, default: 'trip' }
})

const emit = defineEmits(['location-picked'])

const mapContainer = ref(null)
let mapInstance = null
let tripMarkers = []
let interactiveMarker = null
let parkingMarker = null

function initMap() {
  if (!mapContainer.value) return

  const centerLat = props.initialLat || (props.trips.length > 0 ? props.trips[0].lat : 50.0755)
  const centerLng = props.initialLng || (props.trips.length > 0 ? props.trips[0].lng : 14.4378)
  const zoom = (props.initialLat || props.trips.length > 0) ? 10 : 7

  mapInstance = L.map(mapContainer.value, { center: [centerLat, centerLng], zoom, zoomControl: true })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(mapInstance)

  if (props.interactive) {
    setupInteractiveMap()
  } else {
    addTripMarkers()
    addParkingMarker()
  }
}

function setupInteractiveMap() {
  // If initial trip position, add marker
  if (props.initialLat && props.initialLng) {
    interactiveMarker = L.marker([props.initialLat, props.initialLng], { draggable: true }).addTo(mapInstance)
    interactiveMarker.on('dragend', e => {
      const pos = e.target.getLatLng()
      emit('location-picked', { lat: pos.lat, lng: pos.lng, target: props.pickerTarget })
    })
    mapInstance.setView([props.initialLat, props.initialLng], 13)
  }

  // Parking marker in interactive mode (if already set)
  if (props.parkingLat && props.parkingLng) {
    parkingMarker = L.marker([props.parkingLat, props.parkingLng], { draggable: true, icon: parkingIcon }).addTo(mapInstance)
    parkingMarker.on('dragend', e => {
      const pos = e.target.getLatLng()
      emit('location-picked', { lat: pos.lat, lng: pos.lng, target: 'parking' })
    })
  }

  mapInstance.on('click', e => {
    const { lat, lng } = e.latlng

    if (props.pickerTarget === 'parking') {
      if (parkingMarker) {
        parkingMarker.setLatLng([lat, lng])
      } else {
        parkingMarker = L.marker([lat, lng], { draggable: true, icon: parkingIcon }).addTo(mapInstance)
        parkingMarker.on('dragend', ev => {
          const pos = ev.target.getLatLng()
          emit('location-picked', { lat: pos.lat, lng: pos.lng, target: 'parking' })
        })
      }
    } else {
      if (interactiveMarker) {
        interactiveMarker.setLatLng([lat, lng])
      } else {
        interactiveMarker = L.marker([lat, lng], { draggable: true }).addTo(mapInstance)
        interactiveMarker.on('dragend', ev => {
          const pos = ev.target.getLatLng()
          emit('location-picked', { lat: pos.lat, lng: pos.lng, target: 'trip' })
        })
      }
    }

    emit('location-picked', { lat, lng, target: props.pickerTarget })
  })
}

function addTripMarkers() {
  tripMarkers.forEach(m => m.remove())
  tripMarkers = []

  props.trips.forEach(trip => {
    if (!trip.lat || !trip.lng) return
    const marker = L.marker([trip.lat, trip.lng]).addTo(mapInstance)
    const desc = trip.description
      ? trip.description.replace(/\*\*/g, '').replace(/\*/g, '').substring(0, 100) + (trip.description.length > 100 ? '…' : '')
      : 'Bez popisu'

    marker.bindPopup(`
      <div style="min-width:180px;font-family:inherit;">
        <h3 style="font-weight:600;font-size:14px;margin:0 0 4px;color:#1f2937;">${escapeHtml(trip.name)}</h3>
        <p style="font-size:12px;color:#6b7280;margin:0 0 8px;line-height:1.4;">${escapeHtml(desc)}</p>
        <a href="#/trips/${trip.id}" style="display:inline-block;padding:4px 12px;background:#6366f1;color:white;border-radius:8px;font-size:12px;font-weight:500;text-decoration:none;">Zobrazit detail</a>
      </div>
    `)
    tripMarkers.push(marker)
  })

  if (tripMarkers.length > 1) {
    mapInstance.fitBounds(L.featureGroup(tripMarkers).getBounds().pad(0.1))
  } else if (tripMarkers.length === 1) {
    mapInstance.setView([props.trips[0].lat, props.trips[0].lng], 12)
  }
}

function addParkingMarker() {
  if (parkingMarker) { parkingMarker.remove(); parkingMarker = null }
  if (!props.parkingLat || !props.parkingLng) return

  parkingMarker = L.marker([props.parkingLat, props.parkingLng], { icon: parkingIcon }).addTo(mapInstance)
  const desc = props.parkingDescription || 'Parkoviště'
  parkingMarker.bindPopup(`
    <div style="min-width:140px;font-family:inherit;">
      <h3 style="font-weight:600;font-size:13px;margin:0 0 3px;color:#1f2937;">🅿 Parkoviště</h3>
      <p style="font-size:12px;color:#6b7280;margin:0;">${escapeHtml(desc)}</p>
    </div>
  `)
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.appendChild(document.createTextNode(text || ''))
  return div.innerHTML
}

// Watch trip position changes in interactive mode
watch([() => props.initialLat, () => props.initialLng], ([lat, lng]) => {
  if (!mapInstance || !props.interactive || props.pickerTarget !== 'trip') return
  if (lat && lng) {
    if (interactiveMarker) interactiveMarker.setLatLng([lat, lng])
    else {
      interactiveMarker = L.marker([lat, lng], { draggable: true }).addTo(mapInstance)
      interactiveMarker.on('dragend', e => {
        const pos = e.target.getLatLng()
        emit('location-picked', { lat: pos.lat, lng: pos.lng, target: 'trip' })
      })
    }
    mapInstance.setView([lat, lng], 13)
  }
})

// Watch parking position changes in interactive mode
watch([() => props.parkingLat, () => props.parkingLng], ([lat, lng]) => {
  if (!mapInstance || !props.interactive) return
  if (lat && lng) {
    if (parkingMarker) parkingMarker.setLatLng([lat, lng])
    else {
      parkingMarker = L.marker([lat, lng], { draggable: true, icon: parkingIcon }).addTo(mapInstance)
      parkingMarker.on('dragend', e => {
        const pos = e.target.getLatLng()
        emit('location-picked', { lat: pos.lat, lng: pos.lng, target: 'parking' })
      })
    }
  } else if (parkingMarker && !lat && !lng) {
    parkingMarker.remove()
    parkingMarker = null
  }
})

watch(() => props.trips, () => {
  if (!props.interactive && mapInstance) addTripMarkers()
}, { deep: true })

watch([() => props.parkingLat, () => props.parkingLng, () => props.parkingDescription], () => {
  if (!props.interactive && mapInstance) addParkingMarker()
})

onMounted(() => setTimeout(initMap, 50))
onUnmounted(() => {
  if (mapInstance) { mapInstance.remove(); mapInstance = null }
})
</script>

<template>
  <div ref="mapContainer" class="w-full rounded-xl overflow-hidden z-0" :style="{ height }" />
</template>
