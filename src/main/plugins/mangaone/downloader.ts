import path from 'node:path'
import { setTimeout } from 'timers/promises'
import { DownloadChapterFunction } from '../../../types/plugin'
import { InvalidChapterUrlError } from '../../errors'
import { MangaOneConfigSchema } from './configFields'
import { mangaone_validateChapterUrl } from './urlValidator'
import { detectPageExtension, writeSinglePage } from '../writePage.util'
import { ensureDir } from '../../directory.util'
import { mangaone_fetchAndExtractPageList } from './extractor/extractChapter'
import { mangaone_fetchAndDecryptPage } from './extractor/decryptPage'
import { validateConfigSchema } from '../pluginConfig.util'

export const mangaone_downloadChapter: DownloadChapterFunction = async (
  url,
  savePath,
  namingSchema,
  configData
) => {
  // Q. Do we need to verify config everytime? Seems like just at the app start up would be enough
  // A. Yes, we do. Otherwise, how would we check if it's before or after user provided the config.
  validateConfigSchema(configData, MangaOneConfigSchema)
  const chapterUrlValidationResult = mangaone_validateChapterUrl(url)
  if (chapterUrlValidationResult.isValid == false) {
    throw new InvalidChapterUrlError({
      url: url
    })
  }

  const { urls, decryptData, chapterName, chapterNumber, mangaName } =
    await mangaone_fetchAndExtractPageList(
      {
        title_id: chapterUrlValidationResult.mangaId,
        chapter_id: chapterUrlValidationResult.chapterId
      },
      {
        api_session: configData.api_session,
        manga_one_session: configData.manga_one_session
      }
    )

  const fullDir = path.join(
    savePath,
    mangaName ?? chapterUrlValidationResult.mangaId,
    chapterNumber || chapterName
      ? ((chapterNumber ?? '') + ' ' + (chapterName ?? '')).trim()
      : chapterUrlValidationResult.chapterId
  )
  console.log(`[mangaone_downloadChapter] Prepare writing file to ${fullDir} ...`)
  await ensureDir(fullDir)
  const pageLength = urls.length
  for (let pageNumber = 1; pageNumber <= pageLength; pageNumber++) {
    const url = urls[pageNumber - 1]
    const bufferData = await mangaone_fetchAndDecryptPage(url, decryptData)
    const detectedExtension = detectPageExtension(bufferData, '.webp')
    await writeSinglePage({
      extension: detectedExtension,
      fullDir: fullDir,
      namingSchema: namingSchema,
      pageData: bufferData,
      pageNumber: pageNumber
    })

    if (pageNumber !== pageLength) {
      const sleepTime = 0.5
      console.log(`[mangaone_downloadChapter] Sleeping ${sleepTime} seconds ...`)
      await setTimeout(sleepTime * 1000)
    }
  }
}
