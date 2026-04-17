'use client'

import { useParams } from 'next/navigation'
import TransferLeaseWizard from '@/components/lease-transfer/transfer-lease-wizard'
import { PermissionGuard } from '@/components/permission-guard'

export default function PropertyTransferLeasePage() {
  const params = useParams<{ id: string; leaseId: string }>()
  const propertyId = params.id
  const leaseId = params.leaseId

  return (
    <PermissionGuard permission='leases.transfer'>
      <TransferLeaseWizard
        leaseId={leaseId}
        sourceType='property'
        sourceId={propertyId}
      />
    </PermissionGuard>
  )
}
