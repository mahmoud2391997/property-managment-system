'use client'

import { useState, useEffect } from 'react'
import AddPageHead from '@/components/costume-ui/add-page-head'
import ChargesSection from '@/components/costume-ui/charges-section'
import InnerSection from '@/components/costume-ui/collapsible-inner-section'
import DatePicker from '@/components/costume-ui/date-picker'
import InputGroup from '@/components/costume-ui/input-group'
import RadioGroup from '@/components/costume-ui/radio-group'
import RecurringConfig from '@/components/costume-ui/recurring-config'
import Select from '@/components/costume-ui/select'
import TimePicker from '@/components/costume-ui/time-picker'
import UploadFile from '@/components/costume-ui/upload-file'
import Alert from '@/components/costume-ui/alert'
import { cn } from '@/lib/utils'
import { PaymentType } from '@/types'
import { paymentTypes } from '@/utils/data'
import { Info } from 'lucide-react'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { formatDateForAPI } from '@/utils/formatTime'
import { formatPaymentTypeLabel } from '@/utils/functions'

export type PaymentFormCoreProps = {
  leaseReferenceId: string
  tenantId: string
  tenantName: string
  locationLabel: string // Property code or "PropertyCode (RoomTitle)"
  isRoomRented: boolean
  successRedirectUrl?: string
  breadcrumbItems?: Array<{ label: string; href?: string }>
  pageTitle?: string
  pageSubtitle?: string
}

export default function PaymentFormCore({
  leaseReferenceId,
  tenantId,
  tenantName,
  locationLabel,
  isRoomRented,
  successRedirectUrl = '/payments',
  breadcrumbItems = [
    { label: 'Payments', href: '/payments' },
    { label: 'Add Payment' }
  ],
  pageTitle = 'Add a payment',
  pageSubtitle = 'Add a new invoice for tenants to pay'
}: PaymentFormCoreProps) {
  const typesOfPayment: { label: string; value: string }[] = paymentTypes.map(
    pt => ({
      label: formatPaymentTypeLabel(pt.type),
      value: pt.type
    })
  )
  const [paymentType, setPaymentType] = useState<PaymentType>(paymentTypes[0])
  const selectable: boolean = paymentType === paymentTypes[0]
  const [isPaid, setIsPaid] = useState<boolean>(false)
  const [paymentMethod] = useState<'Bank Transfer'>('Bank Transfer')
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(undefined)
  const [paymentTime, setPaymentTime] = useState<string>('10:30:00')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [paymentEvidenceFile, setPaymentEvidenceFile] = useState<File | null>(
    null
  )
  const [charges, setCharges] = useState<any[]>([])
  const [recurringConfig, setRecurringConfig] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [excludedChargeTypes, setExcludedChargeTypes] = useState<string[]>([])

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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (charges.length === 0) {
      showAlert('Please add at least one charge', 'warning')
      return
    }

    if (!paymentDate) {
      showAlert('Please select payment date', 'warning')
      return
    }

    // Validate payment date is not in the future (only for paid payments)
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

    if (isPaid && !receiptFile) {
      showAlert('Please upload receipt', 'warning')
      return
    }

    // Validate recurring config if enabled
    if (recurringConfig && recurringConfig.enabled) {
      const { title, time_unit, event_on } = recurringConfig
      if (!title || title.trim() === '') {
        showAlert('Please enter a title for the recurring payment', 'warning')
        return
      }
      if (
        (time_unit === 'Week' || time_unit === 'Month') &&
        (!event_on || event_on.trim() === '')
      ) {
        showAlert(
          `Please select at least one day for ${time_unit.toLowerCase()}ly recurring payments`,
          'warning'
        )
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Upload receipt if paid (required)
      let receiptUrl = null
      if (receiptFile && isPaid) {
        const formData = new FormData()
        formData.append('file', receiptFile)
        formData.append('bucket', 'receipts')

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!uploadRes.ok) {
          throw new Error('Failed to upload receipt')
        }

        const { url } = await uploadRes.json()
        receiptUrl = url
      }

      // Upload payment evidence if provided
      let paymentEvidenceUrl = null
      if (paymentEvidenceFile) {
        const formData = new FormData()
        formData.append('file', paymentEvidenceFile)
        formData.append('bucket', 'payment-evidence')

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (uploadRes.ok) {
          const { url } = await uploadRes.json()
          paymentEvidenceUrl = url
        } else {
          throw new Error('Failed to upload payment evidence')
        }
      }

      // Format date for API
      const formattedDate = formatDateForAPI(paymentDate)

      // Create payment
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reference_id: leaseReferenceId,
          payment_type: paymentType.type,
          charges,
          is_paid: isPaid,
          payment_method: paymentMethod,
          payment_date: formattedDate,
          payment_time: paymentTime,
          receipt_image: receiptUrl,
          payment_evidence: paymentEvidenceUrl,
          recurring_config: recurringConfig,
          timezone_offset: new Date().getTimezoneOffset()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create payment')
      }

      await response.json()
      FeedbackToasts.created('Payment created successfully!')
      setTimeout(() => {
        window.location.href = successRedirectUrl
      }, 1500)
    } catch (error: any) {
      console.error('Error creating payment:', error)
      FeedbackToasts.createFailed('payment', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fetch used charge types for lease_initial_charges payment type
  useEffect(() => {
    const isLeaseInitialCharges = paymentType.type === 'Lease_Initial_Charges'

    if (!isLeaseInitialCharges) {
      setExcludedChargeTypes([])
      return
    }

    const baseExclusions = ['First Month Rental']

    if (!leaseReferenceId) {
      setExcludedChargeTypes(baseExclusions)
      return
    }

    const fetchUsedChargeTypes = async () => {
      try {
        const response = await fetch(
          `/api/payments/lease-initial-charges?lease_reference_id=${leaseReferenceId}`
        )
        if (!response.ok) throw new Error('Failed to fetch used charges')
        const data = await response.json()

        const allExclusions = [
          ...new Set([...baseExclusions, ...data.usedChargeTitles])
        ]
        setExcludedChargeTypes(allExclusions)
      } catch (error) {
        console.error('Error fetching used charge types:', error)
        setExcludedChargeTypes(baseExclusions)
      }
    }

    fetchUsedChargeTypes()
  }, [leaseReferenceId, paymentType.type])

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
      {/* Head section */}
      <AddPageHead
        crumb_items={breadcrumbItems}
        title={pageTitle}
        subtitle={pageSubtitle}
        isSubmitting={isSubmitting}
      />

      {/* Payment Context Info */}
      <InnerSection title='Payment Details' subtitle='Payment recipient info'>
        <div className='-mt-2 p-4 rounded-lg bg-blue-50 border border-blue-200'>
          <div className='flex items-start gap-3'>
            <Info
              strokeWidth={1.5}
              size={20}
              className='text-blue-700 mt-0.5 shrink-0'
            />
            <div className='flex flex-col gap-1'>
              <p className='texts-body-medium text-blue-800'>
                This payment will be sent to{' '}
                <span className='font-semibold'>{tenantName}</span> renting{' '}
                <span className='font-semibold'>{locationLabel}</span>
              </p>
              <p className='texts-caption-large text-blue-700'>
                Lease Reference:{' '}
                <code className='px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono'>
                  {leaseReferenceId}
                </code>
              </p>
            </div>
          </div>
        </div>

        <div className='inputs-container mt-4'>
          <InputGroup label='Payment Type'>
            <Select
              items={typesOfPayment}
              label='Types'
              placeholder='Select a type'
              value={paymentType.type}
              onValueChange={value => {
                const type = paymentTypes.find(pt => pt.type === value)
                if (type) setPaymentType(type)
              }}
            />
          </InputGroup>
        </div>
      </InnerSection>

      {/* Charges Section */}
      <ChargesSection
        flowType='income'
        selectable={selectable}
        onChargesChange={setCharges}
        excludedChargeTypes={selectable ? excludedChargeTypes : []}
        allChargesSelectable={selectable}
      />

      {/* Payment Details */}
      <div className='flex flex-col gap-5'>
        <InputGroup label='Payment Status'>
          <RadioGroup
            defaultOption={1}
            options={['Paid', 'Not Paid']}
            onChange={(value: number) => {
              if (value === 0) {
                setIsPaid(true)
              } else {
                setIsPaid(false)
              }
            }}
          />
        </InputGroup>

        <div className={cn('flex')}>
          <InputGroup
            label={`${isPaid ? '' : 'Due'} Payment Date`}
            className='mr-3'
            isRequired
          >
            <DatePicker value={paymentDate} onValueChange={setPaymentDate} />
          </InputGroup>
          <InputGroup label={`${isPaid ? '' : 'Due'} Payment Time`} isRequired>
            <TimePicker
              value={paymentTime}
              onValueChange={setPaymentTime}
              required
            />
          </InputGroup>
        </div>

        {/* Payment Evidence - Always visible */}
        <div className='flex flex-col gap-2'>
          <InputGroup label='Payment Evidence (Optional)'>
            <p className='texts-caption-large text-(--text-secondary) mb-2 -mt-1'>
              Upload documentation showing why the tenant needs to pay this
              amount (e.g., invoice, bill, repair receipt, damage evidence)
            </p>
            <UploadFile onFileChange={setPaymentEvidenceFile} />
          </InputGroup>
        </div>

        {/* Receipt Upload - Only for Paid payments */}
        <div
          className={cn(
            'transition-all duration-200 ease-out overflow-hidden',
            isPaid
              ? receiptFile
                ? 'h-35'
                : 'h-55'
              : 'h-0 opacity-0'
          )}
        >
          <InputGroup
            label='Payment Receipt'
            isRequired={isPaid}
          >
            <p className='texts-caption-large text-(--text-secondary) mb-2 -mt-1'>
              Upload the bank transfer receipt as proof of payment
            </p>
            <UploadFile onFileChange={setReceiptFile} />
          </InputGroup>
        </div>
      </div>

      {/* Recurring Pattern */}
      {paymentType.isRecurrable && (
        <RecurringConfig
          onConfigChange={setRecurringConfig}
          defaultIsPaymentFixed={paymentType.isFixedByDefault ?? false}
        />
      )}

      {/* Alert Dialog */}
      <Alert
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
        type={alertType}
      />
    </form>
  )
}
