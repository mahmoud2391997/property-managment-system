'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AddPageHead from '@/components/costume-ui/add-page-head'
import ChargesSection from '@/components/costume-ui/charges-section'
import type { DefaultCharge } from '@/components/costume-ui/charges-section'
import InnerSection from '@/components/costume-ui/collapsible-inner-section'
import DatePicker from '@/components/costume-ui/date-picker'
import InputGroup from '@/components/costume-ui/input-group'
import TimePicker from '@/components/costume-ui/time-picker'
import Alert from '@/components/costume-ui/alert'
import { Info } from 'lucide-react'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { formatDateForAPI } from '@/utils/formatTime'
import { formatPaymentTypeLabel } from '@/utils/functions'

type Props = {
  payment: any
}

export default function EditPaymentContent({ payment }: Props) {
  const router = useRouter()

  // Payment type is read-only (cannot be changed)
  const selectable = payment.type === 'Lease_Initial_Charges'

  // Parse due date/time from payment
  const initialDueDate = payment.due_payment_timestamp ? new Date(payment.due_payment_timestamp) : undefined
  const initialDueTime = payment.due_payment_timestamp
    ? (() => {
        const d = new Date(payment.due_payment_timestamp)
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`
      })()
    : '10:30:00'

  const [dueDate, setDueDate] = useState<Date | undefined>(initialDueDate)
  const [dueTime, setDueTime] = useState<string>(initialDueTime)
  const [charges, setCharges] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Alert state
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState<'info' | 'error' | 'success' | 'warning'>('info')

  const showAlert = (message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    setAlertMessage(message)
    setAlertType(type)
    setAlertOpen(true)
  }

  // Default charges from existing payment data
  const defaultCharges: DefaultCharge[] = useMemo(
    () => payment.charges.map((c: any) => ({
      type: c.title,
      amount: c.amount,
      is_taxed: c.is_taxed,
      is_refundable: c.is_refunded
    })),
    [payment.charges]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (charges.length === 0) {
      showAlert('Please add at least one charge', 'warning')
      return
    }

    if (!dueDate) {
      showAlert('Please select a due date', 'warning')
      return
    }

    setIsSubmitting(true)

    try {
      const formattedDate = formatDateForAPI(dueDate)

      const response = await fetch(`/api/payments/${payment.reference_id}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_type: payment.type,
          charges,
          due_date: formattedDate,
          due_time: dueTime,
          timezone_offset: new Date().getTimezoneOffset()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update payment')
      }

      FeedbackToasts.created('Payment updated successfully!')
      setTimeout(() => {
        router.push(`/payments/${payment.reference_id}`)
      }, 1500)
    } catch (error: any) {
      console.error('Error updating payment:', error)
      FeedbackToasts.createFailed('payment update', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
      <AddPageHead
        crumb_items={[
          { label: 'Payments', href: '/payments' },
          { label: payment.reference_id, href: `/payments/${payment.reference_id}` },
          { label: 'Edit' }
        ]}
        title='Edit Payment'
        subtitle={`Edit payment ${payment.reference_id}`}
        isSubmitting={isSubmitting}
      />

      {/* Payment Context Info */}
      <InnerSection title='Payment Details' subtitle='Payment information'>
        {payment.lease && (
          <div className='-mt-2 p-4 rounded-lg bg-blue-50 border border-blue-200'>
            <div className='flex items-start gap-3'>
              <Info strokeWidth={1.5} size={20} className='text-blue-700 mt-0.5 shrink-0' />
              <div className='flex flex-col gap-1'>
                <p className='texts-body-medium text-blue-800'>
                  Payment for{' '}
                  <span className='font-semibold'>{payment.lease.tenant_name}</span> renting{' '}
                  <span className='font-semibold'>
                    {payment.lease.room_title
                      ? `${payment.lease.property_code} (${payment.lease.room_title})`
                      : payment.lease.property_code}
                  </span>
                </p>
                <p className='texts-caption-large text-blue-700'>
                  Lease Reference:{' '}
                  <code className='px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono'>
                    {payment.lease.reference_id}
                  </code>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className='inputs-container mt-4'>
          <InputGroup label='Payment Type'>
            <div className='flex items-center h-10 px-3 rounded-[5] border bg-neutral-50 texts-body-medium text-neutral-500'>
              {formatPaymentTypeLabel(payment.type)}
            </div>
          </InputGroup>
        </div>
      </InnerSection>

      {/* Charges Section */}
      <ChargesSection
        flowType='income'
        selectable={selectable}
        onChargesChange={setCharges}
        defaultCharges={defaultCharges}
        allChargesSelectable={selectable}
        allowAllRemovable
      />

      {/* Due Date */}
      <div className='flex flex-col gap-5'>
        <div className='flex'>
          <InputGroup label='Due Payment Date' className='mr-3' isRequired>
            <DatePicker value={dueDate} onValueChange={setDueDate} />
          </InputGroup>
          <InputGroup label='Due Payment Time' isRequired>
            <TimePicker
              value={dueTime}
              onValueChange={setDueTime}
              required
            />
          </InputGroup>
        </div>

        {/* Payment Evidence - read only display */}
        {payment.payment_evidence && (
          <div className='flex flex-col gap-2'>
            <InputGroup label='Payment Evidence'>
              <a
                href={payment.payment_evidence}
                target='_blank'
                rel='noopener noreferrer'
                className='texts-body-medium text-(--info-main) hover:underline'
              >
                View attached evidence
              </a>
            </InputGroup>
          </div>
        )}
      </div>

      <Alert
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        message={alertMessage}
        type={alertType}
      />
    </form>
  )
}
