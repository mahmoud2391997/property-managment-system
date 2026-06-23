'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { mockGetCurrentUser } from '@/lib/mock-auth'

export default function LoginPage() {
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
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col gap-6 w-full max-w-sm">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold">Welcome to TenancyPilot</h1>
          <p className="text-muted-foreground text-sm">Choose how you want to log in</p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/login/staff"
            className="flex items-center justify-center h-12 rounded-xl bg-[#1a1a1a] text-white text-sm font-medium hover:bg-[#333] transition-colors"
          >
            Staff Login
          </Link>
          <Link
            href="/login/tenant"
            className="flex items-center justify-center h-12 rounded-xl border border-[#ccc] text-sm font-medium hover:bg-[#f5f5f5] transition-colors"
          >
            Tenant Login
          </Link>
        </div>
        <p className="text-center text-xs text-[#999]">
          Demo: admin@example.com / admin123
        </p>
      </div>
    </div>
  )
}
