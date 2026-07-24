import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative, resolve, sep } from 'node:path'

const root = process.cwd()
const packagesRoot = resolve(root, 'packages')
const violations = []
const forbiddenRuntimeDependencies = new Set(['phaser', 'vue', 'vue-i18n'])

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) await walk(path)
    else if (['.ts', '.tsx', '.js', '.mjs'].includes(extname(entry.name))) await inspect(path)
  }
}

async function inspect(filename) {
  const source = await readFile(filename, 'utf8')
  const packageDirectory = resolve(packagesRoot, relative(packagesRoot, filename).split(sep)[0])
  const importPattern = /(?:from\s+|import\s*\()(['"])([^'"]+)\1/g
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[2]
    if (specifier.includes('apps/')) violations.push(`${relative(root, filename)} importe ${specifier}`)
    if (forbiddenRuntimeDependencies.has(specifier)) {
      violations.push(`${relative(root, filename)} dépend du runtime ${specifier}`)
    }
    if (specifier.startsWith('.')) {
      const target = resolve(filename, '..', specifier)
      if (!target.startsWith(`${packageDirectory}${sep}`) && target !== packageDirectory) {
        violations.push(`${relative(root, filename)} sort de son package via ${specifier}`)
      }
    }
  }
}

await walk(packagesRoot)

if (violations.length) {
  console.error('Frontières architecturales non respectées :\n' + violations.map(item => `- ${item}`).join('\n'))
  process.exit(1)
}

console.log('Frontières architecturales validées.')
