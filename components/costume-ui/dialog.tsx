'use client'

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
import { SaveButtonIcon } from './icon'
import Button from '@/components/costume-ui/button'

type props = {
  children: React.ReactNode
  openDialogButton: React.ReactNode
  title: string
  sub_title?: string
  hasFooter?: boolean
  saveButtonLabel?: string
  cancelButtonLabel?: string
  className?: string
  loading?: boolean
  disabled?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}
export default function Dialog ({
  children,
  openDialogButton,
  title,
  sub_title,
  saveButtonLabel,
  cancelButtonLabel,
  className = '',
  loading = false,
  disabled = false,
  open,
  onOpenChange
}: props) {
  return (
    <ShadcnDialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{openDialogButton}</DialogTrigger>
      <DialogContent className={`py-0! px-0! overflow-auto! sm:max-w-[425px] max-h-[calc(100vh-5rem)] flex flex-col ${className}`}>
        <DialogHeader className='gap-0 px-7 py-2.5!  border-b border-(--border-strong)'>
          <DialogTitle asChild>
            <div className='py-[15] text-left'>
              <h3>{title}</h3>
            </div>
          </DialogTitle>
          {sub_title && <DialogDescription>{sub_title}</DialogDescription>}
        </DialogHeader>
        <div className='transition-all duration-300 p-5 min-h-24 flex-1 overflow-auto'>{children}</div>
        {(saveButtonLabel || cancelButtonLabel) && (
          <DialogFooter>
            <div className='w-full flex items-center justify-end border-t border-(--border-strong) p-7 py-5'>
              {cancelButtonLabel && (
                <DialogClose asChild>
                  <Button variant='secondary' label={cancelButtonLabel} />
                </DialogClose>
              )}
              {saveButtonLabel && (
                <Button
                  icon={<SaveButtonIcon />}
                  label={saveButtonLabel}
                  type='submit'
                  form='dialog-form'
                  loading={loading}
                  disabled={disabled}
                />
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </ShadcnDialog>
  )
}
