import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-neutral-900">403</h1>
        <h2 className="mt-4 text-2xl font-semibold text-neutral-700">
          Access Denied
        </h2>
        <p className="mt-2 text-neutral-600">
          You don&apos;t have permission to access this page.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
        >
          Go to Login
        </Link>
      </div>
    </div>
  )
}
