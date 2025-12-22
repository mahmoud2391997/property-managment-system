'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import CustomButton from './costume-ui/button'
import { AddButtonIcon, DeleteButtonIcon } from './costume-ui/icon'
import { Tab, TabGroup } from './costume-ui/tab'
import SectionTab from './costume-ui/section-tab'
import { useSingleSelectOption } from '@/hooks/useSingleSelectOption'
import SearchInput from './costume-ui/search-input'
import Link from 'next/link'
import PaymentsTable from './tables/pyaments-table'
import ExpensesTable from './tables/expenses-table'
import { PaymentWithDetails } from '@/lib/payments-utils'
import { ExpenseWithDetails } from '@/lib/expenses-utils'
import TableSectionSkeleton from './loading-ui/table-section-skeleton'
import { CreditCard, Receipt } from 'lucide-react'
import { SectionUnderDevelopment } from './costume-ui/under-development'

type Props = {
  propertyId?: string
  roomId?: string
}

export default function PaymentsSection({ propertyId, roomId }: Props) {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([])
  const [loadingPayments, setLoadingPayments] = useState(true)
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [expensesFetched, setExpensesFetched] = useState(false)

  // Room mode: no expenses tab, show section header instead
  const isRoomMode = !!roomId && !propertyId

  const {
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
      setLoadingPayments(false)
    }
  }, [propertyId, roomId])

  const fetchExpenses = useCallback(async () => {
    if (expensesFetched || isRoomMode) return // Don't fetch expenses for rooms

    setLoadingExpenses(true)
    try {
      const params = new URLSearchParams()
      if (propertyId) params.append('propertyId', propertyId)
      params.append('category', 'Property_Related')
      const response = await fetch(`/api/expenses?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setExpenses(data)
        setExpensesFetched(true)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoadingExpenses(false)
    }
  }, [propertyId, expensesFetched, isRoomMode])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  // Fetch expenses when switching to Expenses tab (only for property mode)
  useEffect(() => {
    if (selectedIndex === 1 && !expensesFetched && !isRoomMode) {
      fetchExpenses()
    }
  }, [selectedIndex, expensesFetched, fetchExpenses, isRoomMode])

  const isPaymentsTab = selectedIndex === 0 || isRoomMode
  const isExpensesTab = selectedIndex === 1 && !isRoomMode

  if (loadingPayments) {
    return <TableSectionSkeleton />
  }

  return (
    <div
      className={cn(
        'flex flex-col',
        'p-5 py-2.5 rounded-[12px]',
        'bg-(--background-primary) '
      )}
    >
      {/* Room mode: Show section header instead of tabs */}
      {isRoomMode ? (
        <div className='flex items-center gap-2.5 py-2'>
          <div className='flex items-center justify-center rounded-[7px] h-[31px] w-[31px] bg-[#DEFFE2] text-(--success-dark)'>
            <CreditCard size={19} strokeWidth={1.5} />
          </div>
          <div className='flex flex-col'>
            <h3 className='mb-1'>Payments</h3>
            <span className='texts-caption-large text-(--text-secondary)'>
              Tenant payment records for this room
            </span>
          </div>
        </div>
      ) : (
        <div className='py-3'>
          <SectionTab
            options={[
              { label: 'Payments', icon: <CreditCard size={16} /> },
              { label: 'Expenses', icon: <Receipt size={16} /> }
            ]}
            selectedIndex={selectedIndex ?? 0}
            onChange={selectByIndex}
          />
        </div>
      )}

      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput placeholder={isPaymentsTab ? 'Search payments' : 'Search expenses'} />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          <CustomButton
            icon={<DeleteButtonIcon />}
            label='Delete'
            className='bg-(--error-main)!'
          />

          <Link href={isPaymentsTab ? '/payments/add-payment' : '/expenses/add-expense'}>
            <CustomButton
              icon={<AddButtonIcon className='text-neutral-300' />}
              label={isPaymentsTab ? 'Add Payment' : 'Add Expense'}
            />
          </Link>
        </div>
      </div>

      {/* Filters */}
      <TabGroup showButton={true} className='-mx-5 px-5 mb-3'>
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

      {/* Tables */}
      {isPaymentsTab && (
        <PaymentsTable
          data={payments}
          showPropertyColumn={false}
          className='-mx-5! rounded-none! border-x-0'
        />
      )}
      {isExpensesTab && (
        // loadingExpenses ? (
        //   <TableSectionSkeleton />
        // ) : (
        //   <ExpensesTable
        //     data={expenses}
        //     className='-mx-5! rounded-none! border-x-0'
        //   />
        // )
        <SectionUnderDevelopment />
      )}
    </div>
  )
}
