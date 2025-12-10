import { Suspense } from 'react'
import ConfirmPageContent from '@/components/confirm-page-content'

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    }>
      <ConfirmPageContent />
    </Suspense>
  )
}
