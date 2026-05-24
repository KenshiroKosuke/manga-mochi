import { ChapterMetaData } from '../../types/plugin'

export function formatChapterDisplayName({
  chapterTitle,
  chapterNumber,
  chapterId
}: Pick<ChapterMetaData, 'chapterTitle' | 'chapterId' | 'chapterNumber'>): string {
  return chapterNumber || chapterTitle
    ? ((chapterNumber ?? '') + ' ' + (chapterTitle ?? '')).trim()
    : (chapterId ?? 'unknown_chapter_' + Date.now())
}
