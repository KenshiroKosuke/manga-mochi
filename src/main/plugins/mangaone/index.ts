import { MangaPlugin } from '../../../types/plugin'
import { mangaone_configFields } from './configFields'
import { mangaone_downloadChapter, mangaone_getChapterMetaData } from './downloader'
import { mangaone_chapterRegexList, mangaone_validateChapterUrl } from './urlValidator'

const plugin: MangaPlugin = {
  // name: 'MangaOne',
  id: 'MangaOne',
  uiConfigFields: mangaone_configFields,
  chapterRegexList: mangaone_chapterRegexList,
  validateChapterUrl: mangaone_validateChapterUrl,
  downloadChapter: mangaone_downloadChapter,
  getChapterMetaData: mangaone_getChapterMetaData
}

export default plugin
