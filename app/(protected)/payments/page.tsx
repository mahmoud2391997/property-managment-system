import { cn } from '@/lib/utils'
import PaymentsSection from '@/components/sections/payments-section'
import { devPayments } from '@/lib/dev-data'

export default function PaymentsPage() {
  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      <div>
        <h1>Payments</h1>
      </div>
      <PaymentsSection
        initialData={devPayments}
        initialTotal={devPayments.length}
        userType="staff"
      />
    </div>
  )
}
