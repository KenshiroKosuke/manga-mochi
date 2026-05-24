import { ValidateChapterUrl } from '../../../types/plugin'

// Regex explanation:
// 1. manga-one\.com\/manga\/  -> Literal path match
// 2. (\d+)                    -> Capture Group 1: The Manga ID (digits)
// 3. \/chapter\/              -> Literal path match
// 4. (\d+)                    -> Capture Group 2: The Chapter ID (digits)
export const mangaone_chapterRegexList: RegExp[] = [/manga-one\.com\/manga\/(\d+)\/chapter\/(\d+)/]
export const mangaone_validateChapterUrl: ValidateChapterUrl<true> = (url) => {
  for (const chapterRegex of mangaone_chapterRegexList) {
    const match = url.match(chapterRegex)
    if (match && match.length <= 3) {
      return {
        isValid: true,
        mangaId: match[1], // The first (\d+) capture group
        chapterId: match[2] // The second (\d+) capture group
      }
    }
  }
  return {
    isValid: false,
    mangaId: null,
    chapterId: null
  }
}
