'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react'
import { Textarea } from '../ui/textarea'
import { cn } from '@/lib/utils'

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string
}

const TextArea = forwardRef<HTMLTextAreaElement, Props>(
  ({ className, ...props }, ref) => {
    return (
      <Textarea
        ref={ref}
        className={cn(
          'flex items-center',
          'bg-(--background-secondary) border border-(--border-strong)',
          'placeholder:text-(--text-placeholder) disabled:opacity-60',
          'focus:placeholder:text-(--text-secondary) hover:bg-neutral-100 focus:hover:bg-neutral-50',
          'transition-colors duration-200',
          'texts-body-small shadows-xs',
          'w-full p-2.5',
          'rounded-[5]',
          className
        )}
        {...props}
      />
    )
  }
)

TextArea.displayName = 'TextArea'

export default TextArea
