import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { AddButtonIcon, DeleteButtonIcon } from '@/components/costume-ui/icon'
import TenantsTable from '@/components/tables/tenants-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AddTenant from '@/components/add-tenant'
import Dialog from '@/components/costume-ui/dialog'

const Tenants = () => {
  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Tenants</h1>
      </div>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full')}>
        <SearchInput placeholder='Search tenants' />
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
                label='Add Tenant'
              />
            }
            title='Add Tenant'
            saveButtonLabel='Save'
            className='max-w-150!'
          >
            <AddTenant />
          </Dialog>
        </div>
      </div>
      {/* Table */}
      <Tabs defaultValue='individual' className='w-full'>
        <div className='flex justify-center w-full'>
          <TabsList>
            <TabsTrigger value='individual'>Individual</TabsTrigger>
            <TabsTrigger value='company'>Company</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value='individual'>
          <TenantsTable />
        </TabsContent>
        <TabsContent value='company'>
          <TenantsTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Tenants
