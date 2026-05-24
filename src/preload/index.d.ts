import { ElectronAPI } from '@electron-toolkit/preload'
import { BackendAPI } from 'src/types/backendApi'

/**
 * Define global Window type here. The implementation is at src/preload/index.ts
 */

declare global {
  interface Window {
    electron: ElectronAPI
    versions: {
      [key: string]: string | undefined
    }
    backendAPI: BackendAPI
  }
}
