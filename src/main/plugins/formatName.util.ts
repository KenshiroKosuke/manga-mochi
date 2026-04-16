import { ChapterMetaData } from '../../types/plugin'

export function formatChapterDisplayName({
  chapterName,
  chapterNumber,
  chapterId
}: Pick<ChapterMetaData, 'chapterName' | 'chapterId' | 'chapterNumber'>): string {
  return chapterNumber || chapterName
    ? ((chapterNumber ?? '') + ' ' + (chapterName ?? '')).trim()
    : chapterId
}
