'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Dialog from './costume-ui/dialog'
import StepIndicator from './lease-transfer/step-indicator'
import TenantFormFields, { type TenantFormRef } from './tenant-form-fields'
import Combobox from './costume-ui/combobox'
import InputGroup from './costume-ui/input-group'
import Input from './costume-ui/input'
import DatePicker from './costume-ui/date-picker'
import UploadFile from './costume-ui/upload-file'
import Button from './costume-ui/button'
import { FeedbackToasts } from './costume-ui/feedback-toast'
import { cn } from '@/lib/utils'
import { type ComboBoxitemsType } from '@/types'
import { Info } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDateForAPI } from '@/utils/formatTime'

const STEPS = [
  { number: 1, title: 'Tenant' },
  { number: 2, title: 'Booking Details' }
]

type Props = {
  propertyId: string
  roomId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function AddBookingWizard({
  propertyId,
  roomId,
  open,
  onOpenChange,
  onSuccess
}: Props) {
  const router = useRouter()
  const tenantFormRef = useRef<TenantFormRef>(null)

  // Step state
  const [currentStep, setCurrentStep] = useState(1)

  // Step 1 state
  const [tenantMode, setTenantMode] = useState<'existing' | 'new'>('existing')
  const [selectedTenantId, setSelectedTenantId] = useState<string>('')
  const [tenants, setTenants] = useState<ComboBoxitemsType[]>([])
  const [loadingTenants, setLoadingTenants] = useState(false)

  // Step 2 state
  const [bookingAmount, setBookingAmount] = useState<string>('')
  const [moveInDate, setMoveInDate] = useState<Date | undefined>(undefined)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)

  // General state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  // Fetch tenants when dialog opens
  const fetchTenants = useCallback(async () => {
    setLoadingTenants(true)
    try {
      const response = await fetch('/api/tenants?paginate=true&limit=100')
      if (response.ok) {
        const data = await response.json()
        const items: ComboBoxitemsType[] = (data.data || []).map(
          (tenant: any) => ({
            id: tenant.id,
            label: `${tenant.first_name} ${tenant.last_name || ''}`.trim(),
            subtitle: tenant.identity_number,
            avatar: tenant.profile_thumb || undefined
          })
        )
        setTenants(items)
      }
    } catch (err) {
      console.error('Error fetching tenants:', err)
    } finally {
      setLoadingTenants(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchTenants()
    }
  }, [open, fetchTenants])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1)
      setTenantMode('existing')
      setSelectedTenantId('')
      setBookingAmount('')
      setMoveInDate(undefined)
      setReceiptFile(null)
      setError('')
      setIsSubmitting(false)
    }
  }, [open])

  // ─── Step Navigation ───

  const handleNext = () => {
    setError('')

    if (tenantMode === 'existing') {
      if (!selectedTenantId) {
        setError('Please select a tenant')
        return
      }
    }
    // For new tenant, we rely on HTML5 form validation via reportValidity
    // We need to validate the tenant form fields
    if (tenantMode === 'new') {
      // Check that the form wrapper has all required fields filled
      const formEl = document.getElementById('booking-tenant-form') as HTMLFormElement
      if (formEl && !formEl.reportValidity()) {
        return
      }
    }

    setCurrentStep(2)
  }

  const handleBack = () => {
    setError('')
    setCurrentStep(1)
  }

  // ─── Submit ───

  const handleSubmit = async () => {
    setError('')

    // Validate step 2
    const numAmount = parseFloat(bookingAmount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid booking amount')
      return
    }

    if (!moveInDate) {
      setError('Please select a move-in date')
      return
    }

    if (!receiptFile) {
      setError('Please upload the receipt')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Upload receipt
      const uploadFormData = new FormData()
      uploadFormData.append('file', receiptFile)
      uploadFormData.append('bucket', 'receipts')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      })

      if (!uploadRes.ok) {
        throw new Error('Failed to upload receipt')
      }

      const { url: receiptUrl } = await uploadRes.json()

      // 2. Build booking request
      const formData = new FormData()
      formData.append('tenantType', tenantMode)
      formData.append('propertyId', propertyId)
      if (roomId) {
        formData.append('roomId', roomId)
      }
      formData.append('moveInDate', formatDateForAPI(moveInDate))
      formData.append('amount', numAmount.toString())
      formData.append('receiptUrl', receiptUrl)

      if (tenantMode === 'existing') {
        formData.append('tenantId', selectedTenantId)
      } else {
        const tenantData = tenantFormRef.current!.getTenantData()
        formData.append('identityType', tenantData.identityType)
        formData.append('identityNumber', tenantData.identityNumber)
        formData.append('firstName', tenantData.firstName)
        formData.append('lastName', tenantData.lastName)
        formData.append('phoneNumber', tenantData.phoneNumber)
        formData.append('email', tenantData.email)

        if (tenantData.profileImage && tenantData.profileThumb) {
          formData.append(
            'profileImage',
            tenantData.profileImage,
            'profile.jpg'
          )
          formData.append(
            'profileThumb',
            tenantData.profileThumb,
            'thumb.jpg'
          )
        }
      }

      // 3. Create booking
      const response = await fetch('/api/bookings', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      FeedbackToasts.created(
        'Booking',
        `Booking ${data.booking.referenceId} has been created.`
      )

      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create booking'
      setError(errorMessage)
      FeedbackToasts.operationFailed('Create booking', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Footer Buttons ───

  const footerButtons = (
    <>
      {currentStep === 1 && (
        <>
          <Button
            variant='secondary'
            label='Cancel'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          />
          <Button
            label='Next'
            onClick={handleNext}
            disabled={isSubmitting}
          />
        </>
      )}
      {currentStep === 2 && (
        <>
          <Button
            variant='secondary'
            label='Back'
            onClick={handleBack}
            disabled={isSubmitting}
          />
          <Button
            label='Add Booking'
            onClick={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        </>
      )}
    </>
  )

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title='Add Booking'
      footerButtons={footerButtons}
      className='max-w-170!'
      loading={isSubmitting}
    >
      <div className='flex flex-col gap-5'>
        {/* Step Indicator */}
        <StepIndicator steps={STEPS} currentStep={currentStep} />

        {/* Step 1: Tenant (kept mounted but hidden on step 2 to preserve form ref) */}
        <div className={cn('flex flex-col gap-5', currentStep !== 1 && 'hidden')}>
            {/* Tenant Mode Toggle */}
            <div className='flex gap-0 rounded-lg border border-(--border-strong) overflow-hidden'>
              <button
                type='button'
                onClick={() => {
                  setTenantMode('existing')
                  setError('')
                }}
                className={cn(
                  'flex-1 py-2.5 text-sm font-medium transition-colors',
                  tenantMode === 'existing'
                    ? 'bg-(--secondary-color) text-(--text-inverse)'
                    : 'bg-(--background-primary) text-(--text-secondary) hover:bg-neutral-50'
                )}
              >
                Existing Tenant
              </button>
              <button
                type='button'
                onClick={() => {
                  setTenantMode('new')
                  setSelectedTenantId('')
                  setError('')
                }}
                className={cn(
                  'flex-1 py-2.5 text-sm font-medium transition-colors border-l border-(--border-strong)',
                  tenantMode === 'new'
                    ? 'bg-(--secondary-color) text-(--text-inverse)'
                    : 'bg-(--background-primary) text-(--text-secondary) hover:bg-neutral-50'
                )}
              >
                New Tenant
              </button>
            </div>

            {/* Existing Tenant Search */}
            {tenantMode === 'existing' && (
              <InputGroup label='Select Tenant' isRequired>
                <Combobox
                  items={tenants}
                  placeholder='Select a tenant'
                  searchPlaceholder='Search by name or ID...'
                  showAvatar
                  value={selectedTenantId}
                  onValueChange={setSelectedTenantId}
                  isLoading={loadingTenants}
                  loadingMessage='Loading tenants...'
                  NotFoundMessage='No tenants found'
                  disabled={isSubmitting}
                />
              </InputGroup>
            )}

            {/* New Tenant Form */}
            {tenantMode === 'new' && (
              <form
                id='booking-tenant-form'
                className='flex flex-col gap-7.5'
                onSubmit={e => e.preventDefault()}
              >
                <TenantFormFields
                  ref={tenantFormRef}
                  loading={isSubmitting}
                />
              </form>
            )}
        </div>

        {/* Step 2: Booking Details */}
        {currentStep === 2 && (
          <div className='flex flex-col gap-5'>
            {/* Info Banner */}
            <div className='flex items-start gap-2.5 p-3 rounded-md bg-blue-50 border border-blue-200'>
              <Info className='w-4 h-4 text-blue-600 mt-0.5 shrink-0' />
              <p className='text-sm text-blue-800'>
                Payment method is <span className='font-semibold'>Bank Transfer</span>.
                Please upload the receipt below.
              </p>
            </div>

            <div className='grid grid-cols-2 items-start gap-5'>
              <InputGroup label='Booking Amount' isRequired>
                <Input
                  currency
                  placeholder='Enter amount'
                  value={bookingAmount}
                  onValueChange={(value) => setBookingAmount(value || '')}
                  required
                  disabled={isSubmitting}
                />
              </InputGroup>

              <InputGroup label='Move-in Date' isRequired>
                <DatePicker
                  value={moveInDate}
                  onValueChange={setMoveInDate}
                  disabled={isSubmitting}
                />
              </InputGroup>
            </div>

            <InputGroup label='Receipt' isRequired>
              <UploadFile onFileChange={setReceiptFile} />
            </InputGroup>
          </div>
        )}

        {/* Error Message */}
        {error && <p className='text-red-600 text-sm'>{error}</p>}
      </div>
    </Dialog>
  )
}
