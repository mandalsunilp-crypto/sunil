'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Upload, X, Image as ImageIcon, CheckCircle2, Loader2 } from 'lucide-react'

interface ImageUploaderProps {
  label?: string
  value?: string
  onChange: (value: string) => void
  helperText?: string
  required?: boolean
  subfolder?: string
  className?: string
}

export function ImageUploader({
  label = 'Upload Photo from Device',
  value,
  onChange,
  helperText = 'Select any JPG, PNG, or WebP photo from your computer or phone',
  required = false,
  subfolder = 'uploads',
  className = '',
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string>(value || '')
  const [fileName, setFileName] = useState<string>('')
  const [fileSize, setFileSize] = useState<string>('')
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreview(value || '')
  }, [value])

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setFileSize((file.size / 1024).toFixed(1) + ' KB')
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('subfolder', subfolder)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      if (data.success && data.url) {
        setPreview(data.url)
        onChange(data.url)
      } else {
        // Fallback to local DataURL if server upload fails
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          if (base64) {
            setPreview(base64)
            onChange(base64)
          }
        }
        reader.readAsDataURL(file)
      }
    } catch {
      // Fallback to local DataURL
      const reader = new FileReader()
      reader.onload = (event) => {
        const base64 = event.target?.result as string
        if (base64) {
          setPreview(base64)
          onChange(base64)
        }
      }
      reader.readAsDataURL(file)
    } finally {
      setIsUploading(false)
    }
  }

  function handleRemove() {
    setPreview('')
    setFileName('')
    setFileSize('')
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-2 text-left ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-neutral-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
      )}

      {/* Preview Box */}
      {preview ? (
        <div className="relative rounded-2xl border border-purple-500/40 bg-purple-950/20 p-3 flex items-center gap-3 group">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 flex-shrink-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Uploaded" className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 min-w-0 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Photo Uploaded Ready</span>
            </div>
            <p className="text-[11px] text-neutral-300 truncate font-mono">
              {fileName || 'Custom Selected Photo'}
            </p>
            {fileSize && <span className="text-[10px] text-neutral-500">{fileSize}</span>}
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="p-2 rounded-xl bg-neutral-900/80 hover:bg-red-950 text-neutral-400 hover:text-red-400 border border-neutral-800 transition-colors"
            title="Remove Photo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Upload Trigger Area */
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className="border-2 border-dashed border-neutral-800 hover:border-purple-500/60 rounded-2xl p-4 text-center cursor-pointer bg-neutral-900/40 hover:bg-neutral-900/80 transition-all group space-y-2"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-600/15 text-purple-400 group-hover:scale-110 flex items-center justify-center mx-auto transition-transform">
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-purple-400" /> : <Upload className="w-5 h-5" />}
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">
              {isUploading ? 'Uploading and optimizing photo...' : 'Click to choose photo from local device'}
            </p>
            <p className="text-[10px] text-neutral-500">{helperText}</p>
          </div>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}
