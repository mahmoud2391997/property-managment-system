'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PhotoProvider, PhotoView } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'
import { Skeleton } from '@/components/ui/skeleton'

type ImageItem = {
  id: string
  image_url: string
  thumb_url: string
}

type HeaderImageProps = {
  images?: ImageItem[]
  isLoading?: boolean
  alt?: string
  size?: number
}

export default function HeaderImage({
  images = [],
  isLoading = false,
  alt = 'Image',
  size = 48
}: HeaderImageProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (isLoading) {
    return <Skeleton className={`w-12 h-12 rounded-full bg-neutral-300`} />
  }

  const hasImages = images.length > 0
  const firstImage = hasImages ? images[0] : null

  // If no images, show placeholder
  if (!hasImages) {
    return (
      <span
        className='rounded-full overflow-hidden flex-shrink-0'
        style={{ width: size, height: size }}
      >
        <Image
          src='/images/property-image-placeholder.png'
          height={size}
          width={size}
          alt={alt}
        />
      </span>
    )
  }

  // If has images, show clickable thumbnail with lightbox
  return (
    <PhotoProvider
      toolbarRender={({ index }) => (
        <span className='text-white text-sm'>
          {index + 1} / {images.length}
        </span>
      )}
      onIndexChange={setCurrentIndex}
    >
      <div className='flex'>
        {/* Only render the first image as the visible trigger */}
        <PhotoView src={firstImage!.image_url}>
          <button
            type='button'
            className='rounded-full overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            style={{ width: size, height: size }}
          >
            <img
              src={firstImage!.thumb_url}
              alt={alt}
              className='w-full h-full object-cover'
            />
          </button>
        </PhotoView>

        {/* Hidden elements for other images in the gallery */}
        {images.slice(1).map((image) => (
          <PhotoView key={image.id} src={image.image_url}>
            <span className='hidden' />
          </PhotoView>
        ))}
      </div>
    </PhotoProvider>
  )
}
