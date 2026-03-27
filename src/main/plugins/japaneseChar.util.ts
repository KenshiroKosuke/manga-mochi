// Allows: Space, Japanese, English, Numbers, and URL path characters ( . : / - _ )
export const mangaCharacterRegex =
  /[\s\u3040-\u30FF\u4E00-\u9FAF\uFF01-\uFF5Ea-zA-Z0-9ー×&!?',.\-_\/:]+/g

// --- Helper Function: Clean and Sanitize Titles ---
export function cleanAndSanitize(rawText) {
  // 1. The Inclusive Whitelist
  // Allow:
  // a-zA-Z0-9 : Standard English and Numbers
  // \s        : Spaces
  // \u3040-\u30FF : Hiragana & Katakana
  // \u4E00-\u9FAF : Kanji
  // \uFF01-\uFF5E : Full-width Japanese alphanumeric & punctuation (e.g., ＳＰＹ)
  // ~×&!?',.\-  : Common symbols used in manga titles (Notice we exclude double quotes " )
  let clean = rawText.replace(
    /[^a-zA-Z0-9\s\u3040-\u30FF\u4E00-\u9FAF\uFF01-\uFF5E~×&!?',.\-]/g,
    ''
  )

  // 2. The Protobuf Artifact Trimmer
  // Because English is now allowed, random Protobuf length bytes (like 's' or 'H')
  // that get stuck to the end of the string might survive the whitelist.
  // If the string ends with a random lowercase letter that doesn't make sense, we can trim it.
  // (This safely removes the 's' from " shttps://")
  clean = clean.replace(/\s?[a-z]$/, '')

  // 3. OS Folder Name Sanitizer
  // Windows/Mac do not allow these characters in folder/file names: \ / : * ? " < > |
  // We replace them with a standard Japanese full-width space or an underscore.
  clean = clean.replace(/[\\/:*?"<>|]/g, ' ')

  // 4. Final trim to remove extra spaces at the ends
  return clean.trim()
}
