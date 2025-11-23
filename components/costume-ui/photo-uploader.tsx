'use client'

import { useState, useEffect } from 'react'
import PhotoEditorModal from './photo-editor'
import { Upload } from 'lucide-react'

type Props = {
description: string
  loading?: boolean
  onSave: (blob: Blob) => void
  size?: number
}

export default function PhotoUploader({
  description,
  loading = false,
  onSave,
  size = 100
}: Props) {
  const [profileImage, setProfileImage] = useState<Blob | null>(null)
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false)

  const handlePhotoSave = (blob: Blob) => {
    setProfileImage(blob)
    const url = URL.createObjectURL(blob)
    setProfileImageUrl(url)
    onSave(blob)
    setIsPhotoEditorOpen(false)
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
        {profileImageUrl ? (
          <>
            <img
              src={profileImageUrl}
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