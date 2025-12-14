'use client'

import PaymentsTable from '@/components/tables/pyaments-table'
import { PaymentWithDetails } from '@/lib/payments-utils'

type Props = {
  data: PaymentWithDetails[]
  userType: 'staff' | 'tenant'
}

export function PaymentsTableWithRefresh({ data, userType }: Props) {
  return <PaymentsTable data={data} userType={userType} />
}