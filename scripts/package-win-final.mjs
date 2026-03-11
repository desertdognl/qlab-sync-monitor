import { copyFileSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const packageJsonPath = path.resolve('package.json')
const version = JSON.parse(readFileSync(packageJsonPath, 'utf8')).version
const distDir = path.resolve('dist')
const windowsReadme = path.resolve('build/README-INSTALL-WINDOWS.txt')

if (!existsSync(distDir)) {
  throw new Error('dist directory not found. Run the Windows build first.')
}

if (!existsSync(windowsReadme)) {
  throw new Error('Missing build/README-INSTALL-WINDOWS.txt')
}

const exeCandidates = readdirSync(distDir)
  .filter((name) => name.toLowerCase().endsWith('.exe') && name.includes(version))
  .sort()

if (!exeCandidates.length) {
  throw new Error(`No Windows installer EXE found in dist for version ${version}`)
}

const sourceExe = path.join(distDir, exeCandidates[exeCandidates.length - 1])
const tempDir = mkdtempSync(path.join(tmpdir(), 'qlab-sync-win-'))
const finalExeName = `Setup ${version}.exe`
const finalZipName = `QLab Sync Monitor-${version}-windows.zip`
const tempExePath = path.join(tempDir, finalExeName)
const tempReadmePath = path.join(tempDir, 'README-INSTALL-WINDOWS.txt')
const zipPath = path.join(distDir, finalZipName)

copyFileSync(sourceExe, tempExePath)
copyFileSync(windowsReadme, tempReadmePath)

execFileSync('zip', ['-j', zipPath, tempExePath, tempReadmePath], { stdio: 'inherit' })

rmSync(tempDir, { recursive: true, force: true })

console.log(`Created ${zipPath}`)
