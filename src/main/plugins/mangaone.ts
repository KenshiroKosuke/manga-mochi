import { ConfigField, MangaPlugin } from '../../types/plugin'
import { mkdir, writeFile } from 'node:fs/promises'
import * as path from 'node:path'
import { InvalidChapterUrlError } from '../errors'
import { validateConfigFields } from '../checkPluginUtil'
import { MangaOneConfig } from '../../types/plugins/mangaone'
// import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

const configFields: ConfigField[] = [
  {
    fieldName: 'api_session',
    isSensitive: true,
    description: 'Get this from cookies'
  },
  {
    fieldName: 'manga_one_session',
    isSensitive: true,
    description: 'Get this from cookies'
  }
]

// Regex explanation:
// 1. manga-one\.com\/manga\/  -> Literal path match
// 2. (\d+)                    -> Capture Group 1: The Manga ID (digits)
// 3. \/chapter\/              -> Literal path match
// 4. (\d+)                    -> Capture Group 2: The Chapter ID (digits)
const chapterRegexList: RegExp[] = [/manga-one\.com\/manga\/(\d+)\/chapter\/(\d+)/]
const validateChapterUrl: MangaPlugin['validateChapterUrl'] = (url) => {
  for (const chapterRegex of chapterRegexList) {
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

const plugin: MangaPlugin = {
  // name: 'MangaOne',
  id: 'MangaOne',
  configFields: configFields,
  chapterRegexList: chapterRegexList,

  validateChapterUrl: validateChapterUrl,

  downloadChapter: async (url, savePath, namingSchema, configData) => {
    const chapterUrlValidationResult = validateChapterUrl(url)
    // Q. Do we need to verify config everytime? Seems like just at the app start up would be enough
    // A. Yes, we do. Otherwise, how would we check if it's before or after user provided the config.
    validateConfigFields<MangaOneConfig>(configData, configFields)
    if (chapterUrlValidationResult.isValid == false) {
      throw new InvalidChapterUrlError({
        url: url
      })
    }

    // Mock: Create a folder for the manga
    const mangaTitle = 'MockMangaTitle'
    const chapterTitle = 'Chapter_1'
    const fullDir = path.join(savePath, mangaTitle, chapterTitle)

    await mkdir(fullDir, { recursive: true })

    // Mock: Generate 10 files based on naming schema (e.g., p00X -> p001.txt)
    for (let i = 1; i <= 10; i++) {
      // Logic to handle 'X' placeholder padding
      const xCount = (namingSchema.match(/X/g) || []).length
      const numStr = i.toString().padStart(xCount, '0')
      const fileName = namingSchema.replace(/X+/g, numStr) + '.txt'
      await writeFile(path.join(fullDir, fileName), `Content for ${fileName}`)
    }
  }
}

export default plugin
