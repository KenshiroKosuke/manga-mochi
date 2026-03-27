import { mkdir } from 'node:fs/promises'

export async function ensureDir(fullDir: string) {
  return await mkdir(fullDir, { recursive: true })
}
