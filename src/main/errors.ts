import { IpcMainErrorCode, IpcMainErrorDataMap } from '../types/response'

// This is only usable in the Main process
abstract class MainResponseError extends Error {
  abstract readonly errorCode: IpcMainErrorCode
  constructor(message: string, data: object = {}) {
    super(message)
    Object.assign(this, data)
    // Dynamically set the prototype to the actual subclass being instantiated
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class InvalidChapterUrlError extends MainResponseError {
  readonly errorCode = 'INVALID_CHAPTER_URL_ERROR'
  constructor(data: IpcMainErrorDataMap['INVALID_CHAPTER_URL_ERROR']) {
    super(`URL does not match any supported website.`, data)
    this.name = 'InvalidChapterUrlError'
  }
}

export class NoMatchingPluginError extends MainResponseError {
  readonly errorCode = 'NO_MATCHING_PLUGIN_ERROR'
  constructor(data: IpcMainErrorDataMap['NO_MATCHING_PLUGIN_ERROR']) {
    super(`URL does not match any supported plugin.`, data)
    this.name = 'NoMatchingPluginError'
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
    this.name = 'InvalidConfigError'
  }
}

export class NoPageError extends MainResponseError {
  readonly errorCode = 'NO_PAGE_ERROR'
  constructor(data: IpcMainErrorDataMap['NO_PAGE_ERROR']) {
    super(
      `Cannot find any pages. This can indicate lack of credentials or manga server API change.`,
      data
    )
    this.name = 'NoPageError'
  }
}

export class ExtractionFailedError extends MainResponseError {
  readonly errorCode = 'EXTRACTION_FAILED_ERROR'
  constructor(data: IpcMainErrorDataMap['EXTRACTION_FAILED_ERROR']) {
    super(`Failed to extract data from ${data.plugin} response: ${data.reason}`, data)
    this.name = 'ExtractionFailedError'
  }
}

export class DownloadCancelledError extends MainResponseError {
  readonly errorCode = 'DOWNLOAD_CANCELLED'
  constructor() {
    super('The download was cancelled by the user.')
    this.name = 'DownloadCancelledError'
  }
}
