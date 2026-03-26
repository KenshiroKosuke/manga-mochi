import { IpcMainErrorCode, IpcMainErrorDataMap } from "../types/response";

// This is only usable in the Main process
abstract class MainResponseError extends Error {
  abstract readonly errorCode: IpcMainErrorCode;
  constructor(message: string, data: Object = {}) {
    super(message)
    Object.assign(this, data)
    Object.setPrototypeOf(this, MainResponseError.prototype)
  }
}

export class InvalidChapterUrlError extends MainResponseError {
  readonly errorCode = 'INVALID_CHAPTER_URL_ERROR'
  constructor(data: IpcMainErrorDataMap["INVALID_CHAPTER_URL_ERROR"]) {
    super(`URL does not match any supported website.`, data);
  }
}

export class NoMatchingPluginError extends MainResponseError {
  readonly errorCode = 'NO_MATCHING_PLUGIN_ERROR'
  constructor(data: IpcMainErrorDataMap["NO_MATCHING_PLUGIN_ERROR"]) {
    super(`URL does not match any supported plugin.`, data);
  }
}

export class InvalidConfigError extends MainResponseError {
  readonly errorCode = 'INVALID_CONFIG_ERROR'
  constructor(data: IpcMainErrorDataMap["INVALID_CONFIG_ERROR"]) {
    super(`Some configs are invalid. Please check your config file.`, data);
  }
} 