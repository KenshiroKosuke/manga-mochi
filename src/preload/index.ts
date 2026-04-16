import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { BackendAPI } from '../types/backendApi'

// Custom APIs for renderer

const backendAPI: BackendAPI = {
  ping: (): Promise<void> => {
    return ipcRenderer.invoke('ping')
  },
  getAppData: () => ipcRenderer.invoke('get-app-data'),
  selectDir: () => ipcRenderer.invoke('select-dir'),
  saveConfig: (newConfig) => ipcRenderer.invoke('save-config', newConfig),
  startDownload: (url) => ipcRenderer.invoke('start-download', url),
  cancelDownload: (id) => ipcRenderer.invoke('cancel-download', id),
  cancelAllDownloads: () => ipcRenderer.invoke('cancel-all-downloads'),
  onQueueUpdated: (callback: (queue: any[]) => void) => {
    const listener = (_event: any, queue: any[]) => callback(queue)
    ipcRenderer.on('queue-updated', listener)

    // Return a function to remove the listener
    return () => ipcRenderer.removeListener('queue-updated', listener)
  },

  onQueueProgress: (callback: (data: { id: string; progress: number }) => void) => {
    const listener = (_event: any, data: any) => callback(data)
    ipcRenderer.on('queue-progress', listener)

    return () => ipcRenderer.removeListener('queue-progress', listener)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('backendAPI', backendAPI)
    // expose process versions for renderer
    contextBridge.exposeInMainWorld('versions', process.versions)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.backendAPI = backendAPI
  // @ts-ignore (define in dts)
  window.versions = process.versions
}
