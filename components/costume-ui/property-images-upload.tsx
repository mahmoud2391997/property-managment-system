'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { compressImage, validateImageFile, revokePreviewUrl } from '@/lib/image-compression'
import InnerSection from './collapsible-inner-section'

export type ImageData = {
  id?: string
  image_url: string
  thumb_url: string
  file?: File
  isNew?: boolean
  isUploading?: boolean
}

type PropertyImagesUploadProps = {
  type: 'property' | 'room'
  images: ImageData[]
  onImagesChange: (images: ImageData[]) => void
  maxImages?: number
  disabled?: boolean
}

const MAX_FILE_SIZE_MB = 2

export default function PropertyImagesUpload({
  type,
  images,
  onImagesChange,
  maxImages,
  disabled = false
}: PropertyImagesUploadProps) {
  const max = maxImages ?? (type === 'property' ? 3 : 2)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingCount, setProcessingCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    setError(null)
    const fileArray = Array.from(files)
    const availableSlots = max - images.length

    if (availableSlots <= 0) {
      setError(`Maximum ${max} images allowed`)
      return
    }

    const filesToProcess = fileArray.slice(0, availableSlots)
    setProcessingCount(filesToProcess.length)

    const newImages: ImageData[] = []

    for (const file of filesToProcess) {
      const validation = validateImageFile(file, MAX_FILE_SIZE_MB)
      if (!validation.valid) {
        setError(validation.error || 'Invalid file')
        continue
      }

      try {
        const { mainBlob, thumbBlob } = await compressImage(file)

        const mainUrl = URL.createObjectURL(mainBlob)
        const thumbUrl = URL.createObjectURL(thumbBlob)

        newImages.push({
          image_url: mainUrl,
          thumb_url: thumbUrl,
          file: new File([mainBlob], file.name, { type: 'image/jpeg' }),
          isNew: true
        })
      } catch (err) {
        console.error('Error compressing image:', err)
        setError('Failed to process image')
      }
    }

    setProcessingCount(0)

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages])
    }
  }, [images, max, onImagesChange])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (disabled) return
    handleFiles(e.dataTransfer.files)
  }, [disabled, handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragOver(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])

  const handleRemove = useCallback((index: number) => {
    const imageToRemove = images[index]

    // Revoke blob URLs if they're local
    if (imageToRemove.isNew) {
      revokePreviewUrl(imageToRemove.image_url)
      revokePreviewUrl(imageToRemove.thumb_url)
    }

    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }, [images, onImagesChange])

  const canAddMore = images.length < max && !disabled

  return (
    <InnerSection
      title='Images'
      subtitle={`Add up to ${max} images for this ${type}`}
    >
      <div className='space-y-3'>
        {/* Image Grid */}
        <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
          {/* Existing Images */}
          {images.map((image, index) => (
            <div
              key={image.id || index}
              className='relative aspect-[4/3] rounded-lg overflow-hidden bg-neutral-100 group'
            >
              <img
                src={image.thumb_url || image.image_url}
                alt={`${type} image ${index + 1}`}
                className='w-full h-full object-cover'
              />

              {/* Loading overlay */}
              {image.isUploading && (
                <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
                  <Loader2 className='w-6 h-6 text-white animate-spin' />
                </div>
              )}

              {/* Remove button */}
              {!disabled && !image.isUploading && (
                <button
                  type='button'
                  onClick={() => handleRemove(index)}
                  className={cn(
                    'absolute top-2 right-2',
                    'w-7 h-7 rounded-full',
                    'bg-black/60 hover:bg-black/80',
                    'flex items-center justify-center',
                    'opacity-0 group-hover:opacity-100',
                    'transition-opacity'
                  )}
                >
                  <X className='w-4 h-4 text-white' />
                </button>
              )}

              {/* Image number badge */}
              <div className='absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs font-medium'>
                {index + 1}/{max}
              </div>
            </div>
          ))}

          {/* Add Image Button / Drop Zone */}
          {canAddMore && (
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              disabled={processingCount > 0}
              className={cn(
                'aspect-[4/3] rounded-lg',
                'border-2 border-dashed',
                'flex flex-col items-center justify-center gap-2',
                'transition-all cursor-pointer',
                isDragOver
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50',
                processingCount > 0 && 'opacity-50 cursor-wait'
              )}
            >
              {processingCount > 0 ? (
                <>
                  <Loader2 className='w-8 h-8 text-neutral-400 animate-spin' />
                  <span className='text-xs text-neutral-500'>Processing...</span>
                </>
              ) : (
                <>
                  <div className='w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center'>
                    <Upload className='w-5 h-5 text-neutral-500' />
                  </div>
                  <span className='text-xs text-neutral-500 text-center px-2'>
                    {isDragOver ? 'Drop here' : 'Add image'}
                  </span>
                </>
              )}
            </button>
          )}

          {/* Empty state placeholders */}
          {images.length === 0 && !canAddMore && (
            <div className='aspect-[4/3] rounded-lg bg-neutral-100 flex items-center justify-center'>
              <ImageIcon className='w-8 h-8 text-neutral-300' />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className='text-sm text-red-600'>{error}</p>
        )}

        {/* Helper text */}
        <p className='text-xs text-neutral-500'>
          Max {MAX_FILE_SIZE_MB}MB per image. Images will be automatically compressed.
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        multiple
        onChange={handleFileSelect}
        className='hidden'
      />
    </InnerSection>
  )
}
