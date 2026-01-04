'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter
} from '@/components/ui/drawer'
import AddTicket from '../add-ticket'
import Button from '../costume-ui/button'
import { AddButtonIcon } from '../costume-ui/icon'
import { cn } from '@/lib/utils'

type Props = {
  onSuccess?: () => void
}

export default function AddTicketDrawer({ onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  return (
    <>
      {/* Trigger Button */}
      <Button
        icon={<AddButtonIcon className='text-neutral-300' />}
        label='Add Ticket'
        type='button'
        onClick={() => setOpen(true)}
        isResponsive={false}
        className='w-full'
      />

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent
          fullScreen
          className={cn(
            'px-0 pb-0',
            'flex flex-col'
          )}
        >
          {/* Header with close button */}
          <DrawerHeader className='px-4 pb-4 border-b border-(--border-default) shrink-0'>
            <div className='flex items-center justify-between'>
              <DrawerTitle className='text-left text-lg'>Add Ticket</DrawerTitle>
              <button
                onClick={() => setOpen(false)}
                className='p-2 hover:bg-neutral-100 rounded-full transition-colors'
              >
                <X className='w-5 h-5 text-(--text-secondary)' />
              </button>
            </div>
          </DrawerHeader>

          {/* Scrollable Content */}
          <div className='flex-1 overflow-auto px-4 py-4 min-h-0'>
            <AddTicket
              onLoadingChange={setLoading}
              onSuccess={handleSuccess}
            />
          </div>

          {/* Footer with submit button */}
          <DrawerFooter className='border-t border-(--border-default) px-4 py-4 shrink-0'>
            <button
              type='submit'
              form='dialog-form'
              disabled={loading}
              className={cn(
                'w-full py-3 rounded-lg font-medium text-white',
                'bg-(--primary-color) hover:opacity-90',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-opacity'
              )}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  )
}
