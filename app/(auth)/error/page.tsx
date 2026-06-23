'use client'

import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-bold">Authentication Error</h1>
      <p className="text-muted-foreground text-center max-w-sm">
        Something went wrong during authentication. Please try again.
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
