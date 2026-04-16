export type DownloadTask = {
  id: string
  title: string
  url: string
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'cancelled'
  progress: number
  error?: any
  savePath?: string
}
