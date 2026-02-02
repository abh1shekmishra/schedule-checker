import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(process.cwd())
const publicDir = path.join(root, 'public')

const svg = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0A84FF"/>
      <stop offset="1" stop-color="#64D2FF"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="512" height="512" rx="120" fill="url(#g)"/>
  <circle cx="256" cy="256" r="96" fill="#FFFFFF" fill-opacity="0.92"/>
</svg>`

await fs.mkdir(publicDir, { recursive: true })

const icon192 = Buffer.from(svg(192))
const icon512 = Buffer.from(svg(512))

await sharp(icon192).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'))
await sharp(icon512).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'))
