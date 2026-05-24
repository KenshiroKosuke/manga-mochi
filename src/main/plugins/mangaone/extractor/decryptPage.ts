import { AESDecryptParams } from '../../../../types/common/decrypt'
import crypto from 'crypto'

export async function mangaone_fetchAndDecryptPage(
  url: string,
  decryptData: AESDecryptParams
): Promise<Buffer<ArrayBuffer>> {
  // 1. Fetch
  // NOTE 2025-12-17 : cookie is not needed
  const response = await fetch(url)
  if (!response.ok) {
    console.error(response.statusText)
    throw new Error(`Fetch failed: ${response.status}`)
  }

  // 2. Get encrypted bytes
  const encryptedBuffer = await response.arrayBuffer()

  // 3. Prepare Key and IV buffers
  const key = Buffer.from(decryptData.hexKey, 'hex')
  const iv = Buffer.from(decryptData.hexIv, 'hex')

  // 4. Create Decipher
  // Algorithm is likely 'aes-256-cbc'.
  // If this fails, the other common option is 'aes-256-ctr'.
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
  return Buffer.concat([decipher.update(Buffer.from(encryptedBuffer)), decipher.final()])
}
