import { BrowserWindow, dialog, WebContents, Notification } from 'electron'
import { NoMatchingPluginError, DownloadCancelledError } from '../errors'
import { AppConfig } from '../../types/appConfig'
import { MangaPlugin } from '../../types/plugin'
import { DownloadTask } from '../../types/downloadQueue'
import { formatResponseError } from '../responseWrapper'
import { join } from 'node:path'
import { existsSync } from 'node:fs'

export class DownloadQueueManager {
  private queue: DownloadTask[] = []
  private isProcessing = false
  private activeController: AbortController | null = null

  constructor(
    private webContents: WebContents,
    private plugins: MangaPlugin[],
    private getConfig: () => AppConfig // Use a getter so we always have the freshest config
  ) {}

  /**
   * Send queue-update signal to frontend
   */
  private broadcastQueue(): void {
    this.webContents.send('queue-updated', this.queue)
    // this.updateTaskbarProgress()
  }

  public addTask(taskInfo: { id: string; url: string }): void {
    // If a task with this URL already exists (failed/cancelled/etc), wipe it out first.
    this.queue = this.queue.filter((t) => t.id !== taskInfo.id)
    // Then add to the queue
    this.queue.push({
      ...taskInfo,
      mangaTitle: 'Fetching info...',
      chapterTitle: '...',
      status: 'pending',
      progress: 0
    })
    this.broadcastQueue()
    this.processNext()
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing) return

    const nextTask = this.queue.find((t) => t.status === 'pending')
    if (!nextTask) return

    this.isProcessing = true
    nextTask.status = 'downloading'
    // this.broadcastQueue()

    this.activeController = new AbortController()

    try {
      const config = this.getConfig()
      const { downloadDir, namingSchema, downloadForceWhenDirExisted } = config.global

      if (!downloadDir) throw new Error('Download directory not set.')

      // 1. Dynamically find the correct plugin!
      const matchedPlugin = this.plugins.find((plugin) => {
        return plugin.validateChapterUrl(nextTask.url).isValid
      })

      if (!matchedPlugin) {
        throw new NoMatchingPluginError({ url: nextTask.url })
      }

      const siteConfig = config.sites[matchedPlugin.id]
      // 2. Fetch Metadata
      const metadata = await matchedPlugin.getChapterMetaData(nextTask.url, siteConfig)
      // nextTask.title = `「${metadata.mangaName}」${metadata.chapterDisplayName}`
      nextTask.pageCount = metadata.pageCount
      nextTask.mangaTitle = metadata.mangaTitle ?? '-'
      nextTask.chapterTitle = metadata.chapterDisplayName
      const expectedPath = join(downloadDir, nextTask.mangaTitle, metadata.chapterDisplayName)
      nextTask.savePath = expectedPath
      nextTask.chapterMetaData = metadata
      this.broadcastQueue()

      // Check for force rewrite options
      if (existsSync(expectedPath) && !downloadForceWhenDirExisted) {
        const parentWindow = BrowserWindow.fromWebContents(this.webContents)
        // This 'await' pauses the queue entirely until they click!
        const { response } = await dialog.showMessageBox(parentWindow!, {
          type: 'warning',
          buttons: ['Ok', 'Cancel'],
          defaultId: 1, // Default to Cancel so they don't accidentally hit Enter and overwrite
          cancelId: 1,
          title: 'Directory Already Exists',
          message: `The folder for "「${metadata.mangaTitle}」${metadata.chapterDisplayName}" already exists.`,
          detail: 'Do you want to overwrite it and download again?'
        })
        if (response === 1) {
          // User clicked 'Cancel Download'
          throw new DownloadCancelledError()
        }
      }

      // 3. Run the dynamic plugin logic
      await matchedPlugin.downloadChapter(
        nextTask.url,
        downloadDir,
        namingSchema,
        siteConfig,
        nextTask.chapterMetaData,
        {
          abortSignal: this.activeController.signal,
          onProgress: (current: number, total: number) => {
            nextTask.progress = Math.round((current / total) * 100)
            this.webContents.send('queue-progress', {
              id: nextTask.id,
              progress: nextTask.progress
            })
          }
        }
      )

      nextTask.status = 'completed'
      nextTask.progress = 100
      this.notifyDownloadComplete(nextTask.mangaTitle, nextTask.chapterTitle)
    } catch (error: unknown) {
      console.log(error instanceof DownloadCancelledError)
      // @ts-ignore just to print name real quick
      console.log('name' in error && error?.name)
      if (error instanceof DownloadCancelledError) {
        nextTask.status = 'cancelled'
      } else {
        console.error(`Download failed for ${nextTask.url}:`, error)
        nextTask.status = 'failed'
        const formattedError = formatResponseError(error)
        nextTask.error = formattedError
        this.notifyDownloadFailed(
          nextTask.mangaTitle,
          nextTask.chapterTitle,
          formattedError.message
        )
      }
    } finally {
      this.activeController = null
      this.isProcessing = false
      this.broadcastQueue()
      this.processNext() // Automatically start the next one
    }
  }

  public updateWebContents(newWebContents: WebContents): void {
    this.webContents = newWebContents
    this.broadcastQueue()
  }

  public cancelTask(id: string): void {
    const task = this.queue.find((t) => t.id === id)
    if (!task) return

    if (task.status === 'downloading') {
      this.activeController?.abort()
    } else if (task.status === 'pending') {
      task.status = 'cancelled'
      this.broadcastQueue()
    }
  }

  public cancelAll(): void {
    this.activeController?.abort()
    this.queue.forEach((task) => {
      if (task.status === 'pending') task.status = 'cancelled'
    })
    this.broadcastQueue()
  }

  // private updateTaskbarProgress(): void {
  //   // Find all tasks that are currently active
  //   const activeTasks = this.queue.filter(
  //     (task) => task.status === 'downloading' || task.status === 'pending'
  //   )

  //   // Get the main window safely (handles cases where the window might be closed/minimized on macOS)
  //   const mainWindow = BrowserWindow.getAllWindows()[0]
  //   if (!mainWindow) return

  //   if (activeTasks.length === 0) {
  //     // A value of -1 removes the progress bar entirely
  //     mainWindow.setProgressBar(-1)
  //     return
  //   }

  //   // Calculate the average progress across all active tasks
  //   const totalProgress = activeTasks.reduce((acc, task) => acc + task.progress, 0)
  //   const averageProgress = totalProgress / activeTasks.length

  //   // Electron expects a value between 0.0 and 1.0
  //   // Note: Windows also supports different states like 'error' or 'paused' which you can pass as a second argument!
  //   mainWindow.setProgressBar(averageProgress / 100)
  // }

  private notifyDownloadComplete(mangaTitle: string, chapterTitle: string): void {
    const config = this.getConfig()
    if (config.global.enableNotifications !== true) return

    // Always check if the OS supports notifications first
    if (Notification.isSupported()) {
      new Notification({
        title: 'Download Complete',
        body: `${mangaTitle} - ${chapterTitle} has finished downloading.`
        // Optional: Add a custom icon path here
        // icon: path.join(__dirname, '../../resources/success-icon.png')
      }).show()
    }
  }

  private notifyDownloadFailed(
    mangaTitle: string,
    chapterTitle: string,
    errorMessage: string
  ): void {
    const config = this.getConfig()
    if (config.global.enableNotifications !== true) return

    if (Notification.isSupported()) {
      new Notification({
        title: 'Download Failed',
        body: `Failed to download ${mangaTitle} - ${chapterTitle}: ${errorMessage}`
      }).show()
    }
  }
}
