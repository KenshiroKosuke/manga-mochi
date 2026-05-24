import * as v from 'valibot'
import { UIConfigField } from '../../types/plugin'
import { InvalidConfigError } from '../errors'

/**
 * Transforms an exhaustive UI object map into the array required by the frontend.
 */
export function buildConfigArray<T extends Record<string, unknown>>(uiMap: {
  [K in keyof T]: Omit<UIConfigField, 'fieldName'>
}): UIConfigField[] {
  return Object.entries(uiMap).map(([key, value]) => ({
    fieldName: key,
    ...(value as Omit<UIConfigField, 'fieldName'>)
  }))
}

/**
 * Validates data against a Valibot schema and throws a formatted IPC error if invalid.
 */
export function validateConfigSchema<
  T extends v.BaseSchema<unknown, unknown, v.BaseIssue<unknown>>
>(configData: unknown, schema: T): asserts configData is v.InferInput<T> {
  if (!configData || typeof configData !== 'object') {
    throw new InvalidConfigError({
      configs: [{ name: 'config', value: null, error: 'Missing config object entirely.' }]
    })
  }

  // Parse the data using Valibot
  const result = v.safeParse(schema, configData)

  if (!result.success) {
    // Map Valibot's precise issues into your frontend's expected format
    const errors = result.issues.map((issue) => {
      // Find the name of the field that failed (e.g., 'api_session')
      const fieldName = (issue.path?.[0]?.key as string) || 'unknown_field'

      return {
        name: fieldName,
        value: issue.input,
        error: issue.message
      }
    })

    throw new InvalidConfigError({ configs: errors })
  }
}
