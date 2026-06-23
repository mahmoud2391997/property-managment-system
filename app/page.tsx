'use client';

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { mockGetCurrentUser } from '@/lib/mock-auth'

export default function Page() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const user = mockGetCurrentUser()
    if (user) {
      router.replace('/dashboard')
    } else {
      router.replace('/login')
    }
    setChecked(true)
  }, [router])

  if (!checked) return null

  return null
}
