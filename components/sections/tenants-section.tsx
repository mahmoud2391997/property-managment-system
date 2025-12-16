'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { ImportButtonIcon } from '@/components/costume-ui/icon'
import TenantsTable from '@/components/tables/tenants-table'
import AddTenantDialog from '@/components/dialogs/add-tenant-dialog'
import { TenantWithDetails } from '@/lib/tenants-utils'
import { usePaginatedSearch } from '@/hooks/use-paginated-search'

interface TenantsSectionProps {
  initialData: TenantWithDetails[]
  initialTotal: number
}

export default function TenantsSection({
  initialData,
  initialTotal
}: TenantsSectionProps) {
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
    updateItem
  } = usePaginatedSearch<TenantWithDetails>({
    apiRoute: '/api/tenants',
    initialData,
    initialTotal,
    pageSize: 10
  })

  const handleInviteSent = useCallback((tenantId: string) => {
    updateItem(tenantId, { inviteSent: true })
  }, [updateItem])

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
          placeholder='Search tenants'
          value={searchTerm}
          onChange={e => handleSearchChange(e.target.value)}
        />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'sm:py-5 py-2')}>
          <Link href='/tenants/import-tenants' className='flex-1 sm:flex-none'>
            <Button
              variant='secondary'
              icon={<ImportButtonIcon className='text-neutral-400' />}
              label='Import'
              className='w-full'
            />
          </Link>
          <AddTenantDialog />
        </div>
      </div>
      {/* Table */}
      <TenantsTable
        data={data}
        isLoading={isLoading}
        currentPage={currentPage}
        totalItems={total}
        pageSize={pageSize}
        canGoNext={canGoNext}
        canGoPrevious={canGoPrevious}
        onNextPage={goToNextPage}
        onPreviousPage={goToPreviousPage}
        onInviteSent={handleInviteSent}
      />
    </>
  )
}
