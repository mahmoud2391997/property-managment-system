import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { AddButtonIcon, DeleteButtonIcon } from '@/components/costume-ui/icon'
import StaffTable from '@/components/tables/staff-table'
import { RoleButtonIcon } from '@/components/costume-ui/icon'
import Dialog from '@/components/costume-ui/dialog'
import AddStaff from '@/components/add-staff'

const Staff = () => {
  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Staff</h1>
      </div>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput placeholder='Search staff' />
        {/* Buttons */}
        <div className={cn('flex items-center gap-2.5', 'py-5')}>
          <Button
            icon={<DeleteButtonIcon />}
            label='Delete'
            className='bg-(--error-main)!'
          />

          <Button
            icon={<RoleButtonIcon className='text-neutral-300' />}
            label='Roles'
            className='bg-(--secondary-color)'
          />

          <Dialog
            openDialogButton={
              <Button
            icon={<AddButtonIcon className='text-neutral-300' />}
            label='Add Staff'
          />
            }
            title='Add Staff'
            saveButtonLabel='Save'
            className='max-w-150!'
          >
            <AddStaff />
          </Dialog>
        </div>
      </div>
      {/* Table */}
      <StaffTable />
    </div>
  )
}

export default Staff
