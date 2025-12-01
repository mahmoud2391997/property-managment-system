'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import SearchInput from './costume-ui/search-input'
import TicketsTable from './tables/tickets-table'
import { Ticket } from '@/types'
import TableSectionSkeleton from './loading-ui/table-section-skeleton'
import AddTicketDialog from './dialogs/add-ticket-dialog'

type Props = {
  userType: 'staff' | 'tenant'
}

export default function TicketsSection({ userType }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTickets = useCallback(async () => {
    try {
      const response = await fetch('/api/tickets')
      if (response.ok) {
        const data = await response.json()
        setTickets(data)
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleRefresh = () => {
    fetchTickets()
  }

  if (loading) {
    return <TableSectionSkeleton />
  }

  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Tickets</h1>
      </div>
      {/* Actions */}
      <div
        className={cn(
          'flex flex-col sm:flex-row justify-between sm:items-center gap-3',
          'w-full'
        )}
      >
        <SearchInput placeholder='Search tickets' />
        {/* Add Ticket Button - Only visible for tenants */}
        {userType === 'tenant' && (
          <div className={cn('flex items-center gap-2.5', 'sm:py-5 py-2')}>
            <AddTicketDialog onSuccess={handleRefresh} />
          </div>
        )}
      </div>
      {/* Table */}
      <TicketsTable data={tickets} onDataRefresh={handleRefresh} />
    </div>
  )
}
