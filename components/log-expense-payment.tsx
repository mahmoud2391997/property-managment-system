'use client'

import { useState } from 'react'
import InputGroup from './costume-ui/input-group'
import Input from './costume-ui/input'
import Select from './costume-ui/select'
import DatePicker from './costume-ui/date-picker'
import TimePicker from './costume-ui/time-picker'
import UploadFile from './costume-ui/upload-file'
import { FeedbackToasts } from './costume-ui/feedback-toast'
import { useRouter } from 'next/navigation'
import { formatDateForAPI } from '@/utils/formatTime'
import { cn } from '@/lib/utils'

type Props = {
  expenseId: string
  expenseReferenceId: string
  maxAmount: number
  onSuccess?: () => void
  onLoadingChange?: (loading: boolean) => void
}

const LogExpensePayment = ({
  expenseId,
  expenseReferenceId,
  maxAmount,
  onSuccess,
  onLoadingChange
}: Props) => {
  const router = useRouter()
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [amount, setAmount] = useState<string>(maxAmount.toFixed(2))
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer'>('Cash')
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

      // Validate receipt for bank transfer
      if (paymentMethod === 'Bank Transfer' && !receiptFile) {
        throw new Error('Please upload receipt for bank transfer')
      }

      // Upload receipt if needed
      let receiptUrl = null
      if (receiptFile && paymentMethod === 'Bank Transfer') {
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
        } else {
          throw new Error('Failed to upload receipt')
        }
      }

      // Format date for API
      const formattedDate = formatDateForAPI(paymentDate)

      // Create payment history record for expense
      const response = await fetch('/api/expenses/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expense_reference_id: expenseReferenceId,
          amount: numAmount,
          payment_method: paymentMethod,
          payment_date: formattedDate,
          payment_time: paymentTime,
          receipt_image: receiptUrl,
          timezone_offset: new Date().getTimezoneOffset()
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
          Logging payment for expense <span className='font-mono font-semibold'>{expenseReferenceId}</span>
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

      <InputGroup label='Payment Method' isRequired>
        <Select
          items={['Cash', 'Bank Transfer']}
          value={paymentMethod}
          onValueChange={(value) => setPaymentMethod(value as 'Cash' | 'Bank Transfer')}
          label='Methods'
          placeholder='Select method'
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

      <div
        className={cn(
          'transition-all duration-200 ease-out overflow-hidden',
          paymentMethod === 'Bank Transfer'
            ? receiptFile
              ? 'h-19'
              : 'h-49'
            : 'h-0 opacity-0'
        )}
      >
        <UploadFile onFileChange={setReceiptFile} />
      </div>

      {error && <p className='text-red-600 text-sm'>{error}</p>}
    </form>
  )
}

export default LogExpensePayment
