'use client'

import { useState, useEffect } from 'react'
import PhotoEditorModal from './photo-editor'
import { Upload } from 'lucide-react'

type Props = {
  description: string
  loading?: boolean
  onSave: (mainBlob: Blob, thumbBlob: Blob) => void
  size?: number
  existingImageUrl?: string | null
}

export default function PhotoUploader({
  description,
  loading = false,
  onSave,
  size = 100,
  existingImageUrl
}: Props) {
  const [profileImage, setProfileImage] = useState<Blob | null>(null)
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false)

  // Display existing image if provided and no new image uploaded
  const displayUrl = profileImageUrl || existingImageUrl

  const generateThumbnail = async (mainBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        const THUMB_SIZE = 100
        canvas.width = THUMB_SIZE
        canvas.height = THUMB_SIZE

        // Draw square thumbnail - let CSS handle the circular display
        ctx.drawImage(img, 0, 0, THUMB_SIZE, THUMB_SIZE)

        canvas.toBlob(
          blob => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to create thumbnail blob'))
            }
          },
          'image/jpeg',
          0.8
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(mainBlob)
    })
  }

  const handlePhotoSave = async (blob: Blob) => {
    try {
      setProfileImage(blob)
      const url = URL.createObjectURL(blob)
      setProfileImageUrl(url)

      const thumbBlob = await generateThumbnail(blob)
      onSave(blob, thumbBlob)
      setIsPhotoEditorOpen(false)
    } catch (error) {
      console.error('Error generating thumbnail:', error)
    }
  }

  // Cleanup URL object when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (profileImageUrl) URL.revokeObjectURL(profileImageUrl)
    }
  }, [profileImageUrl])

  return (
    <div className='flex items-center gap-4'>
      <button
        type='button'
        onClick={() => setIsPhotoEditorOpen(true)}
        disabled={loading}
        style={{ width: size, height: size }}
        className='relative rounded-full overflow-hidden border-2 border-dashed border-(--border-strong) group hover:border-(--primary-color) transition-colors disabled:opacity-50'
      >
        {displayUrl ? (
          <>
            <img
              src={displayUrl}
              alt='Profile preview'
              className='w-full h-full object-cover'
            />
            <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
              <Upload className='text-white' size={size / 3} />
            </div>
          </>
        ) : (
          <div className='w-full h-full bg-(--background-secondary) group-hover:bg-(--background-tertiary) transition-colors flex items-center justify-center'>
            <Upload className='text-(--text-muted) group-hover:text-(--primary-color) transition-colors' size={size / 3} />
          </div>
        )}
      </button>
      
      <div className='flex-1'>
        <p className='texts-body-small text-(--text-secondary)'>
          {description}
        </p>
      </div>

      <PhotoEditorModal
        isOpen={isPhotoEditorOpen}
        onClose={() => setIsPhotoEditorOpen(false)}
        onSave={handlePhotoSave}
      />
    </div>
  )
}