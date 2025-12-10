'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { XCircle } from 'lucide-react'

export default function ErrorPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [count, setCount] = useState(3)

  const reason = searchParams.get('reason')

  const getErrorMessage = (reason: string | null) => {
    switch (reason) {
      case 'invalid_link':
        return {
          title: 'Invalid or Expired Link',
          message: 'The link you used is invalid or has expired.'
        }
      case 'missing_params':
        return {
          title: 'Invalid Link',
          message: 'The verification link is missing required parameters.'
        }
      case 'verification_failed':
        return {
          title: 'Verification Failed',
          message: 'The verification token is invalid or has expired.'
        }
      case 'expired':
        return {
          title: 'Link Expired',
          message: 'This link has expired.'
        }
      default:
        return {
          title: 'Something Went Wrong',
          message: 'An unexpected error occurred.'
        }
    }
  }

  const error = getErrorMessage(reason)

  useEffect(() => {
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
  }, [router])

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
        <XCircle className="h-14 w-14 text-red-600" />
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{error.title}</h1>
        <p className="text-muted-foreground text-lg">
          {error.message}
        </p>
      </div>
      <p className="text-muted-foreground text-sm mt-4">
        Redirecting to login in {count} second{count !== 1 ? 's' : ''}...
      </p>
    </div>
  )
}
