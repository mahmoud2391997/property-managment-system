'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2Icon, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(
    urlError === 'invalid_link' ? 'The reset link is invalid or has expired. Please request a new one.' : ''
  )
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setErrorMessage('Please enter your email address')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/api/auth/setup-password`,
      })

      if (error) {
        throw error
      }

      setIsSuccess(true)
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col">
        <div className="flex justify-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
        </div>

        <h1 className="text-[24px] font-semibold text-[#1a1a1a] text-center">
          Check Your Email
        </h1>
        <p className="mt-1 text-[14px] text-[#888] text-center">
          We've sent a password reset link to <strong className="text-[#555]">{email}</strong>
        </p>

        <p className="mt-6 text-[13px] text-[#999] text-center">
          Click the link in the email to reset your password. If you don't see it, check your spam folder.
        </p>

        <button
          type="button"
          onClick={() => {
            setIsSuccess(false)
            setEmail('')
          }}
          className="mt-6 w-full h-[46px] bg-[#1a1a1a] text-white text-[14px] font-medium hover:bg-[#333] rounded-xl transition-colors"
        >
          Send Another Email
        </button>

        <Link
          href="/login"
          className="mt-3 flex items-center justify-center gap-2 h-[46px] text-[14px] text-[#888] hover:text-[#555] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <h1 className="text-[24px] font-semibold text-[#1a1a1a]">
        Forgot Password
      </h1>
      <p className="mt-1 text-[14px] text-[#888]">
        Enter your email and we'll send you a reset link
      </p>

      <form onSubmit={handleSubmit} className="mt-8">
        <div className="flex flex-col gap-5">
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-[13px] font-medium text-[#444]">
              Your Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="h-[46px] border-[#ccc] bg-[#f5f5f5] rounded-xl text-[14px] placeholder:text-[#aaa] focus-visible:border-[#0d9488] focus-visible:ring-0 focus-visible:bg-white transition-colors"
            />
          </div>

          {errorMessage && (
            <p className="text-[13px] text-red-600">{errorMessage}</p>
          )}

          <Button
            type="submit"
            className="w-full h-[46px] bg-[#1a1a1a] text-white text-[14px] font-medium hover:bg-[#333] rounded-xl transition-colors"
            disabled={isLoading}
          >
            {isLoading && <Loader2Icon className="animate-spin mr-2 h-4 w-4" />}
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </Button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 h-[46px] text-[14px] text-[#888] hover:text-[#555] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  )
}
