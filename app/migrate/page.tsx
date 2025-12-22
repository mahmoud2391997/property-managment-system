import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Welcome to TenancyPilot',
  description: 'Your new tenant portal is here',
}

export default function MigratePage() {
  const whatsappNumber = '60102836343'
  const whatsappMessage = encodeURIComponent(
    "Hi TenancyPilot Support, I need help creating my account on the new portal."
  )
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`

  return (
    <div className="min-h-screen bg-linear-to-b from-white to-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo/Brand */}
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: 'var(--primary-color)' }}
        >
          TenancyPilot
        </h1>
        <p className="texts-body-medium text-(--text-secondary) mb-10">
          Your new tenant portal
        </p>

        {/* Main Card */}
        <div className="bg-white border border-(--border-default) rounded-xl p-8 shadow-sm">
          {/* Welcome Icon */}
          <div className="mb-6 flex justify-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--secondary-color)', opacity: 0.1 }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center absolute"
              >
                <svg
                  className="w-7 h-7"
                  style={{ color: 'var(--secondary-color)' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
            </div>
          </div>

          <h2 className="texts-heading-h3 text-(--text-primary) mb-3">
            Welcome to your new portal
          </h2>

          <p className="texts-body-medium text-(--text-secondary) mb-8">
            We&apos;ve upgraded to a better system to serve you. Please sign in or contact us if you need assistance.
          </p>

          {/* Already have account section */}
          <div className="mb-6">
            <p className="texts-body-small text-(--text-secondary) mb-3">
              Already created your account?
            </p>
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg texts-button-primary transition-colors"
              style={{
                backgroundColor: 'var(--primary-color)',
                color: 'white',
              }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Sign in to your account
            </Link>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 border-t border-(--border-default)"></div>
            <span className="texts-body-small text-(--text-muted)">or</span>
            <div className="flex-1 border-t border-(--border-default)"></div>
          </div>

          {/* Don't have account section */}
          <div>
            <p className="texts-body-small text-(--text-secondary) mb-3">
              Haven&apos;t created your account yet?
            </p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg texts-button-primary transition-colors hover:opacity-90"
              style={{
                backgroundColor: '#25D366',
                color: 'white',
              }}
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contact TenancyPilot Support
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="texts-caption-large text-(--text-muted) mt-8">
          Need help? WhatsApp us at +60 10-283 6343
        </p>
      </div>
    </div>
  )
}
