'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'

export default function ConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [count, setCount] = useState(3)
  const [status, setStatus] = useState<'success' | 'error' | 'loading'>('loading')

  useEffect(() => {
    const urlStatus = searchParams.get('status')

    if (urlStatus === 'success') {
      setStatus('success')
    } else if (urlStatus === 'error') {
      setStatus('error')
    } else {
      // No status param, redirect to login
      router.replace('/login/staff')
      return
    }

    // Start countdown
    const timer = setInterval(() => {
      setCount(c => c - 1)
    }, 1000)

    const redirectTimer = setTimeout(() => {
      router.push('/login/staff')
    }, 3000)

    return () => {
      clearInterval(timer)
      clearTimeout(redirectTimer)
    }
  }, [router, searchParams])

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">Verifying...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      {status === 'success' ? (
        <>
          <CheckCircle2 className="h-20 w-20 text-green-500" />
          <h1 className="text-2xl font-semibold">Email Confirmed!</h1>
          <p className="text-muted-foreground">
            Your account has been verified successfully.
          </p>
        </>
      ) : (
        <>
          <XCircle className="h-20 w-20 text-red-500" />
          <h1 className="text-2xl font-semibold">Verification Failed</h1>
          <p className="text-muted-foreground">
            The confirmation link is invalid or has expired.
          </p>
        </>
      )}
      <p className="text-muted-foreground text-sm mt-2">
        Redirecting to login in {count} seconds...
      </p>
    </div>
  )
}
