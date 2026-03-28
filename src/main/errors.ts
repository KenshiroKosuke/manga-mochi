import { IpcMainErrorCode, IpcMainErrorDataMap } from '../types/response'

// This is only usable in the Main process
abstract class MainResponseError extends Error {
  abstract readonly errorCode: IpcMainErrorCode
  constructor(message: string, data: Object = {}) {
    super(message)
    Object.assign(this, data)
    Object.setPrototypeOf(this, MainResponseError.prototype)
  }
}

export class InvalidChapterUrlError extends MainResponseError {
  readonly errorCode = 'INVALID_CHAPTER_URL_ERROR'
  constructor(data: IpcMainErrorDataMap['INVALID_CHAPTER_URL_ERROR']) {
    super(`URL does not match any supported website.`, data)
  }
}

export class NoMatchingPluginError extends MainResponseError {
  readonly errorCode = 'NO_MATCHING_PLUGIN_ERROR'
  constructor(data: IpcMainErrorDataMap['NO_MATCHING_PLUGIN_ERROR']) {
    super(`URL does not match any supported plugin.`, data)
  }
}

export class InvalidConfigError extends MainResponseError {
  readonly errorCode = 'INVALID_CONFIG_ERROR'
  constructor(data: IpcMainErrorDataMap['INVALID_CONFIG_ERROR']) {
    const configErrorString = data.configs
      .map(
        (configError) =>
          `'${configError.name}' ${configError.error} (received: ${configError.value})`
      )
      .join(' | ')
    super(`Some configs are invalid. Please check your config file. ${configErrorString}`, data)
  }
}

export class NoPageError extends MainResponseError {
  readonly errorCode = 'NO_PAGE_ERROR'
  constructor(data: IpcMainErrorDataMap['NO_PAGE_ERROR']) {
    super(
      `Cannot find any pages. This can indicate lack of credentials or manga server API change.`,
      data
    )
  }
}

export class ExtractionFailedError extends MainResponseError {
  readonly errorCode = 'EXTRACTION_FAILED_ERROR'
  constructor(data: IpcMainErrorDataMap['EXTRACTION_FAILED_ERROR']) {
    super(`Failed to extract data from ${data.plugin} response: ${data.reason}`, data)
  }
}
