'use client'

import { useState } from 'react'
import PhotoEditorModal from '@/components/costume-ui/photo-editor'
import Button from '@/components/costume-ui/button'
import { Upload } from 'lucide-react'

interface ImageStats {
  blob: Blob
  url: string
  width: number
  height: number
  size: number
}

export default function TestingPage() {
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false)
  const [originalImage, setOriginalImage] = useState<ImageStats | null>(null)
  const [mainPicture, setMainPicture] = useState<ImageStats | null>(null)
  const [thumbnail, setThumbnail] = useState<ImageStats | null>(null)

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

        ctx.save()
        const radius = THUMB_SIZE / 2
        ctx.beginPath()
        ctx.arc(radius, radius, radius, 0, 2 * Math.PI)
        ctx.clip()

        ctx.drawImage(img, 0, 0, THUMB_SIZE, THUMB_SIZE)
        ctx.restore()

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

  const getImageDimensions = (blob: Blob): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height })
        URL.revokeObjectURL(img.src)
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(blob)
    })
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const dimensions = await getImageDimensions(file)
      setOriginalImage({
        blob: file,
        url: URL.createObjectURL(file),
        width: dimensions.width,
        height: dimensions.height,
        size: file.size
      })
      setIsPhotoEditorOpen(true)
    } catch (error) {
      console.error('Error loading original image:', error)
    }
  }

  const handlePhotoSave = async (blob: Blob) => {
    try {
      const mainDimensions = await getImageDimensions(blob)
      setMainPicture({
        blob,
        url: URL.createObjectURL(blob),
        width: mainDimensions.width,
        height: mainDimensions.height,
        size: blob.size
      })

      const thumbBlob = await generateThumbnail(blob)
      const thumbDimensions = await getImageDimensions(thumbBlob)
      setThumbnail({
        blob: thumbBlob,
        url: URL.createObjectURL(thumbBlob),
        width: thumbDimensions.width,
        height: thumbDimensions.height,
        size: thumbBlob.size
      })
    } catch (error) {
      console.error('Error processing images:', error)
    }
  }

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const calculateCompression = (original: number, compressed: number): string => {
    const ratio = ((original - compressed) / original) * 100
    return `${ratio.toFixed(1)}%`
  }

  return (
    <div className='min-h-screen bg-(--background-secondary) p-8'>
      <div className='max-w-6xl mx-auto'>
        <div className='bg-(--background-primary) rounded-lg p-8 shadows-sm'>
          <h1 className='texts-heading-h1 text-(--text-primary) mb-2'>
            Photo Editor Testing
          </h1>
          <p className='texts-body-medium text-(--text-secondary) mb-8'>
            Upload different images to test the photo editor output quality and compression
          </p>

          <div className='mb-8'>
            <input
              type='file'
              accept='image/*'
              onChange={handleFileSelect}
              className='hidden'
              id='test-file-input'
            />
            <label htmlFor='test-file-input'>
              <Button
                type='button'
                variant='primary'
                label='Upload Test Image'
                icon={<Upload className='h-4 w-4' />}
                onClick={() => document.getElementById('test-file-input')?.click()}
                className='cursor-pointer'
              />
            </label>
          </div>

          {originalImage && (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <div className='bg-(--background-secondary) rounded-lg p-6'>
                <h3 className='texts-heading-h3 text-(--text-primary) mb-4'>
                  Original Image
                </h3>
                <div className='mb-4'>
                  <img
                    src={originalImage.url}
                    alt='Original'
                    className='w-full h-auto rounded-lg border-2 border-(--border-default)'
                  />
                </div>
                <div className='space-y-2 texts-body-small text-(--text-secondary)'>
                  <div className='flex justify-between'>
                    <span>Dimensions:</span>
                    <span className='font-medium text-(--text-primary)'>
                      {originalImage.width} x {originalImage.height}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>File Size:</span>
                    <span className='font-medium text-(--text-primary)'>
                      {formatSize(originalImage.size)}
                    </span>
                  </div>
                </div>
              </div>

              {mainPicture && (
                <div className='bg-(--background-secondary) rounded-lg p-6'>
                  <h3 className='texts-heading-h3 text-(--text-primary) mb-4'>
                    Main Picture (WhatsApp Standard)
                  </h3>
                  <div className='mb-4'>
                    <img
                      src={mainPicture.url}
                      alt='Main'
                      className='w-full h-auto rounded-full border-2 border-(--border-default)'
                    />
                  </div>
                  <div className='space-y-2 texts-body-small text-(--text-secondary)'>
                    <div className='flex justify-between'>
                      <span>Dimensions:</span>
                      <span className='font-medium text-(--text-primary)'>
                        {mainPicture.width} x {mainPicture.height}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>File Size:</span>
                      <span className='font-medium text-(--text-primary)'>
                        {formatSize(mainPicture.size)}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Quality:</span>
                      <span className='font-medium text-(--text-primary)'>90% JPEG</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Compression:</span>
                      <span className='font-medium text-(--success-main)'>
                        {calculateCompression(originalImage.size, mainPicture.size)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {thumbnail && (
                <div className='bg-(--background-secondary) rounded-lg p-6'>
                  <h3 className='texts-heading-h3 text-(--text-primary) mb-4'>
                    Thumbnail
                  </h3>
                  <div className='mb-4 flex justify-center'>
                    <img
                      src={thumbnail.url}
                      alt='Thumbnail'
                      className='w-[100px] h-[100px] rounded-full border-2 border-(--border-default)'
                    />
                  </div>
                  <div className='space-y-2 texts-body-small text-(--text-secondary)'>
                    <div className='flex justify-between'>
                      <span>Dimensions:</span>
                      <span className='font-medium text-(--text-primary)'>
                        {thumbnail.width} x {thumbnail.height}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>File Size:</span>
                      <span className='font-medium text-(--text-primary)'>
                        {formatSize(thumbnail.size)}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Quality:</span>
                      <span className='font-medium text-(--text-primary)'>80% JPEG</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Compression:</span>
                      <span className='font-medium text-(--success-main)'>
                        {calculateCompression(originalImage.size, thumbnail.size)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {originalImage && mainPicture && thumbnail && (
            <div className='mt-8 bg-(--success-light) rounded-lg p-6'>
              <h3 className='texts-heading-h3 text-(--text-primary) mb-4'>
                Summary
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 texts-body-medium'>
                <div>
                  <span className='text-(--text-secondary)'>Original Size:</span>
                  <span className='ml-2 font-medium text-(--text-primary)'>
                    {formatSize(originalImage.size)}
                  </span>
                </div>
                <div>
                  <span className='text-(--text-secondary)'>Total Processed Size:</span>
                  <span className='ml-2 font-medium text-(--text-primary)'>
                    {formatSize(mainPicture.size + thumbnail.size)}
                  </span>
                </div>
                <div>
                  <span className='text-(--text-secondary)'>Total Compression:</span>
                  <span className='ml-2 font-medium text-(--success-main)'>
                    {calculateCompression(
                      originalImage.size,
                      mainPicture.size + thumbnail.size
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <PhotoEditorModal
        isOpen={isPhotoEditorOpen}
        onClose={() => setIsPhotoEditorOpen(false)}
        onSave={handlePhotoSave}
      />
    </div>
  )
}
