import { NextRequest, NextResponse } from 'next/server'
import { saveUploadedFile } from '@/lib/storage/fileStorage'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const subfolder = (formData.get('subfolder') as string) || 'uploads'

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await saveUploadedFile(buffer, file.name, subfolder)

    return NextResponse.json({
      success: true,
      url,
      message: 'File uploaded successfully.',
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Upload failed.' },
      { status: 500 }
    )
  }
}
