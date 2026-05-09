import { AESDecryptParams } from '../../../../types/common/decrypt'
import { ExtractionFailedError } from '../../../errors'
import { MangaOneAuthenticationData } from '../configFields'
// import { writeFileSync } from 'node:fs'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const RawProto = require('rawproto').default || require('rawproto')

const PROTO_MAP = {
  chapter_page_list: '1.1.1:string',
  hex_key: '3:string',
  hex_iv: '4:string',
  manga_id: '5.1.1:string',
  manga_name: '5.1.2:string',
  manga_description: '5.1.4:string',
  manga_author_raw: '5.1.5:string',
  chapter_id: '7.1:string',
  chapter_number: '7.2:string',
  chapter_title: '7.3:string'
} as const

export type MangaoneFetchAndExtractPageListResponse = {
  urls: string[]
  decryptData: AESDecryptParams
  mangaName: string | undefined
  chapterName: string | undefined
  chapterNumber: string | undefined
}

/**
 * @param param0 - query for chapter
 * @param param1 - authentication data to access the chapter
 */
export async function mangaone_fetchAndExtractPageList(
  { title_id, chapter_id }: { title_id: string; chapter_id: string },
  authData: MangaOneAuthenticationData
): Promise<MangaoneFetchAndExtractPageListResponse> {
  const buffer = new Uint8Array(await getRawResponse({ title_id, chapter_id }, authData))
  const proto = new RawProto(buffer)
  const hexKey: string | undefined = proto.query(PROTO_MAP.hex_key)[0]
  if (!hexKey || !hexKey.match(/[a-f0-9]{64}/)) {
    throw new ExtractionFailedError({ plugin: 'MangaOne', reason: 'Missing Encryption Key' })
  }
  const hexIv: string | undefined = proto.query(PROTO_MAP.hex_iv)[0]
  if (!hexIv || !hexIv.match(/[a-f0-9]{32}/)) {
    throw new ExtractionFailedError({ plugin: 'MangaOne', reason: 'Missing IV' })
  }
  const urls: string[] = proto.query(PROTO_MAP.chapter_page_list) ?? []
  const pageRegex = new RegExp(
    `https:\\/\\/app\\.manga-one\\.com\\/[^"'\\s\\x00-\\x1F]*?\\/manga_page_low\\/${chapter_id}\\/[^"'\\s\\x00-\\x1F]*`,
    'g'
  )
  if (urls.some((url) => !url.match(pageRegex))) {
    throw new ExtractionFailedError({ plugin: 'MangaOne', reason: 'Invalid Page List' })
  }
  console.log(`Found ${urls.length} pages:`)
  const mangaId: string | undefined = proto.query(PROTO_MAP.manga_id)[0]
  if (mangaId !== title_id) {
    throw new ExtractionFailedError({
      plugin: 'MangaOne',
      reason: `Mismatched Manga ID: expect (${title_id}), receive (${mangaId})`
    })
  }
  const chapterId: string | undefined = proto.query(PROTO_MAP.chapter_id)[0]
  if (chapterId !== chapter_id) {
    throw new ExtractionFailedError({
      plugin: 'MangaOne',
      reason: `Mismatched Chapter ID: expect (${chapter_id}), receive (${chapterId})`
    })
  }
  // console.log(proto.query("7:string"));
  const mangaTitle: string | undefined = proto.query(PROTO_MAP.manga_name)[0]
  const chapterNumber: string | undefined = proto.query(PROTO_MAP.chapter_number)[0]
  const chapterTitle: string | undefined = proto.query(PROTO_MAP.chapter_title)[0]

  const result = {
    urls,
    decryptData: { hexKey: hexKey, hexIv: hexIv },
    mangaName: mangaTitle,
    chapterName: chapterTitle,
    chapterNumber: chapterNumber
  }
  console.log(result)
  return result
}

async function getRawResponse(
  { title_id, chapter_id }: { title_id: string; chapter_id: string },
  { api_session, manga_one_session }: MangaOneAuthenticationData
): Promise<ArrayBuffer> {
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
  // const decoder = new TextDecoder('utf-8')
  // return decoder.decode(buffer)
  return buffer
}
