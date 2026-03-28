import { AESDecryptParams } from '../../../../types/common/decrypt'
import { ExtractionFailedError } from '../../../errors'
import { mangaCharacterRegex, stripProtobufArtifactsAndClean } from '../../japaneseChar.util'
import { MangaOneAuthenticationData } from '../configFields'
// import { writeFileSync } from 'node:fs'

/**
 * @param param0 - query for chapter
 * @param param1 - authentication data to access the chapter
 */
export async function mangaone_fetchAndExtractPageList(
  { title_id, chapter_id }: { title_id: string; chapter_id: string },
  { api_session, manga_one_session }: MangaOneAuthenticationData
): Promise<{
  urls: string[]
  decryptData: AESDecryptParams
  mangaName: string | undefined
  chapterName: string | undefined
  chapterNumber: string | undefined
}> {
  // You can change these headers to whatever. I just grab them from my browser.
  // If you get error fetching this endpoint, try opening mangaone in browser, look in DevTool and see the if there are any differences here and there.
  const result = await fetch(
    `https://manga-one.com/api/client?rq=viewer_v2&title_id=${title_id}&chapter_id=${chapter_id}&page=1&limit=10&sort_type=desc&list_type=chapter&free_point=0&event_point=0&paid_point=0`,
    {
      headers: {
        accept: '*/*',
        'accept-language': 'en-US,en;q=0.9,ja;q=0.8,th;q=0.7,ar;q=0.6',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        priority: 'u=1, i',
        'sec-ch-ua': '"Microsoft Edge";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        cookie: `${api_session ? `api_session=${api_session}; ` : ''}${manga_one_session ? `manga_one_session=${manga_one_session}; ` : ''}is_logged_in=true; is_app_connected=true;`,
        Referer: `https://manga-one.com/manga/${title_id}/chapter/${chapter_id}?type=chapter&sort_type=desc&page=1&limit=10`
      },
      body: null,
      method: 'POST'
    }
  )

  if (!result.ok) {
    console.log('result.statusText: ', result.statusText)
    throw new ExtractionFailedError({
      plugin: 'MangaOne',
      reason: `HTTP fetch failed (${result.status})`
    })
  }

  const buffer = await result.arrayBuffer()
  const decoder = new TextDecoder('utf-8')
  const rawText = decoder.decode(buffer)
  // Save the exact raw text to a file
  // writeFileSync(`manga_dump_${title_id}-${chapter_id}.txt`, rawText, 'utf8')
  // console.log('✅ Saved raw API response to manga_dump.txt')

  const dynamicRegex = new RegExp(
    `https:\\/\\/app\\.manga-one\\.com\\/[^"'\\s\\x00-\\x1F]*?\\/manga_page_low\\/${chapter_id}\\/[^"'\\s\\x00-\\x1F]*`,
    'g'
  )
  const urls = rawText.match(dynamicRegex) || []
  console.log(`Found ${urls.length} pages:`)
  // console.log(urls)

  const keyMatch = rawText.match(/[a-f0-9]{64}/)
  if (!keyMatch) {
    throw new ExtractionFailedError({ plugin: 'MangaOne', reason: 'Missing Encryption Key' })
  }
  const hexKey = keyMatch[0]

  const textWithoutKey = rawText.replace(hexKey, '')
  const ivMatch = textWithoutKey.match(/[a-f0-9]{32}/)
  if (!ivMatch) {
    throw new ExtractionFailedError({ plugin: 'MangaOne', reason: 'Missing IV' })
  }
  const hexIv = ivMatch[0]

  // ==========================================
  // Extract Manga Title
  // ==========================================
  // Find the block that IS exactly our IV
  const textMatchedBlocks = rawText.match(mangaCharacterRegex)
  if (!textMatchedBlocks) {
    throw new ExtractionFailedError({
      plugin: 'MangaOne',
      reason: 'Cannot parse Japanese text blocks'
    })
  }
  const textBlocks = textMatchedBlocks.map((block) => block.trim()).filter((block) => block !== '')
  // console.log(JSON.stringify(textBlocks))
  const ivBlockIndex = textBlocks.findIndex((block) => block === hexIv)
  let mangaTitle: string | undefined = undefined
  if (ivBlockIndex !== -1) {
    // The manga title is most likely the very next text block after the IV
    mangaTitle = stripProtobufArtifactsAndClean(textBlocks[ivBlockIndex + 1])
    console.log('📖 Manga Title:', mangaTitle)
  }

  // ==========================================
  // Extract Chapter Number & Title
  // ==========================================
  // Find the block that contains our specific chapter thumbnail URL
  const targetThumbUrl = `/chapter/${chapter_id}.webp`

  // Find the block containing the thumbnail URL
  const urlBlockIndex = textBlocks.findIndex((block) => block.includes(targetThumbUrl))
  let cleanTitle: string | undefined = undefined,
    cleanNumber: string | undefined = undefined
  if (urlBlockIndex !== -1) {
    let rawChapterNumber = textBlocks[urlBlockIndex - 2]
    let rawChapterTitle = textBlocks[urlBlockIndex - 1]

    // (Optional) Maybe I will remove it later
    cleanNumber = stripProtobufArtifactsAndClean(rawChapterNumber)
    cleanTitle = stripProtobufArtifactsAndClean(rawChapterTitle)

    console.log('🔖 Chapter Number:', cleanNumber, rawChapterNumber)
    console.log('📝 Chapter Title:', cleanTitle, rawChapterTitle)
  }

  return {
    urls,
    decryptData: { hexKey: hexKey, hexIv: hexIv },
    mangaName: mangaTitle,
    chapterName: cleanTitle,
    chapterNumber: cleanNumber
  }
}
