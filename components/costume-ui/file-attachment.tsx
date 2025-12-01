'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Download, Image as ImageIcon, File, ExternalLink, Loader2 } from 'lucide-react'
import { PhotoProvider, PhotoView } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'

type FileType = 'image' | 'pdf' | 'other'

type Props = {
  url: string
  fileName?: string
  className?: string
}

// Helper to get file extension
function getFileExtension(url: string): string {
  try {
    const path = new URL(url).pathname
    const ext = path.split('.').pop()?.toLowerCase() || ''
    return ext
  } catch {
    const ext = url.split('.').pop()?.toLowerCase() || ''
    return ext.split('?')[0] || ''
  }
}

// Helper to determine file type
function getFileType(extension: string): FileType {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']
  const pdfExtensions = ['pdf']

  if (imageExtensions.includes(extension)) return 'image'
  if (pdfExtensions.includes(extension)) return 'pdf'
  return 'other'
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// Helper to generate storage key
function getStorageKey(url: string): string {
  return `file_cache_${btoa(url).slice(0, 50)}`
}

// Helper to check if file is cached
function getCachedFile(url: string): string | null {
  try {
    const key = getStorageKey(url)
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

// Helper to cache file
function cacheFile(url: string, base64Data: string): void {
  try {
    const key = getStorageKey(url)
    localStorage.setItem(key, base64Data)
  } catch (e) {
    // LocalStorage might be full, ignore
    console.warn('Failed to cache file:', e)
  }
}

export default function FileAttachment({ url, fileName, className = '' }: Props) {
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [cachedDataUrl, setCachedDataUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const extension = getFileExtension(url)
  const fileType = getFileType(extension)
  const displayName = fileName || url.split('/').pop() || 'attachment'

  // Check cache on mount
  useEffect(() => {
    const cached = getCachedFile(url)
    if (cached) {
      setCachedDataUrl(cached)
    }
  }, [url])

  // Fetch file metadata (size)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`/api/files/metadata?url=${encodeURIComponent(url)}`)
        if (response.ok) {
          const data = await response.json()
          setFileSize(data.size)
        }
      } catch (e) {
        // Ignore metadata fetch errors
      }
    }

    if (!cachedDataUrl) {
      fetchMetadata()
    }
  }, [url, cachedDataUrl])

  // Download file with progress
  const handleDownload = useCallback(async () => {
    setIsLoading(true)
    setDownloadProgress(0)
    setError(null)

    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to download')

      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : 0

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const chunks: Uint8Array[] = []
      let received = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        chunks.push(value)
        received += value.length

        if (total > 0) {
          setDownloadProgress(Math.round((received / total) * 100))
        }
      }

      // Combine chunks
      const blob = new Blob(chunks as BlobPart[])
      const base64 = await blobToBase64(blob)

      // Cache the file
      cacheFile(url, base64)
      setCachedDataUrl(base64)
      setFileSize(blob.size)
    } catch (e: any) {
      setError(e.message || 'Download failed')
    } finally {
      setIsLoading(false)
      setDownloadProgress(0)
    }
  }, [url])

  // Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Open PDF in new tab
  const handleOpenPdf = () => {
    // Open original URL directly in new tab
    window.open(url, '_blank')
  }

  // Download to device (for 'other' file types)
  const handleSaveToDevice = () => {
    if (cachedDataUrl) {
      const link = document.createElement('a')
      link.href = cachedDataUrl
      link.download = displayName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Get file icon based on type
  const FileIcon = fileType === 'image' ? ImageIcon : fileType === 'pdf' ? FileText : File

  // Render cached/open button for images
  if (cachedDataUrl && fileType === 'image') {
    return (
      <div className={`flex items-center justify-between bg-(--background-secondary) border border-(--border-default) rounded-lg px-4 py-3 ${className}`}>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-md bg-white border border-(--border-default) flex items-center justify-center'>
            <ImageIcon size={16} className='text-blue-500' />
          </div>
          <div>
            <span className='texts-body-small-medium text-(--text-primary) block'>
              {displayName}
            </span>
            {fileSize && (
              <span className='texts-caption-large text-(--text-secondary)'>
                {formatFileSize(fileSize)}
              </span>
            )}
          </div>
        </div>
        <PhotoProvider>
          <PhotoView src={cachedDataUrl}>
            <button className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white texts-body-small-medium rounded-md hover:bg-blue-700 transition-colors'>
              <ExternalLink size={14} />
              Open
            </button>
          </PhotoView>
        </PhotoProvider>
      </div>
    )
  }

  // Render open button for PDFs (no download needed, opens directly in new tab)
  if (fileType === 'pdf') {
    return (
      <div className={`flex items-center justify-between bg-(--background-secondary) border border-(--border-default) rounded-lg px-4 py-3 ${className}`}>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-md bg-white border border-(--border-default) flex items-center justify-center'>
            <FileText size={16} className='text-red-500' />
          </div>
          <div>
            <span className='texts-body-small-medium text-(--text-primary) block'>
              {displayName}
            </span>
            {fileSize && (
              <span className='texts-caption-large text-(--text-secondary)'>
                {formatFileSize(fileSize)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleOpenPdf}
          className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white texts-body-small-medium rounded-md hover:bg-blue-700 transition-colors'
        >
          <ExternalLink size={14} />
          Open
        </button>
      </div>
    )
  }

  // Render cached/open button for other files
  if (cachedDataUrl && fileType === 'other') {
    return (
      <div className={`flex items-center justify-between bg-(--background-secondary) border border-(--border-default) rounded-lg px-4 py-3 ${className}`}>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-md bg-white border border-(--border-default) flex items-center justify-center'>
            <File size={16} className='text-(--text-secondary)' />
          </div>
          <div>
            <span className='texts-body-small-medium text-(--text-primary) block'>
              {displayName}
            </span>
            {fileSize && (
              <span className='texts-caption-large text-(--text-secondary)'>
                {formatFileSize(fileSize)}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleSaveToDevice}
          className='flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white texts-body-small-medium rounded-md hover:bg-blue-700 transition-colors'
        >
          <Download size={14} />
          Save
        </button>
      </div>
    )
  }

  // Render loading state with progress
  if (isLoading) {
    return (
      <div className={`flex items-center justify-between bg-(--background-secondary) border border-(--border-default) rounded-lg px-4 py-3 ${className}`}>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-md bg-white border border-(--border-default) flex items-center justify-center'>
            <FileIcon size={16} className='text-(--text-secondary)' />
          </div>
          <div>
            <span className='texts-body-small-medium text-(--text-primary) block'>
              {displayName}
            </span>
            <span className='texts-caption-large text-(--text-secondary)'>
              Downloading...
            </span>
          </div>
        </div>
        <div className='relative w-10 h-10'>
          <svg className='w-10 h-10 transform -rotate-90'>
            <circle
              cx='20'
              cy='20'
              r='16'
              fill='none'
              stroke='#e5e7eb'
              strokeWidth='3'
            />
            <circle
              cx='20'
              cy='20'
              r='16'
              fill='none'
              stroke='#3b82f6'
              strokeWidth='3'
              strokeLinecap='round'
              strokeDasharray={`${2 * Math.PI * 16}`}
              strokeDashoffset={`${2 * Math.PI * 16 * (1 - downloadProgress / 100)}`}
              className='transition-all duration-200'
            />
          </svg>
          <span className='absolute inset-0 flex items-center justify-center texts-caption-large text-(--text-primary) font-medium'>
            {downloadProgress}%
          </span>
        </div>
      </div>
    )
  }

  // Render download button (default state)
  return (
    <div className={`flex items-center justify-between bg-(--background-secondary) border border-(--border-default) rounded-lg px-4 py-3 hover:bg-neutral-100 transition-colors ${className}`}>
      <div className='flex items-center gap-3'>
        <div className='w-8 h-8 rounded-md bg-white border border-(--border-default) flex items-center justify-center'>
          <FileIcon size={16} className='text-(--text-secondary)' />
        </div>
        <div>
          <span className='texts-body-small-medium text-(--text-primary) block'>
            {displayName}
          </span>
          <span className='texts-caption-large text-(--text-secondary)'>
            {fileSize ? formatFileSize(fileSize) : 'Loading size...'}
          </span>
        </div>
      </div>
      <div className='flex items-center gap-3'>
        {error && (
          <span className='texts-caption-large text-red-500'>{error}</span>
        )}
        <button
          onClick={handleDownload}
          className='flex items-center gap-1.5 px-3 py-1.5 border border-(--border-default) text-(--text-primary) texts-body-small-medium rounded-md hover:bg-neutral-200 transition-colors'
        >
          <Download size={14} />
          Download
        </button>
      </div>
    </div>
  )
}
