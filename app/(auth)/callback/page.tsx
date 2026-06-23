'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/login')
  }, [router])

  return (
    <div className="flex min-h-svh items-center justify-center">
      <p className="text-muted-foreground">Processing...</p>
    </div>
  )
}
