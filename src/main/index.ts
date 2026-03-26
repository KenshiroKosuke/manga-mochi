import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { loadConfig, saveConfig } from './appConfig'
import { loadPlugins } from './loadPlugins'
import { ipcMainRegisterHandler } from './responseWrapper'
import { NoMatchingPluginError } from './errors'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    console.log('ready-to-show')
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  console.log(is.dev)
  console.log(process.env['ELECTRON_RENDERER_URL'])
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // ... create window code ...

  const plugins = await loadPlugins()
  let currentConfig = await loadConfig()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMainRegisterHandler(ipcMain, 'ping', () => console.log('pong'))

  // 1. Get Initial Data
  ipcMainRegisterHandler(ipcMain, 'get-app-data', () => {
    const appData = {
      config: currentConfig,
      plugins: plugins.map((p) => ({
        ...p,
        checkUrl: undefined,
        download: undefined,
        validateChapterUrl: undefined,
        downloadChapter: undefined
      }))
    }
    return appData
    // Note: We strip functions before sending to renderer, send only metadata
    //       since electron cannot clone function
  })

  // 2. Select Directory
  ipcMainRegisterHandler(ipcMain, 'select-dir', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return result.canceled ? null : result.filePaths[0]
  })

  // 3. Save Config
  ipcMainRegisterHandler(ipcMain, 'save-config', async (_, newConfig) => {
    currentConfig = newConfig
    await saveConfig(currentConfig)
    return true
  })

  // 4. Perform Download Logic
  ipcMainRegisterHandler(ipcMain, 'start-download', async (_, url) => {
    console.log(`[start-download] Find correct plugin from ${plugins.length} plugin(s)`)
    const matchedPlugin = plugins.find((plugin) => {
      console.log(plugin.id)
      return plugin.validateChapterUrl(url).isValid
    })

    if (!matchedPlugin) {
      throw new NoMatchingPluginError({
        url: url
      })
    }

    const siteConfig = currentConfig.sites[matchedPlugin.id]
    const { downloadDir, namingSchema } = currentConfig.global

    if (!downloadDir) throw new Error('Download directory not set.')

    // Run the plugin logic
    await matchedPlugin.downloadChapter(url, downloadDir, namingSchema, siteConfig)
    return `Download successful via ${matchedPlugin.id}`
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
