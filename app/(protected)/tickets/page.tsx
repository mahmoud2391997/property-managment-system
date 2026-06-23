import { cn } from '@/lib/utils'
import TicketsSection from '@/components/tickets-section'
import { devTickets } from '@/lib/dev-data'

export default function TicketsPage() {
  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      <div>
        <h1>Tickets</h1>
      </div>
      <TicketsSection
        initialData={devTickets}
        initialTotal={devTickets.length}
        userType="staff"
      />
    </div>
  )
}
