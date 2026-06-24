'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { mockGetCurrentUser, mockSetCurrentUser, mockLoginByRole } from '@/lib/mock-auth'
import { Loader2Icon, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function TenantLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const user = mockGetCurrentUser()
    if (user) {
      router.replace('/tenant-dashboard')
    }
  }, [router])

  const handleTenantLogin = async () => {
    setLoading(true)
    try {
      const user = mockLoginByRole('tenant')
      if (user) {
        mockSetCurrentUser(user)
        router.push('/tenant-dashboard')
      }
    } catch (err) {
      console.error('Login error:', err)
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#666] hover:text-[#333] mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Tenant Login</h1>
            <p className="text-muted-foreground text-sm">Click below to log in as tenant</p>
          </div>

          <button
            onClick={handleTenantLogin}
            disabled={loading}
            className="flex items-center justify-center h-12 rounded-xl border border-[#ccc] text-sm font-medium hover:bg-[#f5f5f5] transition-colors disabled:opacity-50"
          >
            {loading && <Loader2Icon className="animate-spin mr-2 h-4 w-4" />}
            {loading ? 'Logging in...' : 'Continue as Tenant'}
          </button>
        </div>
      </div>
    </div>
  )
}
