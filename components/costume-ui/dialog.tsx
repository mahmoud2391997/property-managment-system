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
  openDialogButton?: React.ReactNode
  title: string | React.ReactNode
  sub_title?: string
  // hasFooter?: boolean
  footerButtons?: React.ReactNode
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
  footerButtons,
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
      {openDialogButton && <DialogTrigger asChild>{openDialogButton}</DialogTrigger>}
      <DialogContent
        className={`py-0! px-0! overflow-auto! sm:max-w-[425px] max-h-[calc(100vh-5rem)] flex flex-col ${className}`}
      >
        <DialogHeader className='gap-0 px-5 py-2.5!  border-b border-(--border-strong)'>
          <DialogTitle asChild>
            <div className='py-[10] mr-10 text-left'>
              {typeof title === 'string' ? <h3>{title}</h3> : title}
            </div>
          </DialogTitle>
          {sub_title && <DialogDescription>{sub_title}</DialogDescription>}
        </DialogHeader>
        <div className='transition-all duration-300 p-5 min-h-24 flex-1 overflow-auto'>
          {children}
        </div>
        {(saveButtonLabel || cancelButtonLabel || footerButtons) && (
          <DialogFooter>
            <div className='w-full flex items-center justify-end border-t border-(--border-strong) p-5 py-3 gap-3'>
              {footerButtons ? (
                footerButtons
              ) : (
                <>
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
                </>
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </ShadcnDialog>
  )
}
