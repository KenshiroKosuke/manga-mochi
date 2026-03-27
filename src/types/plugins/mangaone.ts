export type MangaOneConfig = {
  /**
   * @comment Get this from cookies
   */
  api_session: string
  /**
   * @comment Get this from cookies
   */
  manga_one_session: string
}

export type MangaOneAuthenticationData = {
  api_session: string
  manga_one_session: string
  // home_popup_start_time: string | number
}

export type MangaOneChapterQuery = {
  title_id: string
  chapter_id: string
}
