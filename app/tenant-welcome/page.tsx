import Image from 'next/image'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Welcome to TenancyPilot',
  description: 'Your tenant portal is launching soon',
}

export default function TenantWelcomePage() {
  return (
    <div className="h-screen bg-linear-to-b from-white to-gray-50 flex flex-col items-center justify-center px-4 overflow-auto">
      {/* Main content card */}
      <div className="w-full max-w-lg text-center">
        {/* Success checkmark */}
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-[var(--success-light)] flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--success-main)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Welcome message */}
        <h1 className="text-2xl font-semibold text-(--text-primary) mb-3">
          Welcome to TenancyPilot
        </h1>

        <p className="text-(--text-secondary) texts-body-large mb-8">
          Thank you for signing in. Your account has been verified and is ready to go.
        </p>

        {/* Launch announcement card */}
        <div className="bg-white border border-(--border-default) rounded-xl p-6 shadow-sm mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <svg
              className="w-5 h-5 text-[var(--secondary-color)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="texts-body-medium-medium text-[var(--text-secondary)]">
              Portal Launch Date
            </span>
          </div>

          <div className="text-3xl font-semibold text-[var(--text-primary)] mb-2">
            December 22nd
          </div>

          <div className="flex items-center justify-center gap-2 text-[var(--secondary-color)]">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="texts-body-medium-medium">11:00 AM</span>
          </div>
        </div>

        {/* Additional info */}
        <p className="texts-body-medium text-(--text-secondary) mb-6">
          We&apos;re putting the finishing touches on your tenant portal.
          On launch day, you&apos;ll be able to view your lease details,
          track payments, and much more.
        </p>

        {/* Divider */}
        <div className="border-t border-(--border-default) pt-6">
          <p className="texts-body-small text-(--text-muted)">
            Questions? Contact management for assistance.
          </p>
        </div>
      </div>
    </div>
  )
}