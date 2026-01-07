import { useState, useEffect } from 'react'
import InnerSection from './collapsible-inner-section'
import RadioGroup from './radio-group'
import Input from './input'
import Select from './select'
import { cn } from '@/lib/utils'
import InputGroup from './input-group'
import Toggle from './toggle'
import { Info } from 'lucide-react'

// Sub component: unit
const Unit = ({
  value,
  isSelected,
  onSelect,
  canDeselect = true
}: {
  value: string
  isSelected: boolean
  onSelect?: (value: string, isSelected: boolean) => void
  canDeselect?: boolean
}) => {
  return (
    <button
      type="button"
      onClick={() => {
        // If already selected and cannot deselect, do nothing
        if (isSelected && !canDeselect) {
          return
        }
        const next = !isSelected
        onSelect?.(value, next)
      }}
      className={cn(
        'flex items-center justify-center',
        'h-9.5 w-9.5',
        'transition-colors duration-100',
        isSelected
          ? 'bg-(--secondary-color)! text-(--text-inverse)!'
          : 'border border-(--border-default) hover:bg-neutral-100',
        'texts-body-medium',
        'select-none cursor-pointer rounded-full',
        isSelected && !canDeselect && 'cursor-not-allowed opacity-75'
      )}
    >
      {value}
    </button>
  )
}

export interface RecurringConfigData {
  enabled: boolean
  title: string
  is_payment_fixed: boolean
}

interface RecurringConfigProps {
  onConfigChange?: (config: RecurringConfigData | null) => void
  defaultIsPaymentFixed?: boolean
}

const RecurringConfig = ({ onConfigChange, defaultIsPaymentFixed = false }: RecurringConfigProps) => {
  const options: string[] = ['Enable', 'Disable']
  const [disableRecurring, setDisableRecurring] = useState<boolean>(true)
  const [title, setTitle] = useState<string>('')
  const [isPaymentFixed, setIsPaymentFixed] = useState<boolean>(defaultIsPaymentFixed)

  // Update isPaymentFixed when defaultIsPaymentFixed prop changes
  useEffect(() => {
    setIsPaymentFixed(defaultIsPaymentFixed)
  }, [defaultIsPaymentFixed])

  // Notify parent when config changes
  useEffect(() => {
    if (disableRecurring) {
      onConfigChange?.(null)
    } else {
      onConfigChange?.({
        enabled: true,
        title,
        is_payment_fixed: isPaymentFixed
      })
    }
  }, [disableRecurring, title, isPaymentFixed, onConfigChange])
  return (
    <InnerSection
      title='Recurring Payment'
      subtitle='Configure payments that recur monthly with rental payments'
    >
      <RadioGroup
        defaultOption={1}
        options={options}
        onChange={(value: number) => {
          if (value === 1) {
            setDisableRecurring(true)
          } else {
            setDisableRecurring(false)
          }
        }}
      />

      <div
        className={cn(
          'flex flex-col gap-5',
          'transition-all duration-200 overflow-hidden',
          disableRecurring ? 'max-h-0 opacity-0' : `opacity-100`
        )}
      >
        <InputGroup label='Event Title' className='w-100' isRequired>
          <Input
            type='text'
            value={title}
            placeholder='e.g. Internet, WiFi, Cleaning Service'
            note='Name for this recurring charge (e.g., Internet, Cleaning). This payment will be generated monthly on the same day as the rental payment.'
            maxLength={50}
            required={!disableRecurring}
            onChange={(e) => setTitle(e.target.value)}
          />
        </InputGroup>

        {/* Fixed Payment Toggle */}
        <div className='flex flex-col gap-2'>
          <Toggle
            checked={isPaymentFixed}
            onChange={setIsPaymentFixed}
            label='Fixed Payment Amount'
            subtitle={isPaymentFixed
              ? 'Same amount will be used for each monthly charge'
              : 'Amount can be manually set for each generated payment'
            }
          />
          <div className='flex items-start gap-2 p-2 rounded-md bg-amber-50 border border-amber-200'>
            <Info strokeWidth={1.5} size={16} className='mt-0.5 shrink-0 text-amber-700' />
            <p className='texts-caption-large text-amber-800'>
              {isPaymentFixed
                ? 'When a recurring payment is marked as paid, a new payment will automatically be generated for the next month using the same amount and due on the lease\'s rental payment day.'
                : 'When a recurring payment is marked as paid, a new payment will be generated for the next month with pending status. Staff must manually set the amount before sending it to the tenant.'
              }
            </p>
          </div>
        </div>
      </div>
    </InnerSection>
  )
}

export default RecurringConfig
