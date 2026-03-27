export interface ConfigField {
  /**
   * Frontend will mark this field as sensitive password
   */
  isSensitive: boolean
  /**
   * Frontend will use this as label
   */
  fieldName: string
  /**
   * Frontend will use this as tooltip text
   */
  description?: string
}

export type ValidateChapterUrl = (url: string) =>
    | {
        isValid: true
        mangaId?: string
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
  configData: unknown // After main process used validateChapterUrl to find the correct plugin.
  // Could be `undefined` if the config is missing from .mangamochi entirely
) => Promise<void>

// The shape every website plugin must follow
export interface MangaPlugin {
  // name: string
  /**
   * Unique ID for internal tracking
   */
  id: string
  /**
   * Fields the user needs to configure (e.g., username, password)
   */
  configFields: ConfigField[]
  chapterRegexList: RegExp[]
  /**
   * Validation method
   * @param url
   * @returns validation result (mangaId might not be part of url)
   */
  validateChapterUrl: ValidateChapterUrl
  /**
   * Download method
   */
  downloadChapter: DownloadChapterFunction
}
