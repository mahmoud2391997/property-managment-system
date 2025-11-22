import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { AddButtonIcon, DeleteButtonIcon } from '@/components/costume-ui/icon'
import TicketsTable from '@/components/tables/tickets-table'

const Tickets = () => {
  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Tickets</h1>
      </div>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full py-5')}>
        <SearchInput placeholder='Search tickets' />
      </div>
      {/* Table */}
      <TicketsTable />
    </div>
  )
}

export default Tickets