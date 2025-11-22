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
import { cloneElement, ReactElement, useState, useEffect } from 'react'

type props = {
  children: React.ReactNode
  openDialogButton: React.ReactElement
  title: string
  sub_title?: string
  hasFooter?: boolean
  saveButtonLabel?: string
  cancelButtonLabel?: string
  className?: string
  loading?: boolean
}
export default function Dialog ({
  children,
  openDialogButton,
  title,
  sub_title,
  saveButtonLabel,
  cancelButtonLabel,
  className = '',
  loading = false
}: props) {
  return (
    <ShadcnDialog>
      <DialogTrigger asChild>{openDialogButton}</DialogTrigger>
      <DialogContent className={`py-0! px-0! my-10! overflow-visible! sm:max-w-[425px] ${className}`}>
        <DialogHeader className='px-7 py-2.5!  border-b border-(--border-strong)'>
          <DialogTitle asChild>
            <div className='py-[15] text-left'>
              <h3>{title}</h3>
            </div>
          </DialogTitle>
          {sub_title && <DialogDescription>{sub_title}</DialogDescription>}
        </DialogHeader>
        <div className='transition-all duration-300 p-5  max-h-120 overflow-auto'>{children}</div>
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
                />
              )}
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </ShadcnDialog>
  )
}
