import { deflateSync } from 'zlib'
import { writeFileSync } from 'fs'

const crc32Table = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  crc32Table[i] = c
}

function crc32(buf) {
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = crc32Table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcBuf])
}

function inRect(x, y, rx, ry, rw, rh) {
  return x >= rx && x < rx + rw && y >= ry && y < ry + rh
}

function inRoundedRect(x, y, rx, ry, rw, rh, r) {
  if (x < rx || x >= rx + rw || y < ry || y >= ry + rh) return false
  const corners = [
    [rx + r, ry + r], [rx + rw - r, ry + r],
    [rx + r, ry + rh - r], [rx + rw - r, ry + rh - r]
  ]
  const inCornerZone =
    (x < rx + r || x >= rx + rw - r) &&
    (y < ry + r || y >= ry + rh - r)
  if (!inCornerZone) return true
  for (const [cx, cy] of corners) {
    if ((x < rx + r) === (cx === rx + r) && (y < ry + r) === (cy === ry + r)) {
      return Math.hypot(x - cx, y - cy) <= r
    }
  }
  return false
}

function createPNG(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2 // 8-bit RGB

  // Layout constants (all relative to size)
  const bgR = Math.round(size * 0.14)  // background rounded corner radius

  // Card inset (white rounded rect)
  const pad = Math.round(size * 0.12)
  const cardR = Math.round(size * 0.1)

  // Letter dimensions
  const letterH = Math.round(size * 0.50)   // total letter height
  const stroke = Math.round(size * 0.095)   // stroke width
  const letterY = Math.round((size - letterH) / 2)

  // T: occupies left half of card
  const tWidth = Math.round(size * 0.28)
  const tX = Math.round(size * 0.155)
  // T top bar
  const tBarY = letterY
  const tBarH = stroke
  // T stem
  const tStemX = tX + Math.round((tWidth - stroke) / 2)
  const tStemY = tBarY + tBarH
  const tStemH = letterH - tBarH

  // H: occupies right half of card
  const hWidth = Math.round(size * 0.30)
  const hX = Math.round(size * 0.515)
  // H left vertical
  const hLeftX = hX
  // H right vertical
  const hRightX = hX + hWidth - stroke
  // H crossbar
  const crossH = stroke
  const crossY = letterY + Math.round((letterH - crossH) / 2)

  const rows = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3)
    row[0] = 0
    for (let x = 0; x < size; x++) {
      // Background gradient: deep indigo to violet
      const t = (x + y) / (size * 2)
      const r1 = 0x4f, g1 = 0x46, b1 = 0xe5  // indigo-600
      const r2 = 0x7c, g2 = 0x3a, b2 = 0xed  // violet-600
      let r = Math.round(r1 + (r2 - r1) * t)
      let g = Math.round(g1 + (g2 - g1) * t)
      let b = Math.round(b1 + (b2 - b1) * t)

      // White card
      const inCard = inRoundedRect(x, y, pad, pad, size - pad * 2, size - pad * 2, cardR)
      if (inCard) { r = 255; g = 255; b = 255 }

      // Letter T
      const inT =
        inRect(x, y, tX, tBarY, tWidth, tBarH) ||                 // top bar
        inRect(x, y, tStemX, tStemY, stroke, tStemH)              // stem

      // Letter H
      const inH =
        inRect(x, y, hLeftX, letterY, stroke, letterH) ||         // left leg
        inRect(x, y, hRightX, letterY, stroke, letterH) ||        // right leg
        inRect(x, y, hLeftX, crossY, hWidth, crossH)              // crossbar

      if (inCard && (inT || inH)) {
        // Indigo-600 letters
        r = 0x4f; g = 0x46; b = 0xe5
      }

      const off = 1 + x * 3
      row[off] = r; row[off + 1] = g; row[off + 2] = b
    }
    rows.push(row)
  }

  const raw = Buffer.concat(rows)
  const compressed = deflateSync(raw)

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

writeFileSync('public/pwa-192x192.png', createPNG(192))
writeFileSync('public/pwa-512x512.png', createPNG(512))
writeFileSync('public/apple-touch-icon.png', createPNG(180))
console.log('Icons generated: pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png')
