'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface AlertProps {
  open: boolean
  onClose: () => void
  title?: string
  message: string
  type?: 'info' | 'error' | 'success' | 'warning'
}

export default function Alert({ open, onClose, title, message, type = 'info' }: AlertProps) {
  const getTitle = () => {
    if (title) return title
    switch (type) {
      case 'error':
        return 'Error'
      case 'success':
        return 'Success'
      case 'warning':
        return 'Warning'
      default:
        return 'Information'
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>OK</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
