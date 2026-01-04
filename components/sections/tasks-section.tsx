'use client'

import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import TasksTable from '@/components/tables/tasks-table'
import { Task } from '@/types'
import { usePaginatedSearch } from '@/hooks/use-paginated-search'
import { Tab, TabGroup } from '../costume-ui/tab'
import AddTaskDialog from '../dialogs/add-task-dialog'

interface TasksSectionProps {
  initialData: Task[]
  initialTotal: number
}

export default function TasksSection({
  initialData,
  initialTotal
}: TasksSectionProps) {
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
    defaultFilters: { status: 'all' }
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
        <SearchInput
          placeholder='Search tasks'
          value={searchTerm}
          onChange={e => handleSearchChange(e.target.value)}
        />
        <AddTaskDialog onSuccess={handleRefresh} />
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
