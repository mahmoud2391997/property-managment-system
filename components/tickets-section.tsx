'use client'

import { useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import SearchInput from './costume-ui/search-input'
import TicketsTable from './tables/tickets-table'
import { Ticket } from '@/types'
import AddTicketDialog from './dialogs/add-ticket-dialog'
import AddTicketDrawer from './dialogs/add-ticket-drawer'
import { usePaginatedSearch } from '@/hooks/use-paginated-search'
import { Tab, TabGroup } from './costume-ui/tab'
import TableFilter, { type FilterAttribute, type FilterValue } from './costume-ui/table-filter'
import { usePermissions } from '@/hooks/use-permissions'
import { PermissionGate } from '@/components/permission-gate'

// Define filterable attributes for tickets
const TICKET_FILTER_ATTRIBUTES: FilterAttribute[] = [
  { key: 'ticket_id', label: 'Ticket ID', type: 'text' },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'Maintenance', label: 'Maintenance' },
      { value: 'Complaint', label: 'Complaint' },
      { value: 'Billing', label: 'Billing' },
      { value: 'Aircon Top-Up', label: 'Aircon Top-Up' },
      { value: 'Others', label: 'Others' }
    ]
  },
  { key: 'property', label: 'Property', type: 'text' },
  { key: 'tenant_name', label: 'Issued By', type: 'text' },
  { key: 'assigned_to', label: 'Assigned To', type: 'text' },
  { key: 'assigned_by', label: 'Assigned By', type: 'text' }
]

interface TicketsSectionProps {
  initialData: Ticket[]
  initialTotal: number
  userType: 'staff' | 'tenant'
}

export default function TicketsSection({
  initialData,
  initialTotal,
  userType
}: TicketsSectionProps) {
  const { can } = usePermissions()
  const {
    data,
    isLoading,
    searchTerm,
    handleSearchChange,
    currentPage,
    total,
    canGoNext,
    canGoPrevious,
    goToNextPage,
    goToPreviousPage,
    pageSize,
    updateFilters,
    activeFilters
  } = usePaginatedSearch<Ticket>({
    apiRoute: '/api/tickets',
    initialData,
    initialTotal,
    pageSize: 10,
    defaultFilters: {
      status: 'all',
      ticket_id: '',
      type: '',
      property: '',
      tenant_name: '',
      assigned_to: '',
      assigned_by: ''
    },
    // Map filter keys to actual data property names
    filterKeyMapping: {
      ticket_id: 'id',
      assigned_to: 'staff_name',
      assigned_by: 'assigner_name'
    },
    // Text filters use partial/case-insensitive matching
    textFilterKeys: ['ticket_id', 'property', 'tenant_name', 'assigned_to', 'assigned_by']
  })

  const statusOptions = ['all', 'Open', 'In Progress', 'Pending Tenant Confirmation', 'Resolved', 'Closed']

  // Current status from URL (via activeFilters)
  const currentStatus = activeFilters.status || 'all'

  // Handle tab selection - updates URL which triggers refetch
  const handleTabClick = (status: string) => {
    updateFilters({ status })
  }

  // Convert activeFilters (Record) to FilterValue[] for TableFilter component
  const advancedFilters = useMemo((): FilterValue[] => {
    return Object.entries(activeFilters)
      .filter(([key, value]) => value && key !== 'status') // Exclude status (handled by tabs)
      .map(([key, value]) => ({ id: key, attribute: key, value }))
  }, [activeFilters])

  // Handle advanced filters change - convert FilterValue[] to Record and update
  const handleFiltersChange = useCallback((newFilters: FilterValue[]) => {
    const filterObj: Record<string, string> = {}

    // Set values for active filters
    newFilters.forEach(f => {
      if (f.attribute && f.value) {
        filterObj[f.attribute] = f.value
      }
    })

    // Clear filters that were removed
    TICKET_FILTER_ATTRIBUTES.forEach(attr => {
      if (!filterObj[attr.key]) {
        filterObj[attr.key] = ''
      }
    })

    updateFilters(filterObj)
  }, [updateFilters])

  // Handle refresh (for add ticket dialog)
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <>
      {/* Actions */}
      <div
        className={cn(
          'flex flex-col sm:flex-row justify-between sm:items-center gap-3',
          'w-full'
        )}
      >
        <div className='flex items-center gap-2'>
          <TableFilter
            attributes={TICKET_FILTER_ATTRIBUTES}
            filters={advancedFilters}
            onFiltersChange={handleFiltersChange}
          />
          <SearchInput
            placeholder='Search tickets'
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>
        {/* Add Ticket Button - Based on permissions and user type */}
        <div className={cn('flex items-center gap-2.5', 'sm:py-5 py-2')}>
          {(userType === 'tenant' || can('tickets.create')) && (
            <>
              {/* Desktop: Dialog */}
              <div className='hidden sm:block'>
                <AddTicketDialog onSuccess={handleRefresh} />
              </div>
              {/* Mobile: Full-screen bottom drawer */}
              <div className='sm:hidden'>
                <AddTicketDrawer onSuccess={handleRefresh} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status Tabs */}
      <TabGroup showButton={true} className='-mx-5 px-5 mb-3'>
        {statusOptions.map((status) => (
          <Tab
            key={status}
            label={status === 'all' ? 'All' : status}
            isSelected={currentStatus === status}
            onClick={() => handleTabClick(status)}
            className='texts-tab-secondary'
          />
        ))}
      </TabGroup>

      {/* Table */}
      <div>
        <TicketsTable
          data={data}
          onDataRefresh={handleRefresh}
          isLoading={isLoading}
          currentPage={currentPage}
          totalItems={total}
          pageSize={pageSize}
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          onNextPage={goToNextPage}
          onPreviousPage={goToPreviousPage}
        />
      </div>
    </>
  )
}
