import { AppConfig } from './appConfig'
import { MangaPlugin } from './plugin'
import { IpcMainErrorResponse, SafeResultPromise } from './response'

/**
 * Renderer (Main World) will see this.
 * Make sure that the Main process really expose these APIs
 */
export interface BackendAPI {
  ping: () => void
  getAppData: () => SafeResultPromise<{ config: AppConfig; plugins: MangaPlugin[] }>
  selectDir: () => SafeResultPromise<string | null>
  saveConfig: (newConfig: AppConfig) => SafeResultPromise<boolean>
  /**
   * TODO:  Have Renderer figures out the correct plugin then send id along with the url.
   *        This will make the validation dynamic (find plugin in the frontend) and displays the
   *        matching plugin before clicking download button. Main process won't need to find it
   *        again which also reduces time a little.
   */
  startDownload: (
    url: string
  ) => SafeResultPromise<
    string,
    | IpcMainErrorResponse['INVALID_CHAPTER_URL_ERROR']
    | IpcMainErrorResponse['NO_PAGE_ERROR']
    | IpcMainErrorResponse['INVALID_CONFIG_ERROR']
    | IpcMainErrorResponse['EXTRACTION_FAILED_ERROR']
  >
  cancelDownload: (id: string) => SafeResultPromise<true>
  cancelAllDownloads: () => SafeResultPromise<true>
  onQueueUpdated: (callback: (queue: any[]) => void) => () => Electron.IpcRenderer
  onQueueProgress: (
    callback: (data: { id: string; progress: number }) => void
  ) => () => Electron.IpcRenderer
}
