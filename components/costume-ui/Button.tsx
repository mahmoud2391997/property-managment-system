'use client'

import { cn } from '@/lib/utils'
import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

type Props = {
  variant?: 'primary' | 'secondary' | 'info'
  className?: string
  labelStyles?: string
  icon?: React.ReactNode
  label?: string
  isResponsive?: boolean
  loading?: boolean
} & Omit<React.ComponentProps<'button'>, 'is'>

const buttonStyles = cva(
  [
    'h-10 w-fit px-3',
    'transition-colors transition-opacity duration-100 active:duration-0',
    'flex items-center justify-center gap-1.5 lg:gap-2.5',
    'rounded-md cursor-pointer'
  ],
  {
    variants: {
      variant: {
        primary: cn(
          'bg-(--primary-color)',
          'shadows-sm',
          'hover:opacity-90 active:opacity-80',
          'disabled:hover:opacity-70! disabled:active:opacity-70!'
        ),
        secondary: cn(
          'bg-(--background-primary)! border border-(--border-strong)!',
          'shadows-xs',
          'hover:bg-neutral-50! active:bg-neutral-100!',
          'disabled:hover:bg-(--background-primary)! disabled:active:bg-(--background-primary)!'
        ),
        info: cn(
          'bg-blue-600',
          'shadows-sm',
          'hover:bg-blue-700 active:bg-blue-800',
          'disabled:hover:bg-blue-600! disabled:active:bg-blue-600!'
        )
      }
    },
    defaultVariants: {
      variant: 'primary'
    }
  }
)

const labelStylesCVA = cva('', {
  variants: {
    variant: {
      primary: 'texts-button-primary text-(--text-inverse)',
      secondary: 'texts-button-primary text-(--text-primary)',
      info: 'texts-button-primary text-white'
    }
  }
})

const Button = ({
  className = '',
  labelStyles = '',
  icon,
  label,
  variant = 'primary',
  isResponsive = true,
  loading = false,
  ...props
}: Props) => {
  return (
    <button
      className={cn(
        buttonStyles({ variant }),
        'disabled:opacity-70 disabled:cursor-not-allowed',
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {icon && (
        <div className='w-5 h-auto p-0.5 flex items-center justify-center'>
          {icon}
        </div>
      )}
      {label && (
        <span className={cn(labelStylesCVA({ variant }), labelStyles)}>
          {isResponsive ? (
            <>
              <span className='hidden lg:inline'>{label}</span>
              <span className='inline lg:hidden'>{label.split(' ')[0]}</span>
            </>
          ) : (
            <span>{label}</span>
          )}
        </span>
      )}
    </button>
  )
}

export default Button
