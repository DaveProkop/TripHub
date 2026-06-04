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

function createPNG(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2 // 8-bit RGB

  // Draw: indigo background + white rounded square + simple map pin icon
  const rows = []
  const cx = size / 2, cy = size / 2
  const radius = size * 0.38
  const pinR = size * 0.22
  const pinTailLen = size * 0.18

  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3)
    row[0] = 0 // filter None
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Background: indigo #6366f1
      let r = 0x63, g = 0x66, b = 0xf1

      // White rounded square inset
      const pad = size * 0.15
      const corner = size * 0.1
      const inX = x - pad, inY = y - pad
      const inW = size - pad * 2, inH = size - pad * 2

      const inRoundedSquare =
        inX >= corner && inX <= inW - corner && inY >= 0 && inY <= inH ||
        inX >= 0 && inX <= inW && inY >= corner && inY <= inH - corner ||
        Math.sqrt(Math.pow(inX - corner, 2) + Math.pow(inY - corner, 2)) <= corner ||
        Math.sqrt(Math.pow(inX - (inW - corner), 2) + Math.pow(inY - corner, 2)) <= corner ||
        Math.sqrt(Math.pow(inX - corner, 2) + Math.pow(inY - (inH - corner), 2)) <= corner ||
        Math.sqrt(Math.pow(inX - (inW - corner), 2) + Math.pow(inY - (inH - corner), 2)) <= corner

      if (inRoundedSquare) {
        r = 255; g = 255; b = 255
      }

      // Indigo map pin (circle + tail)
      const pinCY = cy - pinTailLen * 0.3
      const dPinX = x - cx, dPinY = y - pinCY
      const pinDist = Math.sqrt(dPinX * dPinX + dPinY * dPinY)

      if (inRoundedSquare) {
        // Pin head (circle)
        if (pinDist <= pinR) {
          r = 0x63; g = 0x66; b = 0xf1
        }
        // Pin tail (triangle below circle)
        const tailBottom = pinCY + pinR + pinTailLen
        if (y > pinCY + pinR * 0.7 && y <= tailBottom) {
          const progress = (y - (pinCY + pinR * 0.7)) / (tailBottom - (pinCY + pinR * 0.7))
          const halfWidth = pinR * 0.7 * (1 - progress)
          if (Math.abs(x - cx) <= halfWidth) {
            r = 0x63; g = 0x66; b = 0xf1
          }
        }
        // White dot in pin
        if (pinDist <= pinR * 0.38) {
          r = 255; g = 255; b = 255
        }
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
