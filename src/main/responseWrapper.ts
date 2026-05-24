import { IpcMain } from 'electron/main'
import { SafeResult } from '../types/response'

export function ipcMainRegisterHandler(
  ipcMain: IpcMain,
  ...args: Parameters<IpcMain['handle']>
): void {
  ipcMain.handle(args[0], handlerWrapper(args[1]))
}

/**
 * Wraps a function (sync or async) to catch errors and return an object
 * instead of throwing.
 * This is V8's fault not me nor electron. I think.
 */
export const handlerWrapper = <TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn
) => {
  // Return a new function that matches the original arguments
  return (...args: TArgs) => {
    // If sync, return SafeResult directly
    /**
     * alias for complex conditional return type
     */
    type WrapperReturn =
      TReturn extends Promise<infer U> ? Promise<SafeResult<U>> : SafeResult<TReturn>

    try {
      const result = fn(...args)

      // Check if the result is a Promise (Async Handler)
      if (result instanceof Promise) {
        return result
          .then((data) => {
            return { success: true, data }
          })
          .catch((error) => {
            return {
              success: false,
              error: formatResponseError(error)
            }
          }) as WrapperReturn
      }

      console.log('Sync return', result)

      // Handle Synchronous Result
      return { success: true, data: result } as WrapperReturn
    } catch (error) {
      // Handle Synchronous Error
      return {
        success: false,
        error: formatResponseError(error)
      } as WrapperReturn
    }
  }
}

export function formatResponseError(error: unknown): { name: string; message: string } {
  if (error instanceof Error) {
    const { name, message } = error
    const { stack, cause, ...customProperties } = { ...error }
    return {
      ...customProperties,
      name: name,
      message: message
    }
  }
  return {
    name: 'UnknownError',
    message: 'Unknown error has occurred.'
  }
}
