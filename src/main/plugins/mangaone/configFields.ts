import * as v from 'valibot'
import { buildConfigArray } from '../pluginConfig.util'

export const MangaOneConfigSchema = v.object({
  api_session: v.optional(v.string()),
  manga_one_session: v.optional(v.string())
})

export type MangaOneConfig = v.InferInput<typeof MangaOneConfigSchema>

export type MangaOneAuthenticationData = Pick<MangaOneConfig, 'api_session' | 'manga_one_session'>

export const mangaone_configFields = buildConfigArray<MangaOneConfig>({
  api_session: {
    isSensitive: true,
    description: 'Get this from cookies'
  },
  manga_one_session: {
    isSensitive: true,
    description: 'Get this from cookies'
  }
})
