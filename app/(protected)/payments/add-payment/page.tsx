'use client'

import AddPageHead from '@/components/costume-ui/add-page-head'
import ChargesSection from '@/components/costume-ui/charges-section'
import InnerSection from '@/components/costume-ui/collapsible-inner-section'
import Combobox from '@/components/costume-ui/combobox'
import DatePicker from '@/components/costume-ui/date-picker'
import InputGroup from '@/components/costume-ui/input-group'
import RadioGroup from '@/components/costume-ui/radio-group'
import RecurringConfig from '@/components/costume-ui/recurring-config'
import Select from '@/components/costume-ui/select'
import TimePicker from '@/components/costume-ui/time-picker'
import UploadFile from '@/components/costume-ui/upload-file'
import Alert from '@/components/costume-ui/alert'
import { cn } from '@/lib/utils'
import { ComboBoxitemsType, PaymentType } from '@/types'
import { paymentTypes } from '@/utils/data'
import { useState, useEffect } from 'react'
import { Info } from 'lucide-react'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { formatDateForAPI } from '@/utils/formatTime'

const AddPayment = () => {
  const [tenantItems, setTenantItems] = useState<ComboBoxitemsType[]>([])
  const [propertyItems, setPropertyItems] = useState<ComboBoxitemsType[]>([])
  const [roomItems, setRoomItems] = useState<ComboBoxitemsType[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)
  const [selectedLeaseReferenceId, setSelectedLeaseReferenceId] = useState<
    string | null
  >(null)
  const [selectedPropertyIdForRoomFilter, setSelectedPropertyIdForRoomFilter] =
    useState<string | null>(null)
  const [isRoomRented, setIsRoomRented] = useState<boolean>(false)
  const [loadingTenants, setLoadingTenants] = useState<boolean>(true)
  const [loadingProperties, setLoadingProperties] = useState<boolean>(false)
  const [loadingRooms, setLoadingRooms] = useState<boolean>(false)
  const typesOfPayment = paymentTypes.map(pt => pt.type)
  const [paymentType, setPaymentType] = useState<PaymentType>(paymentTypes[0])
  const selectable: boolean = paymentType === paymentTypes[0]
  const [isPaid, setIsPaid] = useState<boolean>(false)
  const [paymentMethod, setPaymentMethod] = useState<
    string | 'Cash' | 'Bank Transfer'
  >('Cash')
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(undefined)
  const [paymentTime, setPaymentTime] = useState<string>('10:30:00')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [charges, setCharges] = useState<any[]>([])
  const [recurringConfig, setRecurringConfig] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [excludedChargeTypes, setExcludedChargeTypes] = useState<string[]>([])
  const [loadingUsedCharges, setLoadingUsedCharges] = useState(false)

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

  // Helper to get lease reference_id
  const getLeaseReferenceId = () => {
    return selectedLeaseReferenceId
  }

  // Helper to translate week day codes to full names
  const weekDayFullNames: Record<string, string> = {
    'Su': 'Sunday',
    'Mo': 'Monday',
    'Tu': 'Tuesday',
    'We': 'Wednesday',
    'Th': 'Thursday',
    'Fr': 'Friday',
    'Sa': 'Saturday'
  }
  const translateWeekDays = (codes: string) => {
    return codes.split(',').map(code => weekDayFullNames[code] || code).join(', ')
  }

  // Helper to calculate next payment date based on recurring config
  const calculateNextPaymentDate = (startDate: Date, config: any): Date => {
    const next = new Date(startDate)
    const { every, time_unit, event_on } = config

    switch (time_unit) {
      case 'Day':
        next.setDate(next.getDate() + every)
        break
      case 'Week':
        // Find next occurrence of selected weekday
        if (event_on) {
          const weekDayMap: Record<string, number> = { 'Su': 0, 'Mo': 1, 'Tu': 2, 'We': 3, 'Th': 4, 'Fr': 5, 'Sa': 6 }
          const selectedDays = event_on.split(',').map((d: string) => weekDayMap[d]).sort((a: number, b: number) => a - b)
          // Add weeks first
          next.setDate(next.getDate() + (every * 7))
          // Find the first selected day in that week
          const daysUntilNext = selectedDays.find((d: number) => d >= next.getDay()) ?? selectedDays[0]
          const diff = daysUntilNext - next.getDay()
          next.setDate(next.getDate() + (diff >= 0 ? diff : 7 + diff))
        } else {
          next.setDate(next.getDate() + (every * 7))
        }
        break
      case 'Month':
        next.setMonth(next.getMonth() + every)
        // If specific days are selected, use the first one
        if (event_on) {
          const selectedDays = event_on.split(',').map(Number).sort((a: number, b: number) => a - b)
          next.setDate(selectedDays[0])
        }
        break
      case 'Year':
        next.setFullYear(next.getFullYear() + every)
        break
    }
    return next
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!selectedTenantId || !selectedLeaseReferenceId) {
      showAlert('Please select tenant and property', 'warning')
      return
    }

    if (isRoomRented && !selectedLeaseReferenceId) {
      showAlert('Please select a room', 'warning')
      return
    }

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

    if (isPaid && !paymentMethod) {
      showAlert('Please select payment method', 'warning')
      return
    }

    if (isPaid && paymentMethod === 'Bank Transfer' && !receiptFile) {
      showAlert('Please upload receipt for bank transfer', 'warning')
      return
    }

    // Validate recurring config if enabled
    if (recurringConfig && recurringConfig.enabled) {
      const { title, time_unit, event_on } = recurringConfig
      // Check if title is provided
      if (!title || title.trim() === '') {
        showAlert('Please enter a title for the recurring payment', 'warning')
        return
      }
      // Check if Week or Month is selected but no days are chosen
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

      // Format date for API
      const formattedDate = formatDateForAPI(paymentDate)

      // Create payment
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reference_id: getLeaseReferenceId(),
          payment_type: paymentType.type,
          charges,
          is_paid: isPaid,
          payment_method: paymentMethod,
          payment_date: formattedDate,
          payment_time: paymentTime,
          receipt_image: receiptUrl,
          recurring_config: recurringConfig
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create payment')
      }

      await response.json()
      FeedbackToasts.created('Payment created successfully!')
      setTimeout(() => {
        window.location.href = '/payments'
      }, 1500)
    } catch (error: any) {
      console.error('Error creating payment:', error)
      FeedbackToasts.createFailed('payment', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fetch active tenants on mount
  useEffect(() => {
    const fetchActiveTenants = async () => {
      try {
        const response = await fetch('/api/payments/active-tenants')
        if (!response.ok) throw new Error('Failed to fetch tenants')
        const data = await response.json()
        setTenantItems(data)
      } catch (error) {
        console.error('Error fetching active tenants:', error)
      } finally {
        setLoadingTenants(false)
      }
    }

    fetchActiveTenants()
  }, [])

  // Fetch active properties when tenant is selected
  useEffect(() => {
    if (!selectedTenantId) {
      setPropertyItems([])
      return
    }

    const fetchActiveProperties = async () => {
      setLoadingProperties(true)
      try {
        const response = await fetch(
          `/api/payments/active-properties?tenant_id=${selectedTenantId}`
        )
        if (!response.ok) throw new Error('Failed to fetch properties')
        const data = await response.json()
        setPropertyItems(data)
      } catch (error) {
        console.error('Error fetching active properties:', error)
      } finally {
        setLoadingProperties(false)
      }
    }

    fetchActiveProperties()
  }, [selectedTenantId])

  // Fetch active rooms when property with Room rented is selected
  useEffect(() => {
    if (
      !selectedPropertyIdForRoomFilter ||
      !selectedTenantId ||
      !isRoomRented
    ) {
      setRoomItems([])
      return
    }

    const fetchActiveRooms = async () => {
      setLoadingRooms(true)
      try {
        const response = await fetch(
          `/api/payments/active-rooms?tenant_id=${selectedTenantId}&property_id=${selectedPropertyIdForRoomFilter}`
        )
        if (!response.ok) throw new Error('Failed to fetch rooms')
        const data = await response.json()
        setRoomItems(data)
      } catch (error) {
        console.error('Error fetching active rooms:', error)
      } finally {
        setLoadingRooms(false)
      }
    }

    fetchActiveRooms()
  }, [selectedPropertyIdForRoomFilter, selectedTenantId, isRoomRented])

  // Fetch used charge types for lease_initial_charges payment type
  // This prevents duplicate charge types from being added
  useEffect(() => {
    const isLeaseInitialCharges = paymentType.type === 'Lease_Initial_Charges'

    if (!isLeaseInitialCharges) {
      // For non-lease_initial_charges types, no exclusions needed
      setExcludedChargeTypes([])
      return
    }

    // For lease_initial_charges, always exclude 'First Month Rental' (handled in lease creation)
    const baseExclusions = ['First Month Rental']

    if (!selectedLeaseReferenceId) {
      // No lease selected yet, only exclude First Month Rental
      setExcludedChargeTypes(baseExclusions)
      return
    }

    // Fetch used charge types for this lease
    const fetchUsedChargeTypes = async () => {
      setLoadingUsedCharges(true)
      try {
        const response = await fetch(
          `/api/payments/lease-initial-charges?lease_reference_id=${selectedLeaseReferenceId}`
        )
        if (!response.ok) throw new Error('Failed to fetch used charges')
        const data = await response.json()

        // Combine base exclusions with already used charge types
        const allExclusions = [
          ...new Set([...baseExclusions, ...data.usedChargeTitles])
        ]
        setExcludedChargeTypes(allExclusions)
      } catch (error) {
        console.error('Error fetching used charge types:', error)
        // On error, at least exclude First Month Rental
        setExcludedChargeTypes(baseExclusions)
      } finally {
        setLoadingUsedCharges(false)
      }
    }

    fetchUsedChargeTypes()
  }, [selectedLeaseReferenceId, paymentType.type])

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
      {/* Head section */}
      <AddPageHead
        crumb_items={[
          { label: 'Payments', href: '/payments' },
          { label: 'Add Payment' }
        ]}
        title='Add a payment'
        subtitle='Add a new invoice for tenants to pay'
        className='mb-7.5'
        isSubmitting={isSubmitting}
      />

      {/* Basic Details */}
      <InnerSection title='Basic Details' subtitle='Payment Basic Details'>
        <div className='inputs-container'>
          <InputGroup label='Tenants' isRequired>
            <Combobox
              items={tenantItems}
              searchPlaceholder='Search tenants'
              variant='single'
              placeholder={
                loadingTenants ? 'Loading tenants...' : 'Select tenant'
              }
              showAvatar
              onValueChange={value => {
                // value is the tenant id (itemValue from handleSelect)
                setSelectedTenantId(value || null)
              }}
              isLoading={loadingTenants}
              loadingMessage='Fetching tenants...'
              required
            />
          </InputGroup>
          <InputGroup label='Property' isRequired>
            <Combobox
              items={propertyItems}
              variant='single'
              searchPlaceholder='Search properties'
              placeholder={
                loadingProperties
                  ? 'Loading properties...'
                  : 'Select a property'
              }
              disabled={!selectedTenantId}
              disabledReason='Select a tenant first'
              onValueChange={value => {
                const property = propertyItems.find(item => item.id === value)
                // value is the reference_id
                // extraReference is either lease reference_id or "Room rented" string
                if (property?.extraReference === 'Room rented') {
                  // Property has rooms - extract property_id from metadata for filtering rooms
                  setIsRoomRented(true)
                  setSelectedPropertyIdForRoomFilter(
                    property.metadata?.propertyId || null
                  )
                  setSelectedLeaseReferenceId(null) // Clear until room is selected
                } else {
                  // Property is directly rented - extraReference is the lease reference_id
                  setIsRoomRented(false)
                  setSelectedPropertyIdForRoomFilter(null)
                  setSelectedLeaseReferenceId(value || null) // Store reference_id
                }
              }}
              isLoading={loadingProperties}
              loadingMessage='Fetching properties...'
              required
            />
          </InputGroup>
        </div>
        {/* Room selection - only shown when property has Room rented */}
        {isRoomRented && (
          <div className='inputs-container'>
            <InputGroup label='Room' isRequired>
              <Combobox
                items={roomItems}
                variant='single'
                searchPlaceholder='Search rooms'
                placeholder={
                  loadingRooms ? 'Loading rooms...' : 'Select a room'
                }
                onValueChange={value => {
                  // value is the room's lease reference_id
                  setSelectedLeaseReferenceId(value || null)
                }}
                isLoading={loadingRooms}
                loadingMessage='Fetching rooms...'
                required
              />
            </InputGroup>
          </div>
        )}

        {/* Info note - shown when lease details are available */}
        {selectedTenantId && selectedLeaseReferenceId && (
          <div className='mt-3 p-3 rounded-md bg-blue-50 border border-blue-200'>
            <div className='flex items-center gap-2 text-sm text-blue-800'>
              <Info strokeWidth={1.5} size={20} />
              This payment will be sent to{' '}
              <span className='font-semibold'>
                {tenantItems.find(t => t.id === selectedTenantId)?.label ||
                  'tenant'}
              </span>{' '}
              renting{' '}
              {isRoomRented ? (
                <>
                  <span className='font-semibold'>
                    {roomItems.find(r => r.id === selectedLeaseReferenceId)
                      ?.label || 'room'}
                  </span>{' '}
                  in{' '}
                  <span className='font-semibold'>
                    {propertyItems.find(
                      p => p.id === selectedPropertyIdForRoomFilter
                    )?.label || 'property'}
                  </span>
                </>
              ) : (
                <span className='font-semibold'>
                  {propertyItems.find(p => p.id === selectedLeaseReferenceId)
                    ?.label || 'property'}
                </span>
              )}{' '}
              under lease{' '}
              <span className='font-mono text-xs bg-blue-100 px-1.5 py-0.5 rounded'>
                {selectedLeaseReferenceId}
              </span>
            </div>
          </div>
        )}
        <div className='inputs-container'>
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
            label='Payment Method'
            className={cn(isPaid ? 'max-w-full mr-3' : 'max-w-0! opacity-0')}
            isRequired
          >
            <Select
              items={['Cash', 'Bank Transfer']}
              value={paymentMethod}
              onChange={setPaymentMethod}
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

        <div
          className={cn(
            'trnasition-all duration-200 ease-out overflow-hidden',
            isPaid && paymentMethod === 'Bank Transfer'
              ? receiptFile
                ? 'h-19'
                : 'h-49'
              : 'h-0 opacity-0'
          )}
        >
          <UploadFile onFileChange={setReceiptFile} />
        </div>
      </div>

      {/* Recurring Pattern */}
      {paymentType.isRecurrable && (
        <>
          <RecurringConfig
            onConfigChange={setRecurringConfig}
            defaultIsPaymentFixed={paymentType.isFixedByDefault ?? false}
          />
          {/* Recurring explanation */}
          {recurringConfig && recurringConfig.enabled && paymentDate && (
            <div className='p-3 rounded-md bg-blue-50 border border-blue-200'>
              <div className='flex items-start gap-2 text-sm text-blue-800'>
                <Info strokeWidth={1.5} size={18} className='mt-0.5 shrink-0' />
                <div className='flex flex-col gap-1'>
                  <p className='font-medium'>Recurring Payment Schedule</p>
                  <p>
                    Starting from the {isPaid ? 'payment' : 'due'} date ({paymentDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}),
                    this payment titled "<span className='font-semibold'>{recurringConfig.title || 'Untitled'}</span>" will generate every{' '}
                    <span className='font-semibold'>
                      {recurringConfig.every} {recurringConfig.time_unit.toLowerCase()}{recurringConfig.every > 1 ? 's' : ''}
                    </span>
                    {recurringConfig.event_on && recurringConfig.time_unit === 'Week' && (
                      <> on <span className='font-semibold'>{translateWeekDays(recurringConfig.event_on)}</span></>
                    )}
                    {recurringConfig.event_on && recurringConfig.time_unit === 'Month' && (
                      <> on day <span className='font-semibold'>{recurringConfig.event_on.split(',').join(', ')}</span> of each month</>
                    )}
                    .
                  </p>
                  <p>
                    <span className='font-medium'>Next payment:</span>{' '}
                    <span className='font-semibold'>
                      {calculateNextPaymentDate(paymentDate, recurringConfig).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </p>
                  <p className='text-blue-600 mt-1'>
                    This recurring payment will continue until the lease ends or is manually stopped by staff.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
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

export default AddPayment
