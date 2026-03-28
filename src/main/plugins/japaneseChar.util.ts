import { Buffer } from 'node:buffer'

// Allows: Space, Japanese, English, Numbers, and URL path characters ( . : / - _ )
export const mangaCharacterRegex =
  /[\s\u3040-\u30FF\u4E00-\u9FAF\uFF01-\uFF5Ea-zA-Z0-9ー×&!?',.\-_\/:\(\)\[\]（）［］]+/g

// --- Helper Function: Clean and Sanitize Titles ---
export function cleanAndSanitize(rawText: string) {

  // OS Folder Name Sanitizer
  // Windows/Mac do not allow these characters in folder/file names: \ / : * ? " < > |
  // We replace them with a space so the OS doesn't throw a fatal error.
  const clean = rawText.replace(/[\\/:*?"<>|]/g, ' ')

  // Final trim to remove extra spaces
  return clean.trim()
}

/**
 * Mathematically detects and removes Protobuf length-byte artifacts
 * that accidentally fall into the printable ASCII range.
 */
export function stripProtobufArtifacts(text: string): string {
  if (!text || text.length < 2) return text

  // 1. Get the ASCII code of the very first character
  const firstChar = text[0]
  const firstCharCode = firstChar.charCodeAt(0)

  // 2. Protobuf length bytes that cause issues are in the printable ASCII range (32-126)
  // https://www.ascii-code.com/
  if (firstCharCode >= 32 && firstCharCode <= 126) {
    const restOfString = text.slice(1)

    // 3. Calculate the actual UTF-8 byte length of the string
    const byteLength = Buffer.byteLength(restOfString, 'utf8')

    // 4. CHECK: If the ASCII value equals the byte length, it's an artifact!
    if (byteLength === firstCharCode) {
      return restOfString // Return the perfectly clean string
    }
  }

  // If it didn't match (e.g., the manga is actually called "86"), return it untouched.
  return text
}

/**
 * Strips binary artifacts first, then makes it OS-safe.
 */
export function stripProtobufArtifactsAndClean(text: string): string {
  return cleanAndSanitize(stripProtobufArtifacts(text))
}
