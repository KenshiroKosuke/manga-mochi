export type DownloadTask = {
  id: string
  // title: string
  mangaTitle: string   // 🌟 Split into two columns
  chapterTitle: string // 🌟 Split into two columns
  url: string
  pageCount?: number
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled'
  progress: number
  error?: any
  savePath?: string
}
