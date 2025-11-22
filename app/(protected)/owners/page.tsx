import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { AddButtonIcon, DeleteButtonIcon } from '@/components/costume-ui/icon'
import OwnersTable from '@/components/tables/owners-table'
import Dialog from '@/components/costume-ui/dialog'
import AddOwner from '@/components/add-owner'

const Owners = () => {
  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Owners</h1>
      </div>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput placeholder='Search owners' />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          <Button
            icon={<DeleteButtonIcon />}
            label='Delete'
            className='bg-(--error-main)!'
          />

          <Dialog
            openDialogButton={
              <Button
                icon={<AddButtonIcon className='text-neutral-300' />}
                label='Add Owner'
              />
            }
            title='Add Owner'
            saveButtonLabel='Save'
            className='max-w-150!'
          >
            <AddOwner />
          </Dialog>
        </div>
      </div>
      {/* Table */}
      <OwnersTable />
    </div>
  )
}

export default Owners
