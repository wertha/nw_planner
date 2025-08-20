// Generate .ico and .icns from assets/icon.png
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const srcPng = path.resolve(__dirname, '..', 'assets', 'icon.png')
  const outDir = path.resolve(__dirname, '..', 'assets')
  if (!fs.existsSync(srcPng)) {
    console.error('Source PNG not found:', srcPng)
    process.exit(1)
  }

  const { default: iconGen } = await import('icon-gen')
  try {
    await iconGen(srcPng, outDir, {
      report: true,
      ico: { name: 'icon' },
      icns: { name: 'icon' },
      favicon: false
    })
    console.log('Icons generated in', outDir)
  } catch (err) {
    console.error('Icon generation failed:', err)
    process.exit(1)
  }
}

main()


