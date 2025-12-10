import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { AddButtonIcon, DeleteButtonIcon } from '@/components/costume-ui/icon'
import ExpensesTable from '@/components/tables/expenses-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { UnderDevelopment } from '@/components/costume-ui/under-development'

const Expenses = () => {
  return <UnderDevelopment />
  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Expenses</h1>
      </div>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput placeholder='Search expenses' />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          {/* <Button
            icon={<DeleteButtonIcon />}
            label='Delete'
            className='bg-(--error-main)!'
          /> */}

          <Link href='/expenses/add-expense'>
            <Button
              icon={<AddButtonIcon className='text-neutral-300' />}
              label='Add Expense'
            />
          </Link>
        </div>
      </div>
      {/* Table */}
      <Tabs defaultValue='property_related' className='w-full'>
        <div className='flex justify-center w-full'>
          <TabsList>
            <TabsTrigger value='property_related'>Property Related</TabsTrigger>
            <TabsTrigger value='contract_related'>Contract Related</TabsTrigger>
            <TabsTrigger value='staff_related'>Staff Related</TabsTrigger>
            <TabsTrigger value='company_related'>Company Related</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value='property_related'>
          <ExpensesTable />
        </TabsContent>
        <TabsContent value='contract_related'>
          <ExpensesTable />
        </TabsContent>
        <TabsContent value='staff_related'>
          <ExpensesTable />
        </TabsContent>
        <TabsContent value='company_related'>
          <ExpensesTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Expenses
