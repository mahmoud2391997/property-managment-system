'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { mockGetCurrentUser, mockSetCurrentUser, mockLoginByRole } from '@/lib/mock-auth'
import { Loader2Icon } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const user = mockGetCurrentUser()
    if (user) {
      router.replace('/dashboard')
    } else {
      setChecked(true)
    }
  }, [router])

  const handleRoleLogin = async (role: 'admin' | 'staff' | 'tenant') => {
    setLoading(true)
    try {
      const user = mockLoginByRole(role)
      if (user) {
        mockSetCurrentUser(user)
        if (role === 'tenant') {
          router.push('/tenant-dashboard')
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err) {
      console.error('Login error:', err)
    }
    setLoading(false)
  }

  if (!checked) return null

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col gap-6 w-full max-w-sm">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold">Welcome to TenancyPilot</h1>
          <p className="text-muted-foreground text-sm">Select your role to continue</p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => handleRoleLogin('admin')}
            disabled={loading}
            className="flex items-center justify-center h-12 rounded-xl bg-[#1a1a1a] text-white text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
          >
            {loading && <Loader2Icon className="animate-spin mr-2 h-4 w-4" />}
            Admin Login
          </button>
          <button
            onClick={() => handleRoleLogin('staff')}
            disabled={loading}
            className="flex items-center justify-center h-12 rounded-xl bg-[#0d9488] text-white text-sm font-medium hover:bg-[#0a7a70] transition-colors disabled:opacity-50"
          >
            {loading && <Loader2Icon className="animate-spin mr-2 h-4 w-4" />}
            Staff Login
          </button>
          <button
            onClick={() => handleRoleLogin('tenant')}
            disabled={loading}
            className="flex items-center justify-center h-12 rounded-xl border border-[#ccc] text-sm font-medium hover:bg-[#f5f5f5] transition-colors disabled:opacity-50"
          >
            {loading && <Loader2Icon className="animate-spin mr-2 h-4 w-4" />}
            Tenant Login
          </button>
        </div>
      </div>
    </div>
  )
}
