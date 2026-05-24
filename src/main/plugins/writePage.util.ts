import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { PageExtension } from '../../types/mangaPage'
import { filetypeinfo } from 'magic-bytes.js'

/**
 * Detects the file extension from a Buffer using magic bytes.
 * Falls back to a default extension if unknown.
 */
export function detectPageExtension(
  buffer: Buffer,
  fallback: PageExtension = '.jpg'
): PageExtension {
  const guessedTypes = filetypeinfo(buffer)

  if (guessedTypes.length > 0) {
    const ext = guessedTypes[0].extension
    // console.log('[detectPageExtension] ext:', ext)

    // Map the library's output to your strict PageExtension type
    if (ext === 'jpeg' || ext === 'jpg') return '.jpg'
    if (ext === 'png') return '.png'
    if (ext === 'webp') return '.webp'
  }

  // Return fallback if it's an unrecognized format or missing magic numbers
  return fallback
}

/**
 * @returns - effective file name with extension
 */
export function calculateFileName({
  namingSchema,
  pageNumber,
  extension
}: {
  namingSchema: string
  pageNumber: number
  extension: PageExtension
}): string {
  // Logic to handle 'X' placeholder padding
  const xCount = (namingSchema.match(/X/g) || []).length
  const numStr = pageNumber.toString().padStart(xCount, '0')
  const fileName = namingSchema.replace(/X+/g, numStr) + extension
  return fileName
}

export async function writeSinglePage({
  namingSchema,
  fullDir,
  extension,
  pageNumber,
  pageData
}: {
  namingSchema: string
  fullDir: string
  extension: PageExtension
  pageNumber: number
  pageData: Parameters<typeof writeFile>[1]
}): Promise<void> {
  const fileName = calculateFileName({
    namingSchema: namingSchema,
    pageNumber: pageNumber,
    extension: extension
  })
  await writeFile(path.join(fullDir, fileName), pageData)
}

// export async function writeMultiplePages({
//   namingSchema,
//   fullDir,
//   extension
// }: {
//   namingSchema: string
//   fullDir: string
//   extension: PageExtension
// }) {
//   await mkdir(fullDir, { recursive: true })
//   // Mock: Generate 10 files based on naming schema (e.g., p00X -> p001.txt)
//   for (let i = 1; i <= 10; i++) {
//     const fileName = calculateFileName({ namingSchema, pageNumber: i, extension })
//     await writeFile(path.join(fullDir, fileName), `Content for ${fileName}`)
//   }
// }
