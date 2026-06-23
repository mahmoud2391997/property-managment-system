'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { mockGetCurrentUser } from '@/lib/mock-auth'
import StaffLoginForm from '@/components/staff-login-form'

export default function StaffLoginPage() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const user = mockGetCurrentUser()
    if (user) {
      router.replace('/dashboard')
    } else {
      setChecked(true)
    }
  }, [router])

  if (!checked) return null

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Suspense fallback={null}>
          <StaffLoginForm />
        </Suspense>
      </div>
    </div>
  )
}
