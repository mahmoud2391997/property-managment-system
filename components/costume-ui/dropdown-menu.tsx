import React from 'react'
import {
  DropdownMenu as ShadcnDropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '../ui/button'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
    label?: string
    children: React.ReactNode
    className?: string
}

const DropdownMenu = ({ label, children, className = ''}: Props) => {
  return (
    <ShadcnDropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='h-8 w-8 p-0'>
          <span className='sr-only'>Open menu</span>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className={cn('w-40!', className)} align='end'>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        {children}
      </DropdownMenuContent>
    </ShadcnDropdownMenu>
  )
}

export default DropdownMenu
