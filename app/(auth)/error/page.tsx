import { Suspense } from 'react'
import ErrorPageContent from '@/components/error-page-content'

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <ErrorPageContent />
    </Suspense>
  )
}
