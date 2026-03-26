import { IpcMain } from "electron/main";
import { SafeResult } from "../types/response";

export function ipcMainRegisterHandler (ipcMain:IpcMain, ...args: Parameters<IpcMain["handle"]>) {
  ipcMain.handle(args[0], handlerWrapper(args[1]))
}

/**
 * Wraps a function (sync or async) to catch errors and return an object
 * instead of throwing.
 * This is V8's fault not me nor electron. I think.
 */
export const handlerWrapper = <TArgs extends any[], TReturn>(fn: (...args: TArgs) => TReturn) => {
  // Return a new function that matches the original arguments
  return (
    ...args: TArgs
  ): TReturn extends Promise<infer U>
    ? Promise<SafeResult<U>> // If async, return Promise<SafeResult>
    : SafeResult<TReturn> => {
    // If sync, return SafeResult directly

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
          }) as any
      }

      console.log("Sync return", result);

      // Handle Synchronous Result
      return { success: true, data: result } as any
    } catch (error: any) {
      // Handle Synchronous Error
      return {
        success: false,
        error: formatResponseError(error)
      } as any
    }
  }
}

export function formatResponseError(error: unknown) {
  if (error instanceof Error) {
    const { name, message } = error;
    const { stack, cause, ...customProperties } = {...error}
    return {
      ...customProperties, 
      name: name,
      message: message,
    };
  }
  return {
    name: 'Unknown Invoking Error',
    message: 'Unknown error has occurred.'
  }
}
