'use client'

import { useEffect } from 'react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.style.overflow = 'auto'
    document.body.style.height = 'auto'

    return () => {
      document.body.style.overflow = ''
      document.body.style.height = ''
    }
  }, [])

  return <>{children}</>
}
