import { cn } from '@/lib/utils'
import React from 'react'
import CurrencyInput, {
  type CurrencyInputProps
} from 'react-currency-input-field'
import { PhoneInput, type PhoneInputProps } from 'react-international-phone'
import 'react-international-phone/style.css'

type BaseProps = {
  className?: string
  note?: string
}

type NormalInputProps = BaseProps &
  React.ComponentProps<'input'> & { currency?: false; phoneNumber?: false }
type CurrencyInputOnlyProps = BaseProps &
  Omit<CurrencyInputProps, 'className'> & {
    currency: true
    phoneNumber?: false
  }
type PhoneInputOnlyProps = BaseProps &
  Omit<PhoneInputProps, 'className'> & {
    phoneNumber: true
    currency?: false
  }

type Props = NormalInputProps | CurrencyInputOnlyProps | PhoneInputOnlyProps

const Input = (props: Props) => {
  const { className = '', note, currency = false, phoneNumber = false } = props

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
    const { className: _, note: __, currency: ___, phoneNumber: ____, required, ...currencyProps } = props as CurrencyInputOnlyProps
    return (
      <div className='flex flex-col gap-[5]'>
        <CurrencyInput
          placeholder='0.00'
          decimalsLimit={2}
          decimalScale={2}
          prefix='RM '
          className={styles}
          required={required}
          {...currencyProps}
        />
        {note && (
          <span className='ml-1 texts-caption-large text-(--text-secondary)'>
            {note}
          </span>
        )}
      </div>
    )
  }

  if (phoneNumber) {
    const { className: _, note: __, phoneNumber: ___, currency: ____, ...phoneProps } = props as PhoneInputOnlyProps
    return (
      <div className='flex flex-col gap-[5]'>
        <PhoneInput
          defaultCountry='my'
          placeholder='Enter phone number'
          inputClassName={styles}
          style={{ '--react-international-phone-height': '40px' } as React.CSSProperties}
          countrySelectorStyleProps={{
            buttonClassName: cn(
              'bg-(--background-secondary) hover:bg-neutral-100 border border-(--border-strong)',
              'h-10 w-12 rounded-l-[5]',
              'transition-colors duration-200'
            ),
          }}
          {...phoneProps}
        />
        {note && (
          <span className='ml-1 texts-caption-large text-(--text-secondary)'>
            {note}
          </span>
        )}
      </div>
    )
  }

  const { className: _, note: __, currency: ___, phoneNumber: ____, ...inputProps } = props as NormalInputProps
  return (
    <div className='flex flex-col gap-[5]'>
      <input className={styles} {...inputProps} />
      {note && (
        <span className='ml-1 texts-caption-large text-(--text-secondary)'>
          {note}
        </span>
      )}
    </div>
  )
}

export default Input
