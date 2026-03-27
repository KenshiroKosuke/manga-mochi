import { MangaPlugin } from '../../../types/plugin'
import { mangaone_configFields } from './configFields'
import { mangaone_downloadChapter } from './downloader'
import { mangaone_chapterRegexList, mangaone_validateChapterUrl } from './urlValidator'

const plugin: MangaPlugin = {
  // name: 'MangaOne',
  id: 'MangaOne',
  configFields: mangaone_configFields,
  chapterRegexList: mangaone_chapterRegexList,
  validateChapterUrl: mangaone_validateChapterUrl,
  downloadChapter: mangaone_downloadChapter
}

export default plugin
