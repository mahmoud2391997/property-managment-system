import { useState } from 'react'
import CollapsibleSection from './collapsible-section'
import InnerSection from './collapsible-inner-section'
import InputGroup from './input-group'
import Input from './input'
import { cn } from '@/lib/utils'
import InputCard from './input-card'
import Select from './select'
import Button from './button'
import { Plus } from 'lucide-react'
import { Checkbox } from '../ui/checkbox'
import { chargeTypes } from '@/utils/data'
import ChargesSection from './charges-section'
import LateChargesSection from './late-charges-section'

// Sub component: CheckAddon
export const CheckAddon = ({
  label,
  checked,
  onCheckedChange
}: {
  label: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}) => {
  return (
    <>
      <div className='flex items-center gap-2.5 h-10'>
        <Checkbox
          className='h-5 w-5 border-(--border-strong) bg-(--background-primary)'
          checked={checked}
          onCheckedChange={onCheckedChange}
        />
        <span className='texts-body-medium'>{label}</span>
      </div>
    </>
  )
}

export type LateCharge = {
  days_after_due: number
  amount: string
}

type Props = {
  sectionNumber: number
  title?: string
  onInitialChargesChange?: (charges: any[]) => void
  onMonthlyRentChange?: (rent: string) => void
  onPaymentDayChange?: (day: number) => void
  onLateChargesChange?: (charges: LateCharge[]) => void
  defaultCollapse?: boolean
  defaultPayment?: boolean
}

const PaymentSection = ({
  sectionNumber,
  title = 'Payment Details',
  onInitialChargesChange,
  onMonthlyRentChange,
  onPaymentDayChange,
  onLateChargesChange,
  defaultCollapse = false,
  defaultPayment = false
}: Props) => {
  const [monthlyRent, setMonthlyRent] = useState<string>('')
  const [selectedDay, setSelectedDay] = useState<number>(1)

  const daysOfMonth: number[] = Array.from({ length: 28 }, (_, i) => i + 1)

  const handleMonthlyRentChange = (value: string) => {
    setMonthlyRent(value)
    onMonthlyRentChange?.(value)
  }

  const handlePaymentDayChange = (day: number) => {
    setSelectedDay(day)
    onPaymentDayChange?.(day)
  }

  return (
    <CollapsibleSection
      number={sectionNumber}
      title={title}
      defaultCollapse={defaultCollapse}
    >
      <ChargesSection
        title='Initial Charges'
        subtitle='Set up one-time charges at lease signing'
        flowType='income'
        selectable={true}
        onChargesChange={onInitialChargesChange}
        defaultPayment={defaultPayment}
      />
      <InnerSection>
        <InputGroup
          label='Subsequent Monthly Rental Payment'
          className='w-40 sm:w-75'
        >
          <Input
            maxLength={20}
            currency
            value={monthlyRent}
            onValueChange={value => handleMonthlyRentChange(value || '')}
          />
        </InputGroup>

        <InputGroup label='Payment Day' className='w-30'>
          <Select
            label='Day'
            placeholder='Select payment day'
            items={daysOfMonth.map(String)}
            value={String(selectedDay)}
            onValueChange={val => handlePaymentDayChange(Number(val))}
          />
        </InputGroup>
      </InnerSection>

      <LateChargesSection onLateChargesChange={onLateChargesChange} />
    </CollapsibleSection>
  )
}

export default PaymentSection
