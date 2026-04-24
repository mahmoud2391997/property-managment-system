'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import Button from '../costume-ui/button'
import ContractsTable, {
  ContractWithDetails
} from '../tables/contracts-table'
import TableSectionSkeleton from '../loading-ui/table-section-skeleton'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/use-permissions'
import { PermissionGate } from '@/components/permission-gate'
import { NoAccessCard } from '@/components/no-access-card'

type Props = {
  propertyId: string
}

export default function ContractsSection({ propertyId }: Props) {
  const { can } = usePermissions()
  const [contracts, setContracts] = useState<ContractWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchContracts = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/contracts?propertyId=${propertyId}`
      )
      if (response.ok) {
        const data = await response.json()
        setContracts(data.contracts)
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  const handleAddContract = () => {
    router.push(`/properties/${propertyId}/contracts/add-contract`)
  }

  if (loading) {
    return <TableSectionSkeleton />
  }

  return (
    <PermissionGate 
      permission="contracts.access" 
      fallback={
        <NoAccessCard label="Contracts" />
      }
    >
      <div
        className={cn(
          'flex flex-col gap-5',
          'p-5 py-2.5 rounded-[12px]',
          'bg-(--background-primary) '
        )}
      >
        {/* Actions */}
        <div className={cn('flex justify-between items-center', 'w-full')}>
          <h2>Contracts</h2>
          <div className={cn('flex items-center gap-2.5', 'py-5')}>
            <PermissionGate permission="contracts.create" fallback={null}>
              <Button label='Add Contract' onClick={handleAddContract} />
            </PermissionGate>
          </div>
        </div>

        <ContractsTable
          data={contracts}
          className='-mx-5! rounded-none! border-x-0 mb-5'
          noPagnitation={true}
        />
      </div>
    </PermissionGate>
  )
}
