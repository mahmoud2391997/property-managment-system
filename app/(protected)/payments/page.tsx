import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { AddButtonIcon, DeleteButtonIcon } from '@/components/costume-ui/icon'
import PaymentsTable from '@/components/tables/pyaments-table'
import Link from 'next/link'

const Payments = () => {
  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Payments</h1>
      </div>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput placeholder='Search payments' />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          <Button
            icon={<DeleteButtonIcon />}
            label='Delete'
            className='bg-(--error-main)!'
          />

          <Link href='/payments/add-payment'>
            <Button
              icon={<AddButtonIcon className='text-neutral-300' />}
              label='Add Payment'
            />
          </Link>
        </div>
      </div>
      {/* Table */}
      <div>
        <PaymentsTable />
      </div>
    </div>
  )
}

export default Payments
