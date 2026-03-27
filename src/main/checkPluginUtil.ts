import { ConfigField } from '../types/plugin'
import { InvalidConfigError } from './errors'

export function validateConfigFields<T extends Record<string, string>>(
  config: unknown,
  configFields: ConfigField[]
): asserts config is T {
  // If no config object exists at all
  if (!config) {
    throw new InvalidConfigError({
      configs: configFields.map((f) => ({
        name: f.fieldName,
        value: undefined,
        error: 'Missing config entirely.'
      }))
    })
  }

  const errors: { name: string; value: any; error: any }[] = []
  for (const field of configFields) {
    const value = config[field.fieldName]
    if (!value || typeof value !== 'string' || value.trim() === '') {
      errors.push({
        name: field.fieldName,
        value: value || null,
        error: 'This field is required and cannot be empty.'
      })
    }
  }
  if (errors.length > 0) {
    throw new InvalidConfigError({ configs: errors })
  }
}
