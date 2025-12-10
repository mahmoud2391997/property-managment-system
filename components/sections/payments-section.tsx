'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { AddButtonIcon, DeleteButtonIcon } from '@/components/costume-ui/icon'
import PaymentsTable from '@/components/tables/pyaments-table'
import Link from 'next/link'
import { Payment } from '@/types'
import { formatDate } from '@/utils/formatTime'
import { formatCurrency } from '@/utils/formatCurrency'

interface PaymentsSectionProps {
  payments: Payment[]
  userType: 'staff' | 'tenant'
}

export default function PaymentsSection({ payments, userType }: PaymentsSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  const handleRefresh = () => {
    router.refresh()
  }

  // Helper function to get display status
  const getDisplayStatus = (payment: Payment) => {
    if (payment.status === 'Cancelled') {
      return 'Cancelled'
    }

    const now = new Date()
    const dueDate = payment.due_date ? new Date(payment.due_date) : null
    const isFullyPaid = payment.payment_percentage >= 100
    const isOverdue = dueDate ? now > dueDate : false
    const latestPaymentDate = payment.latest_payment_timestamp ? new Date(payment.latest_payment_timestamp) : null

    if (isFullyPaid) {
      return (dueDate && latestPaymentDate && latestPaymentDate > dueDate) ? 'Paid Late' : 'Paid'
    }
    return isOverdue ? 'Overdue' : 'Pending'
  }

  const filteredPayments = useMemo(() => {
    if (!searchTerm.trim()) {
      return payments
    }

    const lowerSearch = searchTerm.toLowerCase().trim()

    return payments.filter(payment => {
      // Search by ID (reference_id)
      const idMatch = payment.id?.toLowerCase().includes(lowerSearch)

      // Search by type
      const typeMatch = payment.type?.toLowerCase().includes(lowerSearch)

      // Search by property
      const propertyMatch = payment.property?.toLowerCase().includes(lowerSearch)

      // Search by room (or "whole unit")
      const roomMatch = payment.room?.toLowerCase().includes(lowerSearch)

      // Search by due date (formatted)
      const dueDateFormatted = payment.due_date ? formatDate(payment.due_date).toLowerCase() : ''
      const dueDateMatch = dueDateFormatted.includes(lowerSearch)

      // Search by amount (formatted)
      const amountFormatted = formatCurrency(payment.amount).toLowerCase()
      const amountMatch = amountFormatted.includes(lowerSearch) ||
                          payment.amount.toString().includes(lowerSearch)

      // Search by status (computed display status)
      const displayStatus = getDisplayStatus(payment)
      const statusMatch = displayStatus.toLowerCase().replace(/_/g, ' ').includes(lowerSearch)

      return idMatch || typeMatch || propertyMatch || roomMatch || dueDateMatch || amountMatch || statusMatch
    })
  }, [payments, searchTerm])

  return (
    <>
      {/* Actions */}
      <div className={cn('flex flex-col sm:flex-row justify-between sm:items-center gap-3', 'w-full')}>
        <SearchInput
          placeholder='Search payments'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {/* Buttons */}
        {userType === 'staff' && (
          <div className={cn('flex items-center gap-2.5', 'sm:py-5 py-2')}>
            <Button
              icon={<DeleteButtonIcon />}
              label='Delete'
              className='bg-(--error-main)! flex-1 sm:flex-none'
            />

            <Link href='/payments/add-payment' className='flex-1 sm:flex-none'>
              <Button
                icon={<AddButtonIcon className='text-neutral-300' />}
                label='Add Payment'
                className='w-full'
              />
            </Link>
          </div>
        )}
      </div>
      {/* Table */}
      <div>
        <PaymentsTable data={filteredPayments} userType={userType} onDataRefresh={handleRefresh} />
      </div>
    </>
  )
}
