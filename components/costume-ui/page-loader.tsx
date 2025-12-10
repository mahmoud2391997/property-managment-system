'use client'

interface LoaderProps {
  state: 'checking' | 'processing' | 'redirecting'
}

export function LoadingOverlay({ state }: LoaderProps) {
  const message =
    state === 'checking'
      ? 'Checking payment status...'
      : state === 'processing'
      ? 'Processing payment...'
      : 'Redirecting to payment gateway...'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-8 shadow-xl">
        <div
          className={
            state === 'checking'
              ? 'loader-l5'
              : state === 'processing'
              ? 'loader-l3'
              : 'loader-l20'
          }
        />
        <p className="text-lg font-medium text-gray-700 text-center">{message}</p>
      </div>
    </div>
  )
}
