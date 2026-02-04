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
import { Info } from 'lucide-react'
import DatePicker from './date-picker'
import TimePicker from './time-picker'
import UploadFile from './upload-file'
import MonthPicker from './month-picker'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

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
  showLateCharges?: boolean
  chargesSubtitle?: string
  chargesFlowType?: 'income' | 'outcome'
  monthlyRentLabel?: string
  paymentStatusLabel?: string
  leadDays?: number
  onLeadDaysChange?: (days: number) => void
  billingCycleStartMonth?: Date
  onBillingCycleStartMonthChange?: (value: Date) => void
  frequency?: number
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
  requiredFields = false,
  showLateCharges = true,
  chargesSubtitle = 'Set up one-time charges at lease signing',
  chargesFlowType = 'income',
  monthlyRentLabel = 'Subsequent Monthly Rental Payment',
  paymentStatusLabel = 'Initial Charges Payment Status',
  leadDays,
  onLeadDaysChange,
  billingCycleStartMonth,
  onBillingCycleStartMonthChange,
  frequency
}: Props) => {
  const [monthlyRent, setMonthlyRent] = useState<string>(defaultConfig?.monthlyRent || '')
  const [selectedDay, setSelectedDay] = useState<number>(defaultConfig?.paymentDay || 1)
  const [configApplied, setConfigApplied] = useState(false)

  const bcYear = billingCycleStartMonth?.getFullYear() ?? new Date().getFullYear()
  const bcMonth = billingCycleStartMonth ? billingCycleStartMonth.getMonth() + 1 : new Date().getMonth() + 1

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
        subtitle={chargesSubtitle}
        flowType={chargesFlowType}
        selectable={true}
        onChargesChange={onInitialChargesChange}
        defaultPayment={defaultPayment}
        defaultCharges={defaultConfig?.initialCharges}
        allowAllRemovable={allowAllChargesRemovable}
      />

      {/* Initial charges payment status and details */}
      {!defaultPayment && (
        <div className='flex flex-col gap-5'>
          <InputGroup label={paymentStatusLabel}>
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
        {onBillingCycleStartMonthChange ? (
          <div className='inputs-container'>
            <InputGroup
              label={monthlyRentLabel}
              className='flex-1'
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
            <InputGroup label='Billing Cycle Start' className='flex-1'>
              <MonthPicker
                value={billingCycleStartMonth}
                onValueChange={val => {
                  if (val) onBillingCycleStartMonthChange(val)
                }}
              />
            </InputGroup>
          </div>
        ) : (
          <InputGroup
            label={monthlyRentLabel}
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
        )}

        <div className='inputs-container'>
          <InputGroup label='Payment Day' className={onLeadDaysChange ? 'flex-1' : 'w-30'}>
            <Select
              label='Day'
              placeholder='Select payment day'
              items={daysOfMonth.map(String)}
              value={String(selectedDay)}
              onValueChange={val => handlePaymentDayChange(Number(val))}
            />
          </InputGroup>

          {onLeadDaysChange && (
            <InputGroup label='Rental Lead Days' className='flex-1'>
              <Input
                type='number'
                min={0}
                placeholder='e.g. 7'
                value={leadDays ?? 7}
                onChange={e => {
                  const val = Number(e.target.value)
                  onLeadDaysChange(val >= 0 ? val : 0)
                }}
              />
            </InputGroup>
          )}
        </div>

        {onBillingCycleStartMonthChange && billingCycleStartMonth ? (
          <div className='p-3 rounded-md bg-blue-50 border border-blue-200 w-full'>
            <div className='flex items-start gap-2 text-sm text-blue-800'>
              <Info strokeWidth={1.5} size={18} className='mt-0.5 shrink-0' />
              <div className='flex flex-col gap-1'>
                <p>
                  <span className='font-medium'>Billing cycle:</span>{' '}
                  {frequency === 1 ? (
                    <>Every month starting from <span className='font-medium'>{MONTH_NAMES[(bcMonth - 1) % 12]} {bcYear}</span>.</>
                  ) : (
                    <>Every <span className='font-medium'>{frequency}</span> months starting from{' '}
                      <span className='font-medium'>{MONTH_NAMES[(bcMonth - 1) % 12]} {bcYear}</span>{' '}
                      ({Array.from(
                        { length: Math.floor(12 / (frequency || 1)) },
                        (_, i) => MONTH_NAMES[((bcMonth - 1 + i * (frequency || 1)) % 12)]
                      ).join(', ')}).
                    </>
                  )}
                </p>
                <p>
                  <span className='font-medium'>Payment day:</span> Day{' '}
                  <span className='font-medium'>{selectedDay}</span> of each billing month.
                </p>
                {leadDays !== undefined && leadDays > 0 ? (
                  <p>
                    <span className='font-medium'>Expense generation:</span> Rental expense is created{' '}
                    <span className='font-medium'>{leadDays} day{leadDays !== 1 ? 's' : ''}</span> before payment day.
                  </p>
                ) : leadDays !== undefined && (
                  <p>
                    <span className='font-medium'>Expense generation:</span> Rental expense is created on payment day
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : onLeadDaysChange && leadDays !== undefined && (
          <div className='p-3 rounded-md bg-blue-50 border border-blue-200 w-full'>
            <div className='flex items-start gap-2 text-sm text-blue-800'>
              <Info strokeWidth={1.5} size={18} className='mt-0.5 shrink-0' />
              <p>
                Payment is due on day <span className='font-medium'>{selectedDay}</span> of each billing cycle.
                {leadDays > 0 ? (
                  <> The rental expense will be generated <span className='font-medium'>{leadDays} day{leadDays !== 1 ? 's' : ''}</span> before.</>
                ) : (
                  <> The rental expense will be generated on the same day.</>
                )}
              </p>
            </div>
          </div>
        )}
      </InnerSection>

      {showLateCharges && (
        <LateChargesSection
          onLateChargesChange={onLateChargesChange}
          defaultLateCharges={defaultConfig?.lateCharges}
        />
      )}
    </>
  )
}

export default PaymentSection