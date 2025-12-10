'use client'

import { useRouter } from 'next/navigation'
import PaymentsTable from '@/components/tables/pyaments-table'
import { Payment } from '@/types'

type Props = {
  data: Payment[]
  userType: 'staff' | 'tenant'
}

export function PaymentsTableWithRefresh({ data, userType }: Props) {
  const router = useRouter()

  const handleRefresh = () => {
    router.refresh()
  }

  return <PaymentsTable data={data} userType={userType} onDataRefresh={handleRefresh} />
}
