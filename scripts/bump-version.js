import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pkgPath = join(__dirname, '..', 'package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

const parts = pkg.version.split('.')
parts[2] = String(Number(parts[2]) + 1)
pkg.version = parts.join('.')

writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
console.log(`Version bumped to ${pkg.version}`)
