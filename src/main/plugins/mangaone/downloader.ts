import path from 'node:path'
import { DownloadChapterFunction } from '../../../types/plugin'
import { MangaOneConfig } from '../../../types/plugins/mangaone'
import { validateConfigFields } from '../../checkPluginUtil'
import { InvalidChapterUrlError } from '../../errors'
import { mangaone_configFields } from './configFields'
import { mangaone_validateChapterUrl } from './urlValidator'
import { mkdir, writeFile } from 'node:fs/promises'

export const mangaone_downloadChapter: DownloadChapterFunction = async (
  url,
  savePath,
  namingSchema,
  configData
) => {
  // Q. Do we need to verify config everytime? Seems like just at the app start up would be enough
  // A. Yes, we do. Otherwise, how would we check if it's before or after user provided the config.
  validateConfigFields<MangaOneConfig>(configData, mangaone_configFields)
  const chapterUrlValidationResult = mangaone_validateChapterUrl(url)
  if (chapterUrlValidationResult.isValid == false) {
    throw new InvalidChapterUrlError({
      url: url
    })
  }

  // Mock: Create a folder for the manga
  const mangaTitle = 'MockMangaTitle'
  const chapterTitle = 'Chapter_2'
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
