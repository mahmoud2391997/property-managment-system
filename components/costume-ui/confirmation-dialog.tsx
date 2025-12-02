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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import Button from '@/components/costume-ui/button'
import { AlertTriangle, AlertCircle } from 'lucide-react'
import InputGroup from './input-group'
import { cn } from '@/lib/utils'

type props = {
  openDialogButton: React.ReactElement
  title: string
  description: string | React.ReactNode
  confirmationText?: string
  onConfirm: () => void | Promise<void>
  loading?: boolean
  confirmButtonLabel?: string
  confirmButtonLoadingLabel?: string
  confirmButtonClassName?: string
  cancelButtonLabel?: string
  inputLabel?: string
  variant?: 'danger' | 'warning' | 'confirm'
}

export default function ConfirmationDialog ({
  openDialogButton,
  title,
  description,
  confirmationText = 'DELETE',
  onConfirm,
  loading: externalLoading = false,
  confirmButtonLabel = 'Delete',
  confirmButtonLoadingLabel = 'Deleting..',
  confirmButtonClassName = 'bg-error-main! hover:bg-error-main/90!',
  cancelButtonLabel = 'Cancel',
  inputLabel = 'Type Delete to Confirm',
  variant = 'danger'
}: props) {
  const [inputValue, setInputValue] = useState('')
  const [open, setOpen] = useState(false)
  const [internalLoading, setInternalLoading] = useState(false)

  const loading = externalLoading || internalLoading
  // For 'confirm' variant, no text input required
  const isConfirmEnabled = variant === 'confirm'
    ? !loading
    : inputValue === confirmationText && !loading

  const handleConfirm = async () => {
    if (!isConfirmEnabled) return

    setInternalLoading(true)
    try {
      await onConfirm()
      setInputValue('')
      setOpen(false)
    } catch (error) {
      // Keep dialog open on error - parent handles error display
    } finally {
      setInternalLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (loading) return // Prevent closing while loading
    setOpen(newOpen)
    if (!newOpen) {
      setInputValue('')
    }
  }

  // Use AlertDialog for 'confirm' variant - cleaner, simpler design
  if (variant === 'confirm') {
    return (
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogTrigger asChild>{openDialogButton}</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className='text-(--text-secondary)'>{description}</div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              {cancelButtonLabel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirm()
              }}
              disabled={loading}
              className={cn(confirmButtonClassName)}
            >
              {loading ? confirmButtonLoadingLabel : confirmButtonLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  // Use full Dialog for 'danger' and 'warning' variants (with text input confirmation)
  return (
    <ShadcnDialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{openDialogButton}</DialogTrigger>
      <DialogContent className='py-0! px-0! my-10! overflow-visible! sm:max-w-[425px]'>
        <DialogHeader className='px-7 py-2.5! border-b border-(--border-strong)'>
          <DialogTitle asChild>
            <div className='py-[15] text-left flex items-center gap-2'>
              {variant === 'danger' ? (
                <AlertTriangle className='text-error-main w-5 h-5' />
              ) : (
                <AlertCircle className='text-amber-500 w-5 h-5' />
              )}
              <h3>{title}</h3>
            </div>
          </DialogTitle>
          <DialogDescription className='text-left'></DialogDescription>
        </DialogHeader>
        <div className='transition-all duration-300 p-7 py-4 space-y-4'>
          <div className='texts-body-medium text-(--text-secondary)'>
            {description}
          </div>
          <div className='space-y-2'>
            <InputGroup label={inputLabel}>
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
              label={loading ? confirmButtonLoadingLabel : confirmButtonLabel}
              onClick={handleConfirm}
              disabled={!isConfirmEnabled}
              loading={loading}
              className={confirmButtonClassName}
            />
          </div>
        </DialogFooter>
      </DialogContent>
    </ShadcnDialog>
  )
}
