'use client'

import AddPageHead from '@/components/costume-ui/add-page-head'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import InnerSection from '@/components/costume-ui/collapsible-inner-section'
import InputGroup from '@/components/costume-ui/input-group'
import DatePicker from '@/components/costume-ui/date-picker'
import Input from '@/components/costume-ui/input'
import Combobox from '@/components/costume-ui/combobox'
import PaymentSection, { PaymentStatusData } from '@/components/costume-ui/payment-section'
import ReminderSection from '@/components/costume-ui/reminder-section'
import CollapsibleSection from '@/components/costume-ui/collapsible-section'
import { ComboBoxitemsType } from '@/types'
import { ChargeData } from '@/components/costume-ui/charges-section'
import { contractChargeTypes } from '@/utils/data'
import Alert from '@/components/costume-ui/alert'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { Check, Info, X } from 'lucide-react'
import { formatDate, formatDateForAPI } from '@/utils/formatTime'
import { cn } from '@/lib/utils'
import { PermissionGuard } from '@/components/permission-guard'

const FREQUENCY_PRESETS = [
  { value: 1, label: 'Monthly', subtitle: 'Every month' },
  { value: 3, label: 'Quarterly', subtitle: 'Every 3 months' },
  { value: 6, label: 'Semi-Annual', subtitle: 'Every 6 months' },
  { value: 12, label: 'Annual', subtitle: 'Every 12 months' }
]

const calculateEndDate = (startDate: Date, numberOfMonths: number): Date => {
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + numberOfMonths)
  return endDate
}

const CONTRACT_REMINDER_LABELS = {
  subtitle: 'Set up automated reminders to keep track of key contract dates',
  expiryLabel: 'Contract expiry',
  expiryDaysLabel: 'Contract expiry reminder days before',
  rentReminderLabel: 'Rent payment reminder',
  rentDaysLabel: 'Rent payment reminder days before',
  overdueLabel: 'Overdue rent payment reminder',
  overdueDaysLabel: 'Overdue rent reminder days after'
}

const AddContract = () => {
  const { id: propertyId } = useParams<{ id: string }>()
  const [propertyCode, setPropertyCode] = useState<string | null>(null)
  const [isPropertyCodeLoading, setIsPropertyCodeLoading] = useState<boolean>(true)

  // Owner state
  const [ownerItems, setOwnerItems] = useState<ComboBoxitemsType[]>([])
  const [loadingOwners, setLoadingOwners] = useState<boolean>(true)
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null)
  const [assignedOwner, setAssignedOwner] = useState<{
    id: string
    name: string
    profile_thumb: string | null
  } | null>(null)

  // Contract details state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [contractDuration, setContractDuration] = useState<number | null>(null)
  const contractHasDuration = contractDuration !== null && contractDuration > 0
  const [frequency, setFrequency] = useState<number>(1)
  const [isCustomFrequency, setIsCustomFrequency] = useState(false)
  const [customFrequencyInput, setCustomFrequencyInput] = useState<string>('')
  const [leadDays, setLeadDays] = useState<number>(7)
  const [billingCycleStartMonth, setBillingCycleStartMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )

  // Payment details state
  const [monthlyRent, setMonthlyRent] = useState<string>('')
  const [paymentDay, setPaymentDay] = useState<number>(1)
  const [initialCharges, setInitialCharges] = useState<ChargeData[]>([])

  // Payment status state
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusData>({
    isPaid: false,
    paymentMethod: 'Cash',
    paymentDate: undefined,
    paymentTime: '10:30:00',
    receiptFile: null
  })

  // Reminders state
  const [contractExpiryReminder, setContractExpiryReminder] = useState<{
    enabled: boolean
    days: string
  }>({ enabled: false, days: '' })
  const [rentReminder, setRentReminder] = useState<{
    enabled: boolean
    days: string
  }>({ enabled: false, days: '' })
  const [overdueReminder, setOverdueReminder] = useState<{
    enabled: boolean
    days: string
  }>({ enabled: false, days: '' })

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Alert state
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState<
    'info' | 'error' | 'success' | 'warning'
  >('info')

  const showAlert = (
    message: string,
    type: 'info' | 'error' | 'success' | 'warning' = 'info'
  ) => {
    setAlertMessage(message)
    setAlertType(type)
    setAlertOpen(true)
  }

  // Fetch property code
  useEffect(() => {
    const fetchPropertyCode = async () => {
      setIsPropertyCodeLoading(true)
      try {
        const response = await fetch(`/api/leases/${propertyId}/property-code`)
        if (response.ok) {
          const data = await response.json()
          setPropertyCode(data.property)
          if (data.assignedOwner) {
            setAssignedOwner(data.assignedOwner)
            setSelectedOwnerId(data.assignedOwner.id)
          }
        }
      } catch (error) {
        console.error('Error fetching property code:', error)
      } finally {
        setIsPropertyCodeLoading(false)
      }
    }

    fetchPropertyCode()
  }, [propertyId])

  // Fetch owners for organization
  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const response = await fetch('/api/contracts/owners')
        if (response.ok) {
          const data = await response.json()
          setOwnerItems(data.owners)
        }
      } catch (error) {
        console.error('Error fetching owners:', error)
      } finally {
        setLoadingOwners(false)
      }
    }

    fetchOwners()
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { isPaid, paymentMethod, paymentDate, paymentTime, receiptFile } = paymentStatus

    // Validation
    if (!startDate) {
      showAlert('Please select a start date', 'warning')
      return
    }

    if (!selectedOwnerId) {
      showAlert('Please select an owner', 'warning')
      return
    }

    if (initialCharges.length === 0) {
      showAlert('Please add at least one initial charge', 'warning')
      return
    }

    if (!paymentDate) {
      showAlert('Please select a payment date', 'warning')
      return
    }

    // Validate payment date is not in the future (only for paid expenses)
    if (isPaid) {
      const paymentDateTime = new Date(
        `${formatDateForAPI(paymentDate)}T${paymentTime}`
      )
      const now = new Date()
      if (paymentDateTime > now) {
        showAlert('Payment date and time cannot be in the future', 'error')
        return
      }
    }

    if (isPaid && !paymentMethod) {
      showAlert('Please select a payment method', 'warning')
      return
    }

    if (isPaid && paymentMethod === 'Bank Transfer' && !receiptFile) {
      showAlert('Please upload a receipt for bank transfer', 'warning')
      return
    }

    // Validate reminders
    if (contractExpiryReminder.enabled && !contractExpiryReminder.days) {
      showAlert('Please specify days for contract expiry reminder', 'warning')
      return
    }

    if (rentReminder.enabled && !rentReminder.days) {
      showAlert('Please specify days for rent reminder', 'warning')
      return
    }

    if (overdueReminder.enabled && !overdueReminder.days) {
      showAlert('Please specify days for overdue reminder', 'warning')
      return
    }

    setIsSubmitting(true)

    try {
      // Upload receipt if needed
      let receiptUrl = null
      if (receiptFile && isPaid && paymentMethod === 'Bank Transfer') {
        const formData = new FormData()
        formData.append('file', receiptFile)
        formData.append('bucket', 'receipts')

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (uploadRes.ok) {
          const { url } = await uploadRes.json()
          receiptUrl = url
        }
      }

      // Format dates for API
      const formattedStartDate = formatDateForAPI(startDate)
      const formattedPaymentDate = formatDateForAPI(paymentDate)

      // Create contract
      const response = await fetch('/api/contracts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          property_id: propertyId,
          owner_id: selectedOwnerId,
          start_date: formattedStartDate,
          number_of_months: contractDuration,
          frequency,
          lead_days: leadDays,
          billing_cycle_start_month: `${billingCycleStartMonth.getFullYear()}-${String(billingCycleStartMonth.getMonth() + 1).padStart(2, '0')}-05`,
          payment_day: paymentDay,
          monthly_rent: parseFloat(monthlyRent) || 0,
          // Reminders
          is_expiry_reminder: contractExpiryReminder.enabled,
          expiry_days_before_reminder: contractExpiryReminder.enabled
            ? parseInt(contractExpiryReminder.days)
            : null,
          is_rent_reminder: rentReminder.enabled,
          rent_reminder_days_before: rentReminder.enabled
            ? parseInt(rentReminder.days)
            : null,
          is_overdue_rent_reminder: overdueReminder.enabled,
          overdue_days_after_reminder: overdueReminder.enabled
            ? parseInt(overdueReminder.days)
            : null,
          // Initial charges (expense)
          initial_charges: initialCharges,
          is_paid: isPaid,
          payment_method: paymentMethod,
          payment_date: formattedPaymentDate,
          payment_time: paymentTime,
          receipt_image: receiptUrl,
          timezone_offset: new Date().getTimezoneOffset()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create contract')
      }

      await response.json()
      FeedbackToasts.created('Contract')
      setTimeout(() => {
        window.location.href = `/properties/${propertyId}/contracts`
      }, 1500)
    } catch (error: any) {
      console.error('Error creating contract:', error)
      FeedbackToasts.createFailed('contract', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PermissionGuard permission='contracts.create'>
      <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
        {/* Head section */}
        <AddPageHead
          crumb_items={[
            { label: 'Properties', href: '/properties' },
            { label: propertyCode, href: `/properties/${propertyId}/contracts` },
            { label: 'Add Contract' }
          ]}
          isCrumbLoading={isPropertyCodeLoading}
          title='Add a contract'
          subtitle='Provide contract details and terms'
          className='mb-7.5'
          isSubmitting={isSubmitting}
        />

      <CollapsibleSection number={1} title={'Contract & Expense Details'}>
        {/* Contract Details */}
        <InnerSection title='Contract Details' subtitle='Enter the contract details'>
          <div>
            <div className='inputs-container'>
              <InputGroup label='Start Date' isRequired>
                <DatePicker
                  value={startDate}
                  onValueChange={setStartDate}
                />
              </InputGroup>
              <InputGroup label='Contract Duration (Months)'>
                <Input
                  type='number'
                  min={1}
                  placeholder='Enter contract duration in months'
                  value={contractDuration ?? ''}
                  onChange={e => {
                    const value = e.target.value
                    setContractDuration(value === '' ? null : Number(value))
                  }}
                />
              </InputGroup>
            </div>
            {/* Contract Duration Info Note */}
            {startDate && (
              <div className='mt-4 p-3 rounded-md bg-blue-50 border border-blue-200'>
                <div className='flex items-start gap-2 text-sm text-blue-800'>
                  <Info strokeWidth={1.5} size={18} className='mt-0.5 shrink-0' />
                  <div className='flex flex-col gap-1'>
                    {contractHasDuration ? (
                      <>
                        <p>
                          <span className='font-medium'>Contract period:</span>{' '}
                          {formatDate(startDate)} to{' '}
                          {formatDate(calculateEndDate(startDate, contractDuration!))}
                        </p>
                        <p>
                          <span className='font-medium'>Rental expenses:</span>{' '}
                          First rental expense is generated immediately. Subsequent expenses are issued every {frequency} month{frequency !== 1 ? 's' : ''} following the payment day set below.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          <span className='font-medium'>Contract period:</span>{' '}
                          Starts {formatDate(startDate)} with no expiry date (ongoing contract).
                        </p>
                        <p>
                          <span className='font-medium'>Rental expenses:</span>{' '}
                          First rental expense is generated immediately. Subsequent expenses are issued every {frequency} month{frequency !== 1 ? 's' : ''} following the payment day set below.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className='inputs-container'>
            <InputGroup label='Owner' isRequired>
              <div className='relative'>
                <Combobox
                  items={ownerItems}
                  searchPlaceholder='Search owners'
                  variant='single'
                  placeholder={
                    loadingOwners ? 'Loading owners...' : 'Select owner'
                  }
                  showAvatar
                  isLoading={loadingOwners}
                  loadingMessage='Fetching owners...'
                  value={selectedOwnerId || undefined}
                  onValueChange={value => setSelectedOwnerId(value || null)}
                  required
                />
                {selectedOwnerId && (
                  <button
                    type='button'
                    onClick={() => setSelectedOwnerId(null)}
                    className='absolute right-9 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-neutral-100 transition-colors'
                    title='Clear owner selection'
                  >
                    <X size={14} className='text-neutral-500' />
                  </button>
                )}
              </div>
            </InputGroup>
          </div>
          {/* Owner assignment note */}
          {assignedOwner && selectedOwnerId === assignedOwner.id ? (
            <div className='p-3 rounded-md bg-blue-50 border border-blue-200'>
              <div className='flex items-start gap-2 text-sm text-blue-800'>
                <Info strokeWidth={1.5} size={18} className='mt-0.5 shrink-0' />
                <p>This property is assigned to <span className='font-medium'>{assignedOwner.name}</span>.</p>
              </div>
            </div>
          ) : selectedOwnerId && selectedOwnerId !== assignedOwner?.id ? (
            <div className='p-3 rounded-md bg-amber-50 border border-amber-200'>
              <div className='flex items-start gap-2 text-sm text-amber-800'>
                <Info strokeWidth={1.5} size={18} className='mt-0.5 shrink-0' />
                <p>The selected owner will be assigned to this property{assignedOwner ? `, replacing ${assignedOwner.name}` : ''}.</p>
              </div>
            </div>
          ) : null}

          {/* Billing Frequency */}
          <InputGroup label='Billing Frequency'>
            <div className='flex flex-col gap-3'>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5'>
                {FREQUENCY_PRESETS.map(preset => {
                  const isSelected = !isCustomFrequency && frequency === preset.value
                  return (
                    <button
                      key={preset.value}
                      type='button'
                      onClick={() => {
                        setFrequency(preset.value)
                        setIsCustomFrequency(false)
                        setCustomFrequencyInput('')
                      }}
                      className={cn(
                        'relative flex flex-col items-center justify-center gap-0.5',
                        'px-3 py-4 border rounded-lg',
                        'transition-colors duration-200 cursor-pointer',
                        isSelected
                          ? 'bg-(--secondary-color)/4 border-(--secondary-color)'
                          : 'border-(--border-strong) hover:bg-neutral-50 hover:border-neutral-400'
                      )}
                    >
                      {isSelected && (
                        <div className='absolute top-2 right-2'>
                          <Check size={14} className='text-(--secondary-color)' />
                        </div>
                      )}
                      <span className={cn(
                        'texts-body-medium-medium',
                        isSelected && 'text-(--secondary-color)'
                      )}>
                        {preset.label}
                      </span>
                      <span className={cn(
                        'texts-body-small text-(--text-secondary)',
                        isSelected && 'text-(--secondary-color)/70'
                      )}>
                        {preset.subtitle}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Custom frequency */}
              <button
                type='button'
                onClick={() => {
                  setIsCustomFrequency(true)
                  setFrequency(customFrequencyInput ? Number(customFrequencyInput) : 1)
                }}
                className={cn(
                  'flex items-center gap-3',
                  'px-4 py-3 border rounded-lg',
                  'transition-colors duration-200 cursor-pointer',
                  isCustomFrequency
                    ? 'bg-(--secondary-color)/4 border-(--secondary-color)'
                    : 'border-(--border-strong) hover:bg-neutral-50 hover:border-neutral-400'
                )}
              >
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                  isCustomFrequency
                    ? 'border-(--secondary-color)'
                    : 'border-neutral-300'
                )}>
                  {isCustomFrequency && (
                    <div className='w-2 h-2 rounded-full bg-(--secondary-color)' />
                  )}
                </div>
                <span className={cn(
                  'texts-body-medium',
                  isCustomFrequency && 'text-(--secondary-color)'
                )}>
                  Custom:
                </span>
                <input
                  type='number'
                  min={1}
                  placeholder='e.g. 2'
                  value={customFrequencyInput}
                  onClick={e => {
                    e.stopPropagation()
                    setIsCustomFrequency(true)
                  }}
                  onChange={e => {
                    const val = e.target.value
                    setCustomFrequencyInput(val)
                    setIsCustomFrequency(true)
                    if (val && Number(val) >= 1) {
                      setFrequency(Number(val))
                    }
                  }}
                  className={cn(
                    'w-20 px-2.5 py-1.5 text-center border rounded-md',
                    'texts-body-medium outline-none',
                    'bg-white',
                    isCustomFrequency
                      ? 'border-(--secondary-color)/40'
                      : 'border-(--border-strong)'
                  )}
                />
                <span className={cn(
                  'texts-body-medium text-(--text-secondary)',
                  isCustomFrequency && 'text-(--secondary-color)/70'
                )}>
                  months
                </span>
              </button>

              {/* Summary text */}
              <p className='texts-body-small text-(--text-secondary)'>
                Rent will be issued every <span className='font-medium text-(--text-primary)'>{frequency}</span> month{frequency !== 1 ? 's' : ''}
              </p>
            </div>
          </InputGroup>

        </InnerSection>
        {/* Expense details */}
        <PaymentSection
          onInitialChargesChange={setInitialCharges}
          onMonthlyRentChange={setMonthlyRent}
          onPaymentDayChange={setPaymentDay}
          onPaymentStatusChange={setPaymentStatus}
          requiredFields={true}
          showLateCharges={false}
          chargesSubtitle='Set up one-time charges at contract signing'
          chargesFlowType='outcome'
          customChargeTypes={contractChargeTypes}
          showRefundable={true}
          monthlyRentLabel='Monthly Rental Expense'
          paymentStatusLabel='Initial Charges Expense Status'
          leadDays={leadDays}
          onLeadDaysChange={setLeadDays}
          billingCycleStartMonth={billingCycleStartMonth}
          onBillingCycleStartMonthChange={setBillingCycleStartMonth}
          frequency={frequency}
        />
      </CollapsibleSection>

      {/* Reminders details */}
      <ReminderSection
        sectionNumber={2}
        title='Contract Reminders (Optional)'
        defaultCollapse
        onLeaseExpiryChange={(enabled, days) =>
          setContractExpiryReminder({ enabled, days })
        }
        onRentReminderChange={(enabled, days) =>
          setRentReminder({ enabled, days })
        }
        onOverdueReminderChange={(enabled, days) =>
          setOverdueReminder({ enabled, days })
        }
        labels={CONTRACT_REMINDER_LABELS}
      />

      {/* Alert Dialog */}
      <Alert
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
        type={alertType}
      />
      </form>
    </PermissionGuard>
  )
}

export default AddContract
