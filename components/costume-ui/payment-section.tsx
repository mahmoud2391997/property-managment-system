import React, { useState, useEffect } from 'react'
import CollapsibleSection from './collapsible-section'
import InnerSection from './collapsible-inner-section'
import InputGroup from './input-group'
import Input from './input'
import Select from './select'
import { Checkbox } from '../ui/checkbox'
import ChargesSection from './charges-section'
import LateChargesSection from './late-charges-section'
import RadioGroup from './radio-group'
import { cn } from '@/lib/utils'
import DatePicker from './date-picker'
import TimePicker from './time-picker'
import UploadFile from './upload-file'

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

export type PaymentStatusData = {
  isPaid: boolean
  paymentMethod: string
  paymentDate: Date | undefined
  paymentTime: string
  receiptFile: File | null
}

export type DefaultPaymentConfig = {
  monthlyRent?: string
  paymentDay?: number
  initialCharges?: Array<{
    type: string
    amount: number
    is_taxed: boolean
    is_refundable: boolean
  }>
  lateCharges?: Array<{
    days_after_due: number
    amount: number
  }>
}

type Props = {
  onInitialChargesChange?: (charges: any[]) => void
  onMonthlyRentChange?: (rent: string) => void
  onPaymentDayChange?: (day: number) => void
  onLateChargesChange?: (charges: LateCharge[]) => void
  onPaymentStatusChange?: (data: PaymentStatusData) => void
  defaultPayment?: boolean
  defaultConfig?: DefaultPaymentConfig
  allowAllChargesRemovable?: boolean
  requiredFields?: boolean
}

const PaymentSection = ({
  onInitialChargesChange,
  onMonthlyRentChange,
  onPaymentDayChange,
  onLateChargesChange,
  onPaymentStatusChange,
  defaultPayment = false,
  defaultConfig,
  allowAllChargesRemovable = false,
  requiredFields=false
}: Props) => {
  const [monthlyRent, setMonthlyRent] = useState<string>(defaultConfig?.monthlyRent || '')
  const [selectedDay, setSelectedDay] = useState<number>(defaultConfig?.paymentDay || 1)
  const [configApplied, setConfigApplied] = useState(false)

  // Apply default config when it changes (after async load)
  React.useEffect(() => {
    if (defaultConfig && !configApplied) {
      if (defaultConfig.monthlyRent) {
        setMonthlyRent(defaultConfig.monthlyRent)
        onMonthlyRentChange?.(defaultConfig.monthlyRent)
      }
      if (defaultConfig.paymentDay) {
        setSelectedDay(defaultConfig.paymentDay)
        onPaymentDayChange?.(defaultConfig.paymentDay)
      }
      setConfigApplied(true)
    }
  }, [defaultConfig, configApplied, onMonthlyRentChange, onPaymentDayChange])

  const [isPaid, setIsPaid] = useState<boolean>(false)
  const [paymentMethod, setPaymentMethod] = useState<
    string | 'Cash' | 'Bank Transfer'
  >('Cash')
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(undefined)
  const [paymentTime, setPaymentTime] = useState<string>('10:30:00')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  const daysOfMonth: number[] = Array.from({ length: 28 }, (_, i) => i + 1)

  const handleMonthlyRentChange = (value: string) => {
    setMonthlyRent(value)
    onMonthlyRentChange?.(value)
  }

  const handlePaymentDayChange = (day: number) => {
    setSelectedDay(day)
    onPaymentDayChange?.(day)
  }

  // Notify parent when payment status changes
  const notifyPaymentStatusChange = (updates: Partial<PaymentStatusData>) => {
    const currentData: PaymentStatusData = {
      isPaid,
      paymentMethod,
      paymentDate,
      paymentTime,
      receiptFile,
      ...updates
    }
    onPaymentStatusChange?.(currentData)
  }

  return (
    <>
      <ChargesSection
        title='Initial Charges'
        subtitle='Set up one-time charges at lease signing'
        flowType='income'
        selectable={true}
        onChargesChange={onInitialChargesChange}
        defaultPayment={defaultPayment}
        defaultCharges={defaultConfig?.initialCharges}
        allowAllRemovable={allowAllChargesRemovable}
      />

      {/* Initial charges payment status and details */}
      {!defaultPayment && (
        <div className='flex flex-col gap-5'>
          <InputGroup label='Initial Charges Payment Status'>
            <RadioGroup
              defaultOption={1}
              options={['Paid', 'Not Paid']}
              onChange={(value: number) => {
                const newIsPaid = value === 0
                setIsPaid(newIsPaid)
                notifyPaymentStatusChange({ isPaid: newIsPaid })
              }}
            />
          </InputGroup>

          <div className={cn('flex')}>
            <InputGroup
              label='Payment Method'
              className={cn(isPaid ? 'max-w-full mr-3' : 'max-w-0! opacity-0')}
              isRequired
            >
              <Select
                items={['Cash', 'Bank Transfer']}
                value={paymentMethod}
                onChange={val => {
                  setPaymentMethod(val)
                  notifyPaymentStatusChange({ paymentMethod: val })
                }}
                label='Methods'
                placeholder='Select method'
                required
              />
            </InputGroup>
            <InputGroup
              label={`${isPaid ? '' : 'Due'} Payment Date`}
              className='mr-3'
              isRequired
            >
              <DatePicker
                value={paymentDate}
                onValueChange={val => {
                  setPaymentDate(val)
                  notifyPaymentStatusChange({ paymentDate: val })
                }}
              />
            </InputGroup>
            <InputGroup
              label={`${isPaid ? '' : 'Due'} Payment Time`}
              isRequired
            >
              <TimePicker
                value={paymentTime}
                onValueChange={val => {
                  setPaymentTime(val)
                  notifyPaymentStatusChange({ paymentTime: val })
                }}
                required
              />
            </InputGroup>
          </div>

          <div
            className={cn(
              'transition-all duration-200 ease-out overflow-hidden',
              isPaid && paymentMethod === 'Bank Transfer'
                ? receiptFile
                  ? 'h-19'
                  : 'h-49'
                : 'h-0 -mb-5 opacity-0'
            )}
          >
            <UploadFile
              onFileChange={file => {
                setReceiptFile(file)
                notifyPaymentStatusChange({ receiptFile: file })
              }}
            />
          </div>
        </div>
      )}

      <InnerSection>
        <InputGroup
          label='Subsequent Monthly Rental Payment'
          className='w-40 sm:w-75'
          isRequired={requiredFields}
        >
          <Input
            maxLength={20}
            currency
            value={monthlyRent}
            onValueChange={value => handleMonthlyRentChange(value || '')}
            required={requiredFields}
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

      <LateChargesSection
        onLateChargesChange={onLateChargesChange}
        defaultLateCharges={defaultConfig?.lateCharges}
      />
    </>
  )
}

export default PaymentSection