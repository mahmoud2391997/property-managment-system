'use client'

import { Info } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface InfoPopoverProps {
  title: string
  description: string
}

export function InfoPopover({ title, description }: InfoPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="inline-flex items-center justify-center w-4 h-4 rounded-full text-(--text-muted) hover:text-(--text-secondary) transition-colors cursor-help ml-1">
          <Info className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-72 p-3">
        <p className="texts-label-small text-(--text-primary) font-medium mb-1">{title}</p>
        <p className="texts-caption-large text-(--text-secondary) leading-relaxed">{description}</p>
      </PopoverContent>
    </Popover>
  )
}
