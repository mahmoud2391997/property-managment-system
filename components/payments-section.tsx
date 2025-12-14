'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import CustomButton from './costume-ui/button'
import { AddButtonIcon, DeleteButtonIcon } from './costume-ui/icon'
import { Tab, TabGroup } from './costume-ui/tab'
import { useSingleSelectOption } from '@/hooks/useSingleSelectOption'
import SearchInput from './costume-ui/search-input'
import Link from 'next/link'
import PaymentsTable from './tables/pyaments-table'
import { PaymentWithDetails } from '@/lib/payments-utils'
import TableSectionSkeleton from './loading-ui/table-section-skeleton'

type Props = {
  propertyId?: string
  roomId?: string
}

export default function PaymentsSection({ propertyId, roomId }: Props) {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const {
    options: tabs,
    selectByIndex,
    selectedIndex
  } = useSingleSelectOption([
    {
      label: 'Payments',
      isSelected: true
    },
    {
      label: 'Expenses',
      isSelected: false
    }
  ])

  const {
    options: filterTabs,
    selectByIndex: selectFilterByIndex,
    selectedIndex: selectedFilterIndex
  } = useSingleSelectOption([
    {
      label: 'All',
      isSelected: true
    },
    {
      label: 'Paid',
      isSelected: false
    },
    {
      label: 'Paid Late',
      isSelected: false
    },
    {
      label: 'Overdue',
      isSelected: false
    },
    {
      label: 'Pending',
      isSelected: false
    }
  ])

  const fetchPayments = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (propertyId) params.append('propertyId', propertyId)
      if (roomId) params.append('roomId', roomId)
      const response = await fetch(`/api/payments?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPayments(data)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }, [propertyId, roomId])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  if (loading) {
    return <TableSectionSkeleton />
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-5',
        'p-5 py-2.5 rounded-[12px]',
        'bg-(--background-primary) '
      )}
    >
      <TabGroup className='-mx-5 px-5'>
        {tabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            isSelected={tab.isSelected}
            onClick={() => selectByIndex(index)}
          />
        ))}
      </TabGroup>

      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput placeholder='Search payments' />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          <CustomButton
            icon={<DeleteButtonIcon />}
            label='Delete'
            className='bg-(--error-main)!'
          />

          <Link href='/payments/add-payment'>
            <CustomButton
              icon={<AddButtonIcon className='text-neutral-300' />}
              label='Add Payment'
            />
          </Link>
        </div>
      </div>

      {/* Filters */}
      <TabGroup showButton={true} className='-mx-5 px-5'>
        {filterTabs.map((tab, index) => (
          <Tab
            key={index}
            label={tab.label}
            isSelected={tab.isSelected}
            onClick={() => selectFilterByIndex(index)}
            className='texts-tab-secondary'
          />
        ))}
      </TabGroup>
      <PaymentsTable
        data={payments}
        showPropertyColumn={false}
        className='-mx-5! rounded-none! border-x-0'
      />
    </div>
  )
}
