// Single Source of Truth for Error Codes
export type IpcMainErrorDataMap = {
  INVALID_CHAPTER_URL_ERROR: { url: string }
  NO_MATCHING_PLUGIN_ERROR: { url: string }
  INVALID_CONFIG_ERROR: { configs: { name: string; value: any; error: any }[] }
  NO_PAGE_ERROR: { hint: string }
  EXTRACTION_FAILED_ERROR: { plugin: string; reason: string }
  DOWNLOAD_CANCELLED: undefined
}

// Union type for convenience
export type IpcMainErrorCode = keyof IpcMainErrorDataMap

// Proper response that Renderer receives
export type IpcMainErrorResponse = {
  [K in keyof IpcMainErrorDataMap]: {
    errorCode: K // e.g. "INVALID_CHAPTER_URL_ERROR" (The Discriminator)
    message: string // Common property for all errors
  } & IpcMainErrorDataMap[K] // Merge in the specific data props
}

/**
 * Define the standard response structure.
 * Generic Type E for error can be a union.
 */
export type SafeResult<T, E = { message: string }> =
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * Promise for async operation return type
 */
export type SafeResultPromise<T, E = { message: string }> = Promise<SafeResult<T, E>>
