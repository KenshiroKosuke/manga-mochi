import { WebContents } from 'electron'
import { NoMatchingPluginError, DownloadCancelledError } from '../errors'
import { AppConfig } from '../../types/appConfig'
import { MangaPlugin } from '../../types/plugin'
import { DownloadTask } from '../../types/downloadQueue'
import { formatResponseError } from '../responseWrapper'

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
  private broadcastQueue() {
    this.webContents.send('queue-updated', this.queue)
  }

  public addTask(taskInfo: { id: string; url: string }) {
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

  private async processNext() {
    if (this.isProcessing) return

    const nextTask = this.queue.find((t) => t.status === 'pending')
    if (!nextTask) return

    this.isProcessing = true
    nextTask.status = 'downloading'
    // this.broadcastQueue()

    this.activeController = new AbortController()

    try {
      const config = this.getConfig()
      const { downloadDir, namingSchema } = config.global

      if (!downloadDir) throw new Error('Download directory not set.')

      // 1. Dynamically find the correct plugin!
      const matchedPlugin = this.plugins.find((plugin) => {
        return plugin.validateChapterUrl(nextTask.url).isValid
      })

      if (!matchedPlugin) {
        throw new NoMatchingPluginError({ url: nextTask.url })
      }

      const siteConfig = config.sites[matchedPlugin.id]
      const metadata = await matchedPlugin.getChapterMetaData(nextTask.url, siteConfig)
      // nextTask.title = `「${metadata.mangaName}」${metadata.chapterDisplayName}`
      nextTask.pageCount = metadata.pageCount
      nextTask.mangaTitle = metadata.mangaName ?? '-'
      nextTask.chapterTitle = metadata.chapterDisplayName
      this.broadcastQueue()

      // 2. Run the dynamic plugin logic
      const fullDir = await matchedPlugin.downloadChapter(
        nextTask.url,
        downloadDir,
        namingSchema,
        siteConfig,
        (current: number, total: number) => {
          nextTask.progress = Math.round((current / total) * 100)
          this.webContents.send('queue-progress', { id: nextTask.id, progress: nextTask.progress })
        },
        this.activeController.signal
      )

      nextTask.status = 'completed'
      nextTask.progress = 100
      nextTask.savePath = fullDir
    } catch (error: any) {
      if (error instanceof DownloadCancelledError || error.errorCode === 'DOWNLOAD_CANCELLED') {
        nextTask.status = 'cancelled'
      } else {
        console.error(`Download failed for ${nextTask.url}:`, error)
        nextTask.status = 'failed'
        nextTask.error = formatResponseError(error)
      }
    } finally {
      this.activeController = null
      this.isProcessing = false
      this.broadcastQueue()
      this.processNext() // Automatically start the next one
    }
  }

  public updateWebContents(newWebContents: WebContents) {
    this.webContents = newWebContents
    this.broadcastQueue()
  }

  public cancelTask(id: string) {
    const task = this.queue.find((t) => t.id === id)
    if (!task) return

    if (task.status === 'downloading') {
      this.activeController?.abort()
    } else if (task.status === 'pending') {
      task.status = 'cancelled'
      this.broadcastQueue()
    }
  }

  public cancelAll() {
    this.activeController?.abort()
    this.queue.forEach((task) => {
      if (task.status === 'pending') task.status = 'cancelled'
    })
    this.broadcastQueue()
  }
}
