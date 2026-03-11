import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import path from 'node:path'

const packageJsonPath = path.resolve('package.json')
const version = JSON.parse(readFileSync(packageJsonPath, 'utf8')).version
const distDir = path.resolve('dist')

if (!existsSync(distDir)) {
  console.log('No dist directory found; nothing to clean.')
  process.exit(0)
}

const keepNames = new Set([
  `QLab Sync Monitor-${version}-windows.zip`,
])

const entries = readdirSync(distDir, { withFileTypes: true })

for (const entry of entries) {
  const name = entry.name
  const fullPath = path.join(distDir, name)

  const isCurrentVersionDmg = name.toLowerCase().endsWith('.dmg') && name.includes(`-${version}`)
  const isKeptFile = keepNames.has(name) || isCurrentVersionDmg

  if (!isKeptFile) {
    rmSync(fullPath, { recursive: true, force: true })
  }
}

console.log(`Cleaned dist. Kept current version DMG and Windows ZIP for v${version}.`)
