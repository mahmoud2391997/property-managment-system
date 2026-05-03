'use client'

import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import TasksTable from '@/components/tables/tasks-table'
import { Task } from '@/types'
import { usePaginatedSearch } from '@/hooks/use-paginated-search'
import { Tab, TabGroup } from '../costume-ui/tab'
import AddTaskDialog from '../dialogs/add-task-dialog'
import { useCallback, useMemo } from 'react'
import TableFilter, { type FilterAttribute, type FilterValue } from '../costume-ui/table-filter'
import { usePermissions } from '@/hooks/use-permissions'
import { PermissionGate } from '@/components/permission-gate'

// Define filterable attributes for tasks
const TASK_FILTER_ATTRIBUTES: FilterAttribute[] = [
  { key: 'task_id', label: 'Task ID', type: 'text' },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'Inspection', label: 'Inspection' },
      { value: 'Preparation', label: 'Preparation' },
      { value: 'Refund_Request', label: 'Refund Request' },
      { value: 'Refund_Finalization', label: 'Refund Finalization' },
      { value: 'Maintenance', label: 'Maintenance' },
      { value: 'Renovation', label: 'Renovation' },
      { value: 'Cleaning', label: 'Cleaning' },
      { value: 'Administrative', label: 'Administrative' },
      { value: 'Documentation', label: 'Documentation' },
      { value: 'Data_Entry', label: 'Data Entry' },
      { value: 'Accounting', label: 'Accounting' },
      { value: 'Legal', label: 'Legal' },
      { value: 'IT_Support', label: 'IT Support' },
      { value: 'Follow_Up', label: 'Follow Up' },
      { value: 'Complaint_Handling', label: 'Complaint Handling' },
      { value: 'Miscellaneous_Others', label: 'Miscellaneous/Others' }
    ]
  },
  {
    key: 'priority',
    label: 'Priority',
    type: 'select',
    options: [
      { value: 'Low', label: 'Low' },
      { value: 'Medium', label: 'Medium' },
      { value: 'High', label: 'High' },
      { value: 'Urgent', label: 'Urgent' }
    ]
  },
  { key: 'property', label: 'Property', type: 'text' },
  { key: 'room', label: 'Room', type: 'text' },
  { key: 'created_by', label: 'Created By', type: 'text' },
  { key: 'assigned_to', label: 'Assigned To', type: 'text' },
  { key: 'assigned_by', label: 'Assigned By', type: 'text' },
  { key: 'due_date', label: 'Due Date', type: 'date' }
]

interface TasksSectionProps {
  initialData: Task[]
  initialTotal: number
}

export default function TasksSection({
  initialData,
  initialTotal
}: TasksSectionProps) {
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
    activeFilters,
    updateItem
  } = usePaginatedSearch<Task>({
    apiRoute: '/api/tasks',
    initialData,
    initialTotal,
    pageSize: 10,
    defaultFilters: {
      status: 'all',
      task_id: '',
      type: '',
      priority: '',
      property: '',
      room: '',
      created_by: '',
      assigned_to: '',
      assigned_by: '',
      due_date: ''
    },
    filterKeyMapping: {
      task_id: 'id'
    },
    textFilterKeys: ['task_id', 'property', 'room', 'created_by', 'assigned_to', 'assigned_by'],
    dateFilterKeys: ['due_date']
  })

  const statusOptions = [
    'all',
    'Open',
    'In Progress',
    'Resolved',
    'Pending My Assignment'
  ]

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
    TASK_FILTER_ATTRIBUTES.forEach(attr => {
      if (!filterObj[attr.key]) {
        filterObj[attr.key] = ''
      }
    })

    updateFilters(filterObj)
  }, [updateFilters])

  const handleRefresh = async () => {
    // Force a fresh fetch by clearing cache and refetching
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
            attributes={TASK_FILTER_ATTRIBUTES}
            filters={advancedFilters}
            onFiltersChange={handleFiltersChange}
          />
          <SearchInput
            placeholder='Search tasks'
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>
        <PermissionGate permission="tasks.create" fallback={null}>
          <AddTaskDialog onSuccess={handleRefresh} />
        </PermissionGate>
      </div>

      {/* Filters */}
      <TabGroup showButton={true} className='-mx-5 px-5 mb-3'>
        {statusOptions.map(status => (
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
      <div className='pb-5'>
        <TasksTable
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
          updateItem={updateItem}
        />
      </div>
    </>
  )
}
