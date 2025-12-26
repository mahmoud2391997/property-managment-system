'use client'

import Image from 'next/image'
import React, { useState } from 'react'

type UserAvatarProps = {
  name: string
  imgSrc?: string | null
  size?: number
  className?: string
}

const COLORS = [
  '#3B82F6', // blue
  '#22C55E', // green
  '#FACC15', // yellow
  '#A855F7', // purple
  '#EC4899', // pink
  '#F97316', // orange
  '#14B8A6', // teal
  '#EF4444', // red
  '#6366F1', // indigo
  '#06B6D4', // cyan
  '#F43F5E', // rose
]

function getColorFromName(name: string) {
  const charSum = name
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return COLORS[charSum % COLORS.length]
}

function getInitials(name: string) {
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
      className={`relative flex shrink-0 items-center justify-center rounded-full text-white font-semibold overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
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
        <>
          {/* Base color */}
          <div
            className="absolute inset-0"
            style={{ backgroundColor: bgColor }}
          />
          {/* Subtle gradient overlay */}
<div
  className="absolute inset-0"
  style={{
    background: `linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)`,
  }}
/>
{/* Inner shadow for depth */}
<div
  className="absolute inset-0 rounded-full"
  style={{
    boxShadow: 'inset 0 -1px 2px rgba(0,0,0,0.08)',
  }}
/>
          {/* Initials */}
          <span className="relative z-10" style={{ fontSize: size * 0.4 }}>
            {initials}
          </span>
        </>
      )}
    </div>
  )
}