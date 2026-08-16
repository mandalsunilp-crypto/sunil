import fs from 'fs'
import path from 'path'

/**
 * Save a Buffer or File to the public/uploads directory.
 * Returns the public URL path (e.g. /uploads/filename.ext).
 */
export async function saveUploadedFile(
  fileBuffer: Buffer,
  originalFilename: string,
  subfolder: string = 'general'
): Promise<string> {
  const ext = path.extname(originalFilename) || '.png'
  const sanitizedName = originalFilename
    .replace(ext, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30)

  const filename = `${subfolder}_${Date.now()}_${sanitizedName}${ext}`

  const publicDir = path.join(process.cwd(), 'public')
  const uploadDir = path.join(publicDir, 'uploads', subfolder)

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }

  const filePath = path.join(uploadDir, filename)
  fs.writeFileSync(filePath, fileBuffer)

  return `/uploads/${subfolder}/${filename}`
}

/**
 * Convert a base64 Data URL to a saved image in public/uploads.
 * Returns the public URL path or the original string if not base64.
 */
export function saveBase64Image(dataUrl: string, subfolder: string = 'avatars'): string {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return dataUrl
  }

  try {
    const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/)
    if (!matches || matches.length < 3) {
      return dataUrl
    }

    const ext = matches[1] === 'jpeg' ? '.jpg' : `.${matches[1]}`
    const base64Data = matches[2]
    const buffer = Buffer.from(base64Data, 'base64')

    const filename = `${subfolder}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`

    const publicDir = path.join(process.cwd(), 'public')
    const uploadDir = path.join(publicDir, 'uploads', subfolder)

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const filePath = path.join(uploadDir, filename)
    fs.writeFileSync(filePath, buffer)

    return `/uploads/${subfolder}/${filename}`
  } catch (err) {
    console.error('Failed to save base64 image:', err)
    return ''
  }
}
