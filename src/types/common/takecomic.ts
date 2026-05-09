export type ViewerPage = {
  imageUrl: string
  scramble: string // "[5, 0, 8, 6, 4, 14, 1, 9, 3, 13, 15, 7, 10, 2, 11, 12]"
  sort: number
  width: number
  height: number
  expiresOn: number
}

export type ViewerResponse = {
  totalPages: number
  scrollDirection: string
  spreadDesignation: number
  result: ViewerPage[]
}

export type SavedData = {
  chapterMetaData: ViewerResponse
  comiciViewerId: string
}
