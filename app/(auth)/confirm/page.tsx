'use client'

import { Suspense } from 'react'
import ConfirmPageContent from '@/components/confirm-page-content'

export default function ConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmPageContent />
    </Suspense>
  )
}
