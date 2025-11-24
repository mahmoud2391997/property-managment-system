'use client'

import { useState } from 'react'
import {
  Dialog as ShadcnDialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Button from '@/components/costume-ui/button'
import { AlertTriangle } from 'lucide-react'
import InputGroup from './input-group'

type props = {
  openDialogButton: React.ReactElement
  title: string
  description: string
  confirmationText?: string
  onConfirm: () => void | Promise<void>
  loading?: boolean
  confirmButtonLabel?: string
  cancelButtonLabel?: string
}

export default function ConfirmationDialog ({
  openDialogButton,
  title,
  description,
  confirmationText = 'DELETE',
  onConfirm,
  loading = false,
  confirmButtonLabel = 'Delete',
  cancelButtonLabel = 'Cancel'
}: props) {
  const [inputValue, setInputValue] = useState('')
  const [open, setOpen] = useState(false)

  const isConfirmEnabled = inputValue === confirmationText && !loading

  const handleConfirm = async () => {
    if (isConfirmEnabled) {
      await onConfirm()
      setInputValue('')
      setOpen(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setInputValue('')
    }
  }

  return (
    <ShadcnDialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{openDialogButton}</DialogTrigger>
      <DialogContent className='py-0! px-0! my-10! overflow-visible! sm:max-w-[425px]'>
        <DialogHeader className='px-7 py-2.5! border-b border-(--border-strong)'>
          <DialogTitle asChild>
            <div className='py-[15] text-left flex items-center gap-2'>
              <AlertTriangle className='text-error-main w-5 h-5' />
              <h3>{title}</h3>
            </div>
          </DialogTitle>
          <DialogDescription className='text-left'></DialogDescription>
        </DialogHeader>
        <div className='transition-all duration-300 p-7 py-4 space-y-4'>
          <p className='texts-body-medium text-(--text-secondary)'>
            {description}
          </p>
          <div className='space-y-2'>
            <InputGroup label='Type Delete to Confirm'>
              <Input
                id='confirmation-input'
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={`Type ${confirmationText} here`}
                disabled={loading}
              />
            </InputGroup>
          </div>
        </div>
        <DialogFooter>
          <div className='w-full flex items-center justify-end gap-2 border-t border-(--border-strong) p-7 py-5'>
            <DialogClose asChild>
              <Button
                variant='secondary'
                label={cancelButtonLabel}
                disabled={loading}
              />
            </DialogClose>
            <Button
              label={loading ? 'Deleting..' : 'Delete'}
              onClick={handleConfirm}
              disabled={!isConfirmEnabled}
              loading={loading}
              className='bg-error-main! hover:bg-error-main/90!'
            />
          </div>
        </DialogFooter>
      </DialogContent>
    </ShadcnDialog>
  )
}
