import path from 'node:path'
import { setTimeout } from 'timers/promises'
import { DownloadChapterFunction, GetChapterMetaDataFunction } from '../../../types/plugin'
import { DownloadCancelledError, InvalidChapterUrlError, NoPageError } from '../../errors'
import { MangaOneConfigSchema } from './configFields'
import { mangaone_validateChapterUrl } from './urlValidator'
import { detectPageExtension, writeSinglePage } from '../writePage.util'
import { ensureDir } from '../../directory.util'
import {
  mangaone_fetchAndExtractPageList,
  MangaoneFetchAndExtractPageListResponse
} from './extractor/extractChapter'
import { mangaone_fetchAndDecryptPage } from './extractor/decryptPage'
import { validateConfigSchema } from '../pluginConfig.util'
import { formatChapterDisplayName } from '../formatName.util'

// TODO:
// - use path to netscape cookies text file directly?
// - only use site config for non-credential config

export const mangaone_getChapterMetaData: GetChapterMetaDataFunction = async (url, configData) => {
  validateConfigSchema(configData, MangaOneConfigSchema)
  const chapterUrlValidationResult = mangaone_validateChapterUrl(url)
  if (chapterUrlValidationResult.isValid == false) {
    throw new InvalidChapterUrlError({
      url: url
    })
  }

  const chapterId = chapterUrlValidationResult.chapterId

  const { urls, chapterName, chapterNumber, mangaName, decryptData } =
    await mangaone_fetchAndExtractPageList(
      {
        title_id: chapterUrlValidationResult.mangaId,
        chapter_id: chapterId
      },
      {
        api_session: configData.api_session,
        manga_one_session: configData.manga_one_session
      }
    )

  return {
    chapterId,
    chapterTitle: chapterName,
    chapterNumber,
    mangaId: chapterUrlValidationResult.mangaId,
    mangaTitle: mangaName,
    pageCount: urls.length,
    chapterDisplayName: formatChapterDisplayName({
      chapterId,
      chapterNumber,
      chapterTitle: chapterName
    }),
    savedData: { urls, chapterName, chapterNumber, mangaName, decryptData }
  }
}

export const mangaone_downloadChapter: DownloadChapterFunction = async (
  url,
  savePath,
  namingSchema,
  configData,
  chapterMetaData,
  taskProcess
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

  const { urls, chapterName, chapterNumber, decryptData, mangaName } =
    (chapterMetaData?.savedData as MangaoneFetchAndExtractPageListResponse) ??
    (await mangaone_fetchAndExtractPageList(
      {
        title_id: chapterUrlValidationResult.mangaId,
        chapter_id: chapterUrlValidationResult.chapterId
      },
      {
        api_session: configData.api_session,
        manga_one_session: configData.manga_one_session
      }
    ))

  if (urls.length == 0) {
    throw new NoPageError({ hint: 'Recheck if your api session is still valid.' })
  }

  const fullDir = path.join(
    savePath,
    mangaName ?? chapterUrlValidationResult.mangaId,
    formatChapterDisplayName({
      chapterId: chapterUrlValidationResult.chapterId,
      chapterNumber,
      chapterTitle: chapterName
    })
  )
  console.log(`[mangaone_downloadChapter] Prepare writing file to ${fullDir} ...`)
  await ensureDir(fullDir)
  const pageLength = urls.length
  for (let pageNumber = 1; pageNumber <= pageLength; pageNumber++) {
    // Check for cancellation BEFORE starting the next page
    if (taskProcess?.abortSignal.aborted) {
      throw new DownloadCancelledError()
    }
    const url = urls[pageNumber - 1]
    const bufferData = await mangaone_fetchAndDecryptPage(url, decryptData)
    const detectedExtension = detectPageExtension(bufferData, '.png')
    await writeSinglePage({
      extension: detectedExtension,
      fullDir: fullDir,
      namingSchema: namingSchema,
      pageData: bufferData,
      pageNumber: pageNumber
    })

    // Report Progress back to the queue manager
    taskProcess?.onProgress(pageNumber, pageLength)

    if (pageNumber !== pageLength) {
      const sleepTime = 0.5
      console.log(`[mangaone_downloadChapter] Sleeping ${sleepTime} seconds ...`)
      await setTimeout(sleepTime * 1000)
    }
  }
  return fullDir
}
