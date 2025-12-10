'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import SearchInput from './costume-ui/search-input'
import TicketsTable from './tables/tickets-table'
import { Ticket } from '@/types'
import AddTicketDialog from './dialogs/add-ticket-dialog'
import AddTicketDrawer from './dialogs/add-ticket-drawer'
import TablePageSkeleton from './loading-ui/table-page-skeleton'
import { formatDate } from '@/utils/formatTime'

type Props = {
  userType: 'staff' | 'tenant'
}

export default function TicketsSection({ userType }: Props) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

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

  const filteredTickets = useMemo(() => {
    if (!searchTerm.trim()) {
      return tickets
    }

    const lowerSearch = searchTerm.toLowerCase().trim()

    return tickets.filter(ticket => {
      // Search by ticket ID (reference_id)
      const idMatch = ticket.id?.toLowerCase().includes(lowerSearch)

      // Search by type
      const typeMatch = ticket.type?.toLowerCase().includes(lowerSearch)

      // Search by title
      const titleMatch = ticket.title?.toLowerCase().includes(lowerSearch)

      // Search by description
      const descriptionMatch = ticket.description?.toLowerCase().includes(lowerSearch)

      // Search by property
      const propertyMatch = ticket.property?.toLowerCase().includes(lowerSearch)

      // Search by room (or "whole unit")
      const roomMatch = ticket.room?.toLowerCase().includes(lowerSearch)

      // Search by issue date (formatted)
      const issueDateFormatted = ticket.issue_timestamp ? formatDate(ticket.issue_timestamp).toLowerCase() : ''
      const issueDateMatch = issueDateFormatted.includes(lowerSearch)

      // Search by tenant name (issued by)
      const tenantNameMatch = ticket.tenant_name?.toLowerCase().includes(lowerSearch)

      // Search by staff name (assigned to)
      const staffNameMatch = ticket.staff_name?.toLowerCase().includes(lowerSearch)

      // Search by status
      const statusMatch = ticket.status?.toLowerCase().replace(/_/g, ' ').includes(lowerSearch)

      return idMatch || typeMatch || titleMatch || descriptionMatch || propertyMatch ||
             roomMatch || issueDateMatch || tenantNameMatch || staffNameMatch || statusMatch
    })
  }, [tickets, searchTerm])

  if (loading) {
    return <TablePageSkeleton />
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
        <SearchInput
          placeholder='Search tickets'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {/* Add Ticket Button - Only visible for tenants */}
        {userType === 'tenant' && (
          <div className={cn('flex items-center gap-2.5', 'sm:py-5 py-2')}>
            {/* Desktop: Dialog */}
            <div className='hidden sm:block'>
              <AddTicketDialog onSuccess={handleRefresh} />
            </div>
            {/* Mobile: Full-screen bottom drawer */}
            <div className='sm:hidden'>
              <AddTicketDrawer onSuccess={handleRefresh} />
            </div>
          </div>
        )}
      </div>
      {/* Table */}
      <TicketsTable data={filteredTickets} onDataRefresh={handleRefresh} />
    </div>
  )
}
