import path from 'node:path'
import { type SavedData, type ViewerResponse } from '../../../types/common/takecomic'
import {
  DownloadChapterFunction,
  GetChapterMetaDataFunction,
  MangaPlugin,
  ValidateChapterUrl
} from '../../../types/plugin'
import { DownloadCancelledError, ExtractionFailedError, InvalidChapterUrlError } from '../../errors'
import { PanelDescrambler } from '../descrambler'
import { formatChapterDisplayName } from '../formatName.util'
import HTMLParser from 'node-html-parser'
import { ensureDir } from '../../directory.util'
import { writeSinglePage } from '../writePage.util'
import { setTimeout } from 'node:timers/promises'
import { type PageExtension } from '../../../types/mangaPage'

const chapterRegexList: RegExp[] = [/takecomic.jp\/episodes\/([a-zA-Z0-9]+)/]
const id = 'Takecomic'

const validateChapterUrl: ValidateChapterUrl<false> = (url) => {
  for (const chapterRegex of chapterRegexList) {
    const match = url.match(chapterRegex)
    if (match && match.length <= 2) {
      return {
        isValid: true,
        mangaId: undefined,
        chapterId: match[1] // The first (\d+) capture group
      }
    }
  }
  return {
    isValid: false,
    mangaId: null,
    chapterId: null
  }
}

const getChapterMetaData: GetChapterMetaDataFunction = async (url) => {
  const chapterUrlValidationResult = validateChapterUrl(url)
  if (chapterUrlValidationResult.isValid == false) {
    throw new InvalidChapterUrlError({
      url: url
    })
  }
  const { chapterId } = chapterUrlValidationResult
  // 1. Parse the raw HTML string into a queryable DOM object
  const chapterUrl = `https://takecomic.jp/episodes/${chapterId}`
  const result = await fetch(chapterUrl, {
    method: 'GET',
    body: null,
    headers: {
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'accept-language': 'en-US,en;q=0.9,ja;q=0.8,th;q=0.7,ar;q=0.6',
      'cache-control': 'no-cache',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })
  if (!result.ok) {
    console.error(`${chapterUrl} result.statusText: `, result.statusText)
    throw new ExtractionFailedError({
      plugin: id,
      reason: `HTTP fetch failed for ${chapterUrl} (${result.status})`
    })
  }
  const root = HTMLParser.parse(await result.text())
  // 2. Find the element using standard CSS selectors + Extract the exact attribute
  const viewerElement = root.querySelector('#comici-viewer')
  const comiciViewerId = viewerElement?.getAttribute('data-comici-viewer-id')
  if (comiciViewerId == undefined) {
    throw new ExtractionFailedError({ plugin: id, reason: 'missing #comici-viewer' })
  }
  // const titleElement = root.querySelector('[data-e2e="ehSeriesLink"]')
  const titleElement = root.querySelector('.ep-h-main-h-series')
  const title = titleElement?.textContent.trim()
  if (title == undefined) {
    throw new ExtractionFailedError({ plugin: id, reason: 'missing title element' })
  }
  // const chapterElement = root.querySelector('[data-e2e="ehEpisodeTtl"]')
  const chapterElement = root.querySelector('.ep-main-h-h')
  const chapterNumber = chapterElement?.textContent.trim()
  if (chapterNumber == undefined) {
    throw new ExtractionFailedError({ plugin: id, reason: 'missing chapter element' })
  }
  const headerElement = root.querySelector('#xHeader')
  const mangaId = headerElement?.getAttribute('data-series-hash')
  if (mangaId == undefined) {
    throw new ExtractionFailedError({ plugin: id, reason: 'missing mangaId element' })
  }

  // 3. Get page count
  // only need minimum of 2 pages to call this API
  const chapterMetaDataResponse = await fetch(
    `https://takecomic.jp/api/book/contentsInfo?user-id=&comici-viewer-id=${comiciViewerId}&page-from=0&page-to=1`,
    {
      method: 'GET'
    }
  )
  if (!chapterMetaDataResponse.ok) {
    console.error('result.statusText: ', chapterMetaDataResponse.statusText)
    throw new ExtractionFailedError({
      plugin: id,
      reason: `HTTP fetch failed (${chapterMetaDataResponse.status})`
    })
  }
  const chapterMetaData: ViewerResponse = await chapterMetaDataResponse.json()
  const { totalPages } = chapterMetaData
  const chapterName = undefined
  const savedData: SavedData = {
    chapterMetaData,
    comiciViewerId
  }

  return {
    chapterId,
    chapterNumber,
    chapterTitle: chapterName,
    chapterDisplayName: formatChapterDisplayName({
      chapterId,
      chapterNumber,
      chapterTitle: chapterName
    }),
    mangaTitle: title,
    mangaId: undefined,
    pageCount: totalPages,
    savedData
  }
}

const downloadChapter: DownloadChapterFunction = async (
  url,
  savePath,
  namingSchema,
  configData,
  chapterMetaData,
  taskProcess
) => {
  if (!chapterMetaData) {
    chapterMetaData = await getChapterMetaData(url, configData)
  }
  const { savedData, pageCount, chapterDisplayName, mangaTitle, mangaId } = chapterMetaData
  const { comiciViewerId } = savedData as SavedData
  const fullMetaResponse = await fetch(
    `https://takecomic.jp/api/book/contentsInfo?user-id=&comici-viewer-id=${comiciViewerId}&page-from=0&page-to=${pageCount}`,
    {
      method: 'GET'
    }
  )
  const fullMetaData: ViewerResponse = await fullMetaResponse.json()
  const fullDir = path.join(
    savePath,
    mangaTitle ?? mangaId ?? 'UnknownMangaTitle',
    chapterDisplayName
  )
  console.log(`[downloadChapter] Prepare writing file to ${fullDir} ...`)
  await ensureDir(fullDir)
  const panelDiscrambler = new PanelDescrambler({
    direction: 'column',
    reverse: true,
    DIVIDE_NUM: 4,
    MULTIPLE: 1
  })
  const pageLength = fullMetaData.totalPages
  for (let pageNumber = 1; pageNumber <= pageLength; pageNumber++) {
    if (taskProcess?.abortSignal.aborted) {
      throw new DownloadCancelledError()
    }
    const page = fullMetaData.result[pageNumber - 1]
    const pageImageResponse = await fetch(page.imageUrl, {
      headers: {
        accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9,ja;q=0.8,th;q=0.7,ar;q=0.6',
        'cache-control': 'no-cache',
        'sec-fetch-dest': 'image',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-site',
        Referer: 'https://takecomic.jp/'
      },
      method: 'GET'
    })
    if (!pageImageResponse.ok) {
      console.error(pageImageResponse.statusText)
      throw new ExtractionFailedError({
        plugin: id,
        reason: `HTTP fetch failed (${pageImageResponse.status})`
      })
    }
    panelDiscrambler.setScramblePattern(JSON.parse(page.scramble))
    const arrayBuffer = await pageImageResponse.arrayBuffer()
    const rawImageBuffer = Buffer.from(arrayBuffer)
    await panelDiscrambler.solve(rawImageBuffer)
    // const extension = detectPageExtension(rawImageBuffer, '.png')
    const extension: PageExtension = '.png'
    const solvedImageBuffer = await panelDiscrambler.getImageBufferAsync(extension)
    await writeSinglePage({
      extension: extension,
      fullDir: fullDir,
      namingSchema: namingSchema,
      pageData: solvedImageBuffer,
      pageNumber: pageNumber
    })

    taskProcess?.onProgress(pageNumber, pageLength)

    if (pageNumber !== pageLength) {
      const sleepTime = 0.25
      console.log(`[downloadChapter] ${pageNumber}/${pageLength} Sleeping ${sleepTime} seconds ...`)
      await setTimeout(sleepTime * 1000)
    }
  }
  return fullDir
}

const plugin: MangaPlugin = {
  id: id,
  uiConfigFields: [],
  chapterRegexList: chapterRegexList,
  validateChapterUrl: validateChapterUrl,
  getChapterMetaData: getChapterMetaData,
  downloadChapter: downloadChapter
}

export default plugin
