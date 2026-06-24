import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = join(root, 'tools', 'iso_model_manifest.json')
const renderScript = join(root, 'tools', 'render_iso_asset.py')

function findBlender() {
  const commandProbe = spawnSync('where', ['blender'], { encoding: 'utf8', shell: true })
  if (commandProbe.status === 0) {
    const first = commandProbe.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean)
    if (first) return first
  }

  const commonPaths = [
    'C:\\Program Files\\Blender Foundation\\Blender 4.4\\blender.exe',
    'C:\\Program Files\\Blender Foundation\\Blender 4.3\\blender.exe',
    'C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe',
    'C:\\Program Files\\Blender Foundation\\Blender 4.1\\blender.exe',
    'C:\\Program Files\\Blender Foundation\\Blender 4.0\\blender.exe',
  ]
  return commonPaths.find((path) => existsSync(path))
}

const blender = findBlender()
if (!blender) {
  console.error('Blender was not found. Install Blender, then run npm run render:iso again.')
  console.error('The GLB source files are already in src/assets/iso/models/.')
  process.exit(1)
}

const selected = new Set(process.argv.slice(2))
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

for (const item of manifest) {
  if (selected.size && !selected.has(item.name)) continue
  const inputPath = join(root, item.input)
  const outputPath = join(root, item.output)
  if (!existsSync(inputPath)) {
    console.error(`Missing model: ${item.input}`)
    process.exit(1)
  }

  const args = [
    '--background',
    '--python',
    renderScript,
    '--',
    '--input',
    inputPath,
    '--output',
    outputPath,
    '--size',
    String(item.size ?? 768),
    '--azimuth',
    String(item.azimuth ?? 45),
    '--elevation',
    String(item.elevation ?? 35.264),
    '--rotation',
    String(item.rotation ?? 0),
    '--exposure',
    String(item.exposure ?? 0.85),
    '--samples',
    String(item.samples ?? 8),
  ]
  if (item.removeGround) args.push('--remove-ground')
  if (item.floor) args.push('--floor')

  console.log(`Rendering ${item.name} -> ${item.output}`)
  const result = spawnSync(blender, args, { cwd: root, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

console.log('Done. Rebuild the Vite app after rendering new PNGs.')
