'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface LoaderProps {
  state: 'checking' | 'processing' | 'redirecting'
}

export function LoadingOverlay({ state }: LoaderProps) {
  const message =
    state === 'checking'
      ? 'Checking payment status...'
      : state === 'processing'
      ? 'Processing payment...'
      : 'Redirecting to payment gateway...'

  // Prevent scrolling when overlay is visible
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const overlay = (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-8 shadow-xl">
        <div
          className={
            state === 'checking'
              ? 'loader-l5'
              : state === 'processing'
              ? 'loader-l3'
              : 'loader-l20'
          }
        />
        <p className="text-lg font-medium text-gray-700 text-center">{message}</p>
      </div>
    </div>
  )

  // Portal to document.body to ensure it's above everything
  if (typeof window === 'undefined') return null
  return createPortal(overlay, document.body)
}
