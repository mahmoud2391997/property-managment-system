'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { mockGetCurrentUser } from '@/lib/mock-auth'

export default function PasswordSetupGuard({
  children
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let isMounted = true

    const checkAuth = () => {
      const user = mockGetCurrentUser()
      
      if (!user) {
        router.replace('/login')
      } else {
        if (isMounted) {
          setIsReady(true)
        }
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [router])

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
