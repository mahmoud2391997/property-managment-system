'use client'

import { cn } from '@/lib/utils'
import React, { useState, useRef, useEffect } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { Notice } from '@/types'
import { formatTimestampLong } from '@/utils/formatTime'
import { Users } from 'lucide-react'

type props = {
  data: Notice
}

const Notice_Card = ({ data }: props) => {
  const keyStyles: string = 'w-25 text-left texts-label-small'
  const valueStyles: string = 'text-left texts-caption-large'

  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const [showToggle, setShowToggle] = useState<boolean>(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const MAX_HEIGHT: number = 100 // Maximum height in pixels before showing "Show more"

  useEffect(() => {
    if (!contentRef.current) return

    const el = contentRef.current

    const checkHeight = () => {
      const height = el.offsetHeight
      setShowToggle(height > MAX_HEIGHT)
    }

    // Run once on mount
    checkHeight()

    // Observe any size changes (text wrapping, dynamic updates, etc.)
    const observer = new ResizeObserver(() => {
      checkHeight()
    })

    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    console.log('showToggle: ', showToggle)
    if (!showToggle && isExpanded) {
      setIsExpanded(false)
    }
  }, [showToggle])

  return (
    <div
      className={cn(
        'flex flex-col gap-2.5',
        'bg-white border border-gray-300',
        'w-full min-h-30 p-5',
        'rounded-xl shadow-sm'
      )}
    >
      <div className={cn('flex justify-between', 'w-full')}>
        <span className='text-lg font-medium'>{data.title}</span>
        <div className='flex items-center gap-[15px]'>
          <span
            className={cn(
              'bg-neutral-200',
              'py-[5px] px-3',
              'text-xs',
              'rounded-full'
            )}
          >
            {data.type}
          </span>
          {/* Actions */}
          <div
            className={cn(
              'flex items-center gap-[5px]',
              'text-neutral-500 cursor-pointer'
            )}
          >
            <Pencil strokeWidth={1.5} size={15} />
            <Trash2 strokeWidth={1.5} size={15} />
          </div>
        </div>
      </div>

      {/* Description with fade effect */}
      <div className='relative'>
        <div
          className={cn('overflow-hidden transition-all duration-300')}
          style={
            !isExpanded && showToggle
              ? { maxHeight: `${MAX_HEIGHT + 5}px` }
              : undefined
          }
        >
          <div ref={contentRef}>
            <span className='text-sm text-gray-600 '>{data.description}</span>
          </div>
        </div>

        {/* Fade overlay and Show more button */}
        {showToggle && !isExpanded && (
          <div className='absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/70 to-transparent flex items-end justify-center pb-1'>
            <button
              onClick={() => setIsExpanded(true)}
              className='texts-body-medium-medium text-(--text-secondary) hover:text-(--text-primary) cursor-pointer bg-white px-2'
            >
              Show more
            </button>
          </div>
        )}

        {/* Show less button */}
        {showToggle && isExpanded && (
          <div className='flex justify-center mt-2'>
            <button
              onClick={() => setIsExpanded(false)}
              className='texts-body-medium-medium text-(--text-secondary) hover:text-(--text-primary) cursor-pointer'
            >
              Show less
            </button>
          </div>
        )}
      </div>

      <div
        className={cn(
          'flex flex-col gap-[5px]',
          'pt-2.5 w-full',
          'border-t border-gray-200 text-gray-600'
        )}
      >
        <div className='flex'>
          <span className={keyStyles}>Created:</span>
          <span className={valueStyles}>
            {formatTimestampLong(data.effective_date)}
          </span>
        </div>

        <div className='flex'>
          <span className={keyStyles}>Effective date:</span>
          <span className={valueStyles}>
            {formatTimestampLong(data.created_at)}
          </span>
        </div>

        <div className='flex'>
          <span className={keyStyles}>Posted by:</span>
          <span className={valueStyles}>{data.posted_by}</span>
        </div>

        <div className='flex text-(--text-primary) text-left texts-label-small'>
          <span className={cn(keyStyles, 'text-(--text-primary)')}>Audience:</span>
          {data.audience === 'Specific Recipients' ? (
            <div className='flex items-center gap-[5] text-blue-600 hover:text-blue-700 cursor-pointer'>
              <Users size={13} />
              <span>{data.audience}</span>
            </div>
          ) : (
            <span>{data.audience}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default Notice_Card
