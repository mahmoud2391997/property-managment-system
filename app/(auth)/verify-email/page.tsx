'use client'

import Link from 'next/link'

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Check Your Email</h1>
      <p className="text-muted-foreground text-center max-w-sm">
        A verification link has been sent to your email. Please check your inbox.
      </p>
      <Link
        href="/login"
        className="text-sm text-[#0d9488] hover:text-[#0a7a70] font-medium"
      >
        Back to Login
      </Link>
    </div>
  )
}
