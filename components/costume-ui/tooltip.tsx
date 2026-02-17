'use client'

import React, { useRef, useState, useEffect } from 'react'
import {
  Tooltip as ShadcnTooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'

type Props = {
  children: React.ReactNode
  className?: string
  content: string
  maxWidth?: string // optional max width for truncation
  variant?: 'turnicate' | 'description'
  clickOnly?: boolean
}

const HoverTooltip = ({
  children,
  content,
  maxWidth = '200px',
  className = '',
  variant = 'turnicate',
  clickOnly = false
}: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<number | undefined>(undefined)
  const [showTooltip, setShowTooltip] = useState(false)

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      if (ref.current && ref.current.scrollWidth > ref.current.clientWidth) {
        setShowTooltip(true)
      }
    }, 1000) // 1-second delay
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    setShowTooltip(false)
  }

  const triggerRef = useRef<HTMLDivElement>(null)

  const handleClick = () => {
    if (clickOnly) {
      setShowTooltip((prev) => !prev)
      return
    }
    setShowTooltip((prev) => !prev)
    // Auto-hide after 2 seconds on touch/click
    setTimeout(() => setShowTooltip(false), 2000)
  }

  // Close tooltip when clicking outside (for clickOnly mode)
  useEffect(() => {
    if (!clickOnly || !showTooltip) return

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setShowTooltip(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [clickOnly, showTooltip])

  if (variant === 'description') {
    return (
      <TooltipProvider>
        <ShadcnTooltip open={showTooltip}>
          <TooltipTrigger
            onMouseEnter={clickOnly ? undefined : () => setShowTooltip(true)}
            onMouseLeave={clickOnly ? undefined : () => setShowTooltip(false)}
            onClick={handleClick}
            asChild
          >
            <div ref={clickOnly ? triggerRef : undefined} className={className}>{children}</div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{content}</p>
          </TooltipContent>
        </ShadcnTooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <ShadcnTooltip open={showTooltip}>
        <TooltipTrigger asChild>
          <div
            ref={ref}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={() => {
              if (ref.current && ref.current.scrollWidth > ref.current.clientWidth) {
                setShowTooltip((prev) => !prev)
                setTimeout(() => setShowTooltip(false), 2000)
              }
            }}
            className={`truncate ${className}`}
            style={{ maxWidth }}
          >
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{content}</p>
        </TooltipContent>
      </ShadcnTooltip>
    </TooltipProvider>
  )
}

export default HoverTooltip
