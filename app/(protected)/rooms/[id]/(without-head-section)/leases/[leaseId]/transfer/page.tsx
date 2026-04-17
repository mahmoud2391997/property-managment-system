'use client'

import { useParams } from 'next/navigation'
import TransferLeaseWizard from '@/components/lease-transfer/transfer-lease-wizard'
import { PermissionGuard } from '@/components/permission-guard'

export default function RoomTransferLeasePage() {
  const params = useParams<{ id: string; leaseId: string }>()
  const roomId = params.id
  const leaseId = params.leaseId

  return (
    <PermissionGuard permission='leases.transfer'>
      <TransferLeaseWizard
        leaseId={leaseId}
        sourceType='room'
        sourceId={roomId}
      />
    </PermissionGuard>
  )
}
