'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function ConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [count, setCount] = useState(5)
  const [status, setStatus] = useState<'success' | 'error' | 'loading'>('loading')
  const hasProcessed = useRef(false)

  // Handle token verification
  useEffect(() => {
    if (hasProcessed.current) return

    const urlStatus = searchParams.get('status')

    // If status is already set in URL, use it
    if (urlStatus === 'success') {
      hasProcessed.current = true
      setStatus('success')
      return
    } else if (urlStatus === 'error') {
      hasProcessed.current = true
      setStatus('error')
      return
    }

    // Check for token in URL hash (Supabase sends tokens in hash fragment)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type = hashParams.get('type')

    if (accessToken && type === 'signup') {
      hasProcessed.current = true
      const supabase = createClient()
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      }).then(({ error }) => {
        if (error) {
          setStatus('error')
        } else {
          supabase.auth.signOut().then(() => {
            setStatus('success')
          })
        }
      })
    } else if (!urlStatus) {
      router.replace('/login/staff')
    }
  }, [router, searchParams])

  // Handle countdown timer separately - only starts when status changes from loading
  useEffect(() => {
    if (status === 'loading') return

    const timer = setInterval(() => {
      setCount(c => c - 1)
    }, 1000)

    const redirectTimer = setTimeout(() => {
      router.push('/login/staff')
    }, 5000)

    return () => {
      clearInterval(timer)
      clearTimeout(redirectTimer)
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">Verifying...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      {status === 'success' ? (
        <>
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-14 w-14 text-green-600" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Email Confirmed!</h1>
            <p className="text-muted-foreground text-lg">
              Your account has been verified successfully.
            </p>
            <p className="text-muted-foreground">
              You can now log in to your account.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-14 w-14 text-red-600" />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Verification Failed</h1>
            <p className="text-muted-foreground text-lg">
              The confirmation link is invalid or has expired.
            </p>
            <p className="text-muted-foreground">
              Please request a new confirmation email.
            </p>
          </div>
        </>
      )}
      <p className="text-muted-foreground text-sm mt-4">
        Redirecting to login in {count} second{count !== 1 ? 's' : ''}...
      </p>
    </div>
  )
}
