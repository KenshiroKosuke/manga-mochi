import { mkdir } from 'node:fs/promises'

export async function ensureDir(fullDir: string): Promise<string | undefined> {
  return await mkdir(fullDir, { recursive: true })
}
