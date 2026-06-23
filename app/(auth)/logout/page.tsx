'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { mockLogout } from '@/lib/mock-auth'

export default function LogoutPage() {
  const router = useRouter()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    mockLogout()
    router.replace('/login')
  }, [router])

  return (
    <div className="flex min-h-svh items-center justify-center">
      <p className="text-muted-foreground">Logging out...</p>
    </div>
  )
}
