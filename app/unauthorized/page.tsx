'use client'

import Link from 'next/link'
import { ShieldX, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--background-secondary)' }}>
      <div className="mx-4 w-full max-w-md">
        <div
          className="rounded-2xl border p-8 text-center shadow-sm"
          style={{
            backgroundColor: 'var(--background-primary)',
            borderColor: 'var(--border-default)'
          }}
        >
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--danger-light)' }}>
            <ShieldX size={32} className="text-(--danger-main)" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Access Denied
          </h1>

          {/* Description */}
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            You don&apos;t have the required permissions to access this page.
            Please contact your administrator if you believe this is an error.
          </p>

          {/* Divider */}
          <div className="my-6 h-px" style={{ backgroundColor: 'var(--border-default)' }} />

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 rounded-xl bg-[#1a1a1a] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#333]"
            >
              <ArrowLeft size={16} />
              Go to Login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          &copy; {new Date().getFullYear()} TenancyPilot
        </p>
      </div>
    </div>
  )
}
