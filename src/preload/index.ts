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
  startDownload: (url) => ipcRenderer.invoke('start-download', url)
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
