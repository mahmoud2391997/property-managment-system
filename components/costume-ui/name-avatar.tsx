'use client'

import Image from 'next/image'
import React, { useState } from 'react'

type UserAvatarProps = {
  name: string
  imgSrc?: string | null
  size?: number // width & height
  className?: string
}

// A simple palette of 5 colors
const COLORS = ['#3B82F6', '#22C55E', '#FACC15', '#A855F7', '#EC4899']

// Get a consistent color based on the tenant name
function getColorFromName (name: string) {
  const charSum = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return COLORS[charSum % COLORS.length]
}

// Get initials from a full name
function getInitials (name: string) {
  const parts = name.split(' ').filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  imgSrc,
  size = 40,
  className = ''
}) => {
  const [imgError, setImgError] = useState(false)
  const bgColor = getColorFromName(name)
  const initials = getInitials(name)

  const showImage = imgSrc && !imgError

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full text-white font-semibold overflow-hidden shadow-sm ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        backgroundColor: showImage ? undefined : bgColor
      }}
    >
      {showImage ? (
        <Image
          src={imgSrc}
          alt={name}
          width={size}
          height={size}
          className='object-cover w-full h-full'
          onError={() => setImgError(true)}
        />
      ) : (
        initials
      )}
    </div>
  )
}
