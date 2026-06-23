import { cn } from '@/lib/utils'
import SearchInput from '@/components/costume-ui/search-input'
import Button from '@/components/costume-ui/button'
import { AddButtonIcon, DeleteButtonIcon } from '@/components/costume-ui/icon'
import Notice_Card from '@/components/notice-card'
import { noticesData } from '@/utils/data'
import React from 'react'
import Dialog from '@/components/costume-ui/dialog'
import AddNotice from '@/components/add-notice'
import { UnderDevelopment } from '@/components/costume-ui/under-development'

const Notices = async () => {
  const { data: { user } } = 
  const userType = user?.user_metadata?.user_type

  if (userType !== 'tenant') {
    await requirePermission('notices.access')
  }

  return (
    <div className={cn('flex flex-col gap-2.5', 'h-full')}>
      {/* Heading */}
      <div>
        <h1>Notices</h1>
      </div>
      {/* Actions */}
      <div className={cn('flex justify-between items-center', 'w-full py-5')}>
        <SearchInput placeholder='Search notices' />

        <Dialog
          openDialogButton={
            <Button
              icon={<AddButtonIcon className='text-neutral-300' />}
              label='Add Notice'
            />
          }
          title='Add Notice'
          saveButtonLabel='Save'
          className='max-w-200!'
        >
          <AddNotice />
        </Dialog>
      </div>
      <div className='@container'>
        <div
          className={cn(
            'transition-all duration-500 ease-in-out',
            'grid gap-6 w-full',
            'grid-cols-1 @[1000px]:grid-cols-2 @[1500px]:grid-cols-3'
          )}
        >
          {noticesData.map((noticeData, index) => (
            <React.Fragment key={index}>
              <Notice_Card data={noticeData} />
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Notices
