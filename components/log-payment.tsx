'use client'

import { useState } from 'react'
import InputGroup from './costume-ui/input-group'
import Input from './costume-ui/input'
import DatePicker from './costume-ui/date-picker'
import TimePicker from './costume-ui/time-picker'
import UploadFile from './costume-ui/upload-file'
import { FeedbackToasts } from './costume-ui/feedback-toast'
import { useRouter } from 'next/navigation'
import { formatDateForAPI } from '@/utils/formatTime'

type Props = {
  paymentId: string
  paymentReferenceId: string
  maxAmount: number
  onSuccess?: () => void
  onLoadingChange?: (loading: boolean) => void
}

const LogPayment = ({
  paymentId,
  paymentReferenceId,
  maxAmount,
  onSuccess,
  onLoadingChange
}: Props) => {
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [amount, setAmount] = useState<string>(maxAmount.toFixed(2))
  const [paymentMethod] = useState<'Bank Transfer'>('Bank Transfer')
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date())
  const [paymentTime, setPaymentTime] = useState<string>('10:00:00')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    onLoadingChange?.(true)
    setError('')

    try {
      // Validate amount
      const numAmount = parseFloat(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error('Please enter a valid amount')
      }

      if (numAmount > maxAmount) {
        throw new Error(`Amount cannot exceed RM ${maxAmount.toFixed(2)}`)
      }

      // Validate date
      if (!paymentDate) {
        throw new Error('Please select a payment date')
      }

      // Validate payment date is not in the future
      const paymentDateTime = new Date(
        `${formatDateForAPI(paymentDate)}T${paymentTime}`
      )
      const now = new Date()
      if (paymentDateTime > now) {
        throw new Error('Payment date and time cannot be in the future')
      }

      // Validate receipt is provided (required)
      if (!receiptFile) {
        throw new Error('Please upload receipt')
      }

      // Upload receipt (required)
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

      const { url: receiptUrl } = await uploadRes.json()

      // Format date for API
      const formattedDate = formatDateForAPI(paymentDate)

      // Create payment history record
      const response = await fetch('/api/payments/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_id: paymentId,
          amount: numAmount,
          payment_method: paymentMethod,
          payment_date: formattedDate,
          payment_time: paymentTime,
          receipt_image: receiptUrl
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to log payment')
      }

      FeedbackToasts.created('Payment logged successfully!')

      router.refresh()

      if (onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to log payment'
      setError(errorMessage)
      FeedbackToasts.operationFailed('Log payment', errorMessage)
    } finally {
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  return (
    <form
      id='dialog-form'
      onSubmit={handleSubmit}
      className='flex flex-col gap-5'
    >
      <div className='p-3 rounded-md bg-blue-50 border border-blue-200'>
        <p className='text-sm text-blue-800'>
          Logging payment for <span className='font-mono font-semibold'>{paymentReferenceId}</span>
        </p>
        <p className='text-xs text-blue-600 mt-1'>
          Maximum payable amount: <span className='font-semibold'>RM {maxAmount.toFixed(2)}</span>
        </p>
      </div>

      <InputGroup label='Amount' isRequired>
        <Input
          currency
          placeholder='Enter amount'
          value={amount}
          onValueChange={(value) => {
            const numValue = parseFloat(value || '0')
            if (numValue > maxAmount) {
              setAmount(maxAmount.toFixed(2))
            } else {
              setAmount(value || '')
            }
          }}
          required
          disabled={loading}
        />
      </InputGroup>

      <div className='grid grid-cols-2 gap-5'>
        <InputGroup label='Payment Date' isRequired>
          <DatePicker
            value={paymentDate}
            onValueChange={setPaymentDate}
            disabled={loading}
          />
        </InputGroup>
        <InputGroup label='Payment Time' isRequired>
          <TimePicker
            value={paymentTime}
            onValueChange={setPaymentTime}
            required
            disabled={loading}
          />
        </InputGroup>
      </div>

      <InputGroup label='Receipt' isRequired>
        <UploadFile onFileChange={setReceiptFile} />
      </InputGroup>

      {error && <p className='text-red-600 text-sm'>{error}</p>}
    </form>
  )
}

export default LogPayment
