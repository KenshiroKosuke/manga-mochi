import * as path from 'node:path'
import * as os from 'node:os'
import type { AppConfig } from '../types/appConfig'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const CONFIG_FILENAME = '.mangamochi'
const CONFIG_DIRECTORY = path.join(os.homedir(), 'mangamochi')
const CONFIG_PATH = path.join(CONFIG_DIRECTORY, CONFIG_FILENAME)

const DEFAULT_CONFIG: AppConfig = {
  global: {
    downloadDir: '',
    namingSchema: 'p_XXX',
    pinnedSites: [],
    downloadForceWhenDirExisted: false,
    enableNotifications: false
  },
  sites: {}
}

/**
 * Load app configs at the start, including all JSON data with plugin id as key.
 */
export async function loadConfig(): Promise<AppConfig> {
  console.log(`Loading config from: ${CONFIG_PATH}`)

  try {
    // 1. Just try to read it directly (avoids existsSync anti-pattern)
    const data = await readFile(CONFIG_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error: unknown) {
    // 2. If the error is ENOENT, the file simply doesn't exist yet.
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      console.log('❌ Config not found. Creating default...')
    } else {
      console.log('❌ Config corrupted or unreadable. Overwriting with default...')
      console.error(error)
    }

    // Safely create the directory and write the default file
    await mkdir(CONFIG_DIRECTORY, { recursive: true })
    await writeFile(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2))
    return DEFAULT_CONFIG
  }
}

export async function saveConfig(newConfig: AppConfig): Promise<void> {
  await mkdir(CONFIG_DIRECTORY, { recursive: true })
  await writeFile(CONFIG_PATH, JSON.stringify(newConfig, null, 2))
}
