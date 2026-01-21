'use client'

import { useParams } from 'next/navigation'
import TransferLeaseWizard from '@/components/lease-transfer/transfer-lease-wizard'

export default function RoomTransferLeasePage() {
  const params = useParams<{ id: string; leaseId: string }>()
  const roomId = params.id
  const leaseId = params.leaseId

  return (
    <TransferLeaseWizard
      leaseId={leaseId}
      sourceType='room'
      sourceId={roomId}
    />
  )
}
