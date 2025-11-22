import { cn } from '@/lib/utils'
import React from 'react'
import CurrencyInput, {
  type CurrencyInputProps
} from 'react-currency-input-field'

type BaseProps = {
  className?: string
  note?: string
}

type NormalInputProps = BaseProps &
  React.ComponentProps<'input'> & { currency?: false }
type CurrencyInputOnlyProps = BaseProps &
  Partial<CurrencyInputProps> & { currency: true }

type Props = NormalInputProps | CurrencyInputOnlyProps
const Input = ({ className = '', note, currency = false, ...props }: Props) => {
  const styles = cn(
    'flex items-center',
    'bg-(--background-secondary) hover:bg-neutral-100 focus:hover:bg-neutral-50 focus:border-neutral-400  outline-none! border border-(--border-strong)',
    'placeholder:text-(--text-placeholder) disabled:opacity-60',
    'focus:placeholder:text-(--text-secondary)',
    'transition-colors duration-200',
    'texts-body-small shadows-xs',
    'w-full h-10 px-2.5',
    'rounded-[5]',
    className
  )

  if (currency) {
    return (
      <CurrencyInput
        id='price'
        name='price'
        placeholder='0.00'
        decimalsLimit={2}
        decimalScale={2}
        prefix='RM '
        className={styles}
        {...props}
      />
    )
  }
  return (
    <div className='flex flex-col gap-[5]'>
      <input className={styles} {...props} />
      {note && (
        <span className='ml-1 texts-caption-large text-(--text-secondary)'>
          {note}
        </span>
      )}
    </div>
  )
}

export default Input
