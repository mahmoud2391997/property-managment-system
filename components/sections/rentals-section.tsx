'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import RentalsTable, { RentalWithDetails } from '@/components/tables/rentals-table'
import { usePermissions } from '@/hooks/use-permissions'
import { PermissionGate } from '@/components/permission-gate'
import { NoAccessCard } from '@/components/no-access-card'

// Calculate end date from start_date + number_of_months
function calculateEndDate(
  startDate: string,
  numberOfMonths: number | null
): Date | null {
  if (numberOfMonths === null) {
    return null // Ongoing
  }

  const start = new Date(startDate)
  const endDate = new Date(start)
  endDate.setMonth(endDate.getMonth() + numberOfMonths)

  return endDate
}

// Format date to searchable string
function formatDateForSearch(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).toLowerCase()
}

interface RentalsSectionProps {
  rentals: RentalWithDetails[]
}

export default function RentalsSection({ rentals }: RentalsSectionProps) {
  const { can } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const searchParams = useSearchParams()
  const [highlightId, setHighlightId] = useState<string | null>(null)

  // Check for reference_id in URL to highlight
  useEffect(() => {
    const referenceId = searchParams.get('reference_id')
    if (referenceId) {
      setHighlightId(referenceId)
      // Clear highlight after animation completes
      const timer = setTimeout(() => {
        setHighlightId(null)
        // Clean up URL without refresh
        window.history.replaceState({}, '', '/rentals')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  const filteredRentals = useMemo(() => {
    if (!searchTerm.trim()) {
      return rentals
    }

    const lowerSearch = searchTerm.toLowerCase().trim()

    return rentals.filter(rental => {
      // Search by rental ID (reference_id)
      const rentalIdMatch = rental.reference_id?.toLowerCase().includes(lowerSearch)

      // Search by property name
      const propertyMatch = rental.property?.toLowerCase().includes(lowerSearch)

      // Search by room/unit (includes 'whole unit')
      const unitMatch = rental.unit?.toLowerCase().includes(lowerSearch)

      // Search by start date
      const startDate = new Date(rental.start_date)
      const startDateMatch = formatDateForSearch(startDate).includes(lowerSearch)

      // Search by end date
      const endDate = calculateEndDate(rental.start_date, rental.number_of_months)
      const endDateMatch = endDate
        ? formatDateForSearch(endDate).includes(lowerSearch)
        : 'ongoing'.includes(lowerSearch)

      // Search by rental amount (monthly_rent)
      const amountMatch = rental.monthly_rent?.toString().includes(lowerSearch) ||
                          `rm ${rental.monthly_rent?.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.toLowerCase().includes(lowerSearch)

      // Search by status
      const statusMatch = rental.status?.toLowerCase().includes(lowerSearch)

      return rentalIdMatch || propertyMatch || unitMatch || startDateMatch || endDateMatch || amountMatch || statusMatch
    })
  }, [rentals, searchTerm])

  return (
    <PermissionGate 
      permission="rentals.access" 
      fallback={
        <NoAccessCard label="Rentals" />
      }
    >
      <>
        {/* Actions */}
        <div className={cn('flex flex-col sm:flex-row justify-between sm:items-center gap-3', 'w-full')}>
          <SearchInput
            placeholder='Search rentals'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Table */}
        <div>
          <RentalsTable data={filteredRentals} highlightReferenceId={highlightId} />
        </div>
      </>
    </PermissionGate>
  )
}
