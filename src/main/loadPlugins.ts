// import { pathToFileURL } from 'node:url'
import type { MangaPlugin } from '../types/plugin'

/**
 * Load plugins dynamically at the start, utilizing vite specific helper
 * `import.meta.glob` to load module default export as MangaPlugin.
 * @returns - array of MangaPlugin
 */
export async function loadPlugins(): Promise<MangaPlugin[]> {
  // 1. Vite specific: Find all .ts files in the sibling 'plugins' folder
  // { eager: true } means load them immediately (synchronously)
  const modules = import.meta.glob('./plugins/*.ts', { eager: true })

  const plugins: MangaPlugin[] = []

  for (const path in modules) {
    const mod = modules[path] as { default: MangaPlugin }
    if (mod.default) {
      plugins.push(mod.default)
    }
  }
  return plugins
}
