'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Hook to handle automatic scrolling to a section based on URL query parameter
 * @param loading - Whether data is still loading
 */
export function useScrollToSection(loading: boolean) {
  const searchParams = useSearchParams()

  useEffect(() => {
    // Only scroll when loading is complete
    if (loading) return

    const section = searchParams.get('section')
    if (!section) return

    // Small delay to ensure DOM is fully rendered after data loads
    const timeoutId = setTimeout(() => {
      const element = document.getElementById(section)
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [loading, searchParams])
}