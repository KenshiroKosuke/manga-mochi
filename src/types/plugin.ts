export interface UIConfigField {
  /**
   * Frontend will use this as label
   */
  fieldName: string
  /**
   * Frontend will mark this field as sensitive password
   */
  isSensitive?: boolean
  /**
   * Frontend will use this as tooltip text
   */
  description?: string
}

export type ValidateChapterUrl<WithMangaId extends boolean = false> = (url: string) =>
  | {
      isValid: true
      mangaId: WithMangaId extends true ? string : string | undefined
      chapterId: string
    }
  | {
      isValid: false
      mangaId: null
      chapterId: null
    }

export type DownloadChapterFunction = (
  url: string,
  savePath: string,
  namingSchema: string,
  // After main process used validateChapterUrl to find the correct plugin.
  // Could be `undefined` if the config is missing from .mangamochi entirely
  configData: unknown,
  chapterMetaData: ChapterMetaData | undefined,
  taskProcess?: {
    onProgress: (current: number, total: number) => void
    abortSignal: AbortSignal
  }
) => Promise<string>

export type ChapterMetaData = {
  mangaTitle: string | undefined
  mangaId: string | undefined
  chapterId: string | undefined
  chapterNumber: string | undefined
  chapterTitle: string | undefined
  /**
   * Effective name for a chapter
   */
  chapterDisplayName: string
  pageCount: number
  savedData?: unknown
}

export type GetChapterMetaDataFunction = (
  url: string,
  configData: unknown
) => Promise<ChapterMetaData>

// The shape every website plugin must follow
export interface MangaPlugin {
  /**
   * Unique ID for internal tracking
   */
  id: string
  /**
   * Fields the user needs to configure (e.g., username, password)
   */
  uiConfigFields: UIConfigField[]
  chapterRegexList: RegExp[]
  /**
   * Validation method
   * @param url
   * @returns validation result (mangaId might not be part of url)
   */
  validateChapterUrl: ValidateChapterUrl<boolean>
  /**
   * Download method
   */
  downloadChapter: DownloadChapterFunction
  /**
   * Get meta info method
   */
  getChapterMetaData: GetChapterMetaDataFunction
}
