import { cn } from '@/lib/utils'
import React from 'react'

type Props = {
  children: React.ReactNode
  label?: string
  className?: string
  isRequired?: boolean
}
const InputGroup = ({
  children,
  label,
  className = '',
  isRequired = false
}: Props) => {
  return (
    <div className={cn('grid gap-2 w-full', 'transition-all duration-300', className)}>
      {label && (
        <div className='texts-label-large'>
          <span className='transition-all duration-300'>{label}</span>
          {isRequired && <span className='ml-1 text-(--error-dark)'>*</span>}
        </div>
      )}
      {children}
    </div>
  )
}

export default InputGroup
