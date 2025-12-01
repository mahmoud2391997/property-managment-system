'use client'

import AddPageHead from '@/components/costume-ui/add-page-head'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import InnerSection from '@/components/costume-ui/collapsible-inner-section'
import InputGroup from '@/components/costume-ui/input-group'
import DatePicker from '@/components/costume-ui/date-picker'
import Input from '@/components/costume-ui/input'
import Combobox from '@/components/costume-ui/combobox'
import PaymentSection, { DefaultPaymentConfig, LateCharge, PaymentStatusData } from '@/components/costume-ui/payment-section'
import ReminderSection, { DefaultReminderConfig } from '@/components/costume-ui/reminder-section'
import CollapsibleSection from '@/components/costume-ui/collapsible-section'
import { ComboBoxitemsType } from '@/types'
import { ChargeData } from '@/components/costume-ui/charges-section'
import Alert from '@/components/costume-ui/alert'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { Info, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatDate } from '@/utils/formatTime'

// Helper to calculate end date (end date is start_date + number_of_months, same day of month)
const calculateEndDate = (startDate: Date, numberOfMonths: number): Date => {
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + numberOfMonths)
  return endDate
}

type RoomConfig = {
  roomTitle: string
  propertyCode: string
  propertyId: string | null
}

const AddRoomLease = () => {
  const { id: roomId } = useParams<{ id: string }>()
  const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null)
  const [isRoomConfigLoading, setIsRoomConfigLoading] = useState<boolean>(true)

  // Default config state
  const [defaultConfigStatus, setDefaultConfigStatus] = useState<'loading' | 'loaded' | 'empty' | 'error'>('loading')
  const [defaultPaymentConfig, setDefaultPaymentConfig] = useState<DefaultPaymentConfig | undefined>(undefined)
  const [defaultReminderConfig, setDefaultReminderConfig] = useState<DefaultReminderConfig | undefined>(undefined)

  // Tenant state
  const [tenantItems, setTenantItems] = useState<ComboBoxitemsType[]>([])
  const [loadingTenants, setLoadingTenants] = useState<boolean>(true)
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null)

  // Lease details state
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [leaseDuration, setLeaseDuration] = useState<number | null>(null)
  const leaseHasDuration = leaseDuration !== null && leaseDuration > 0

  // Payment details state
  const [monthlyRent, setMonthlyRent] = useState<string>('')
  const [paymentDay, setPaymentDay] = useState<number>(1)
  const [initialCharges, setInitialCharges] = useState<ChargeData[]>([])
  const [lateCharges, setLateCharges] = useState<LateCharge[]>([])

  // Payment status state (managed by PaymentSection)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusData>({
    isPaid: false,
    paymentMethod: 'Cash',
    paymentDate: undefined,
    paymentTime: '10:30:00',
    receiptFile: null
  })

  // Reminders state
  const [leaseExpiryReminder, setLeaseExpiryReminder] = useState<{
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

  // Fetch room config (title and property info)
  useEffect(() => {
    const fetchRoomConfig = async () => {
      setIsRoomConfigLoading(true)
      try {
        const response = await fetch(`/api/rooms/${roomId}/config`)
        if (response.ok) {
          const data = await response.json()
          setRoomConfig({
            roomTitle: data.roomTitle,
            propertyCode: data.propertyCode,
            propertyId: data.propertyId
          })
        }
      } catch (error) {
        console.error('Error fetching room config:', error)
      } finally {
        setIsRoomConfigLoading(false)
      }
    }

    fetchRoomConfig()
  }, [roomId])

  // Fetch default configurations for this room
  useEffect(() => {
    const fetchDefaultConfig = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}/default-config`)
        if (response.ok) {
          const data = await response.json()
          if (data.hasDefaults) {
            // Set payment config
            setDefaultPaymentConfig({
              monthlyRent: data.leaseConfig?.default_monthly_rent?.toString() || undefined,
              paymentDay: data.leaseConfig?.default_payment_day || undefined,
              initialCharges: data.initialCharges,
              lateCharges: data.latePaymentCharges
            })
            // Set reminder config
            setDefaultReminderConfig(data.leaseConfig || undefined)
            setDefaultConfigStatus('loaded')
          } else {
            setDefaultConfigStatus('empty')
          }
        } else {
          setDefaultConfigStatus('error')
        }
      } catch (error) {
        console.error('Error fetching default config:', error)
        setDefaultConfigStatus('error')
      }
    }

    fetchDefaultConfig()
  }, [roomId])

  // Fetch tenants for organization
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const response = await fetch('/api/leases/tenants')
        if (response.ok) {
          const data = await response.json()
          setTenantItems(data.tenants)
        }
      } catch (error) {
        console.error('Error fetching tenants:', error)
      } finally {
        setLoadingTenants(false)
      }
    }

    fetchTenants()
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

    if (!selectedTenantId) {
      showAlert('Please select a tenant', 'warning')
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

    // Validate payment date is not in the future (only for paid payments)
    if (isPaid) {
      const paymentDateTime = new Date(
        `${paymentDate.toISOString().split('T')[0]}T${paymentTime}`
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
    if (leaseExpiryReminder.enabled && !leaseExpiryReminder.days) {
      showAlert('Please specify days for lease expiry reminder', 'warning')
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

    if (!roomConfig?.propertyId) {
      showAlert('Room configuration not loaded. Please try again.', 'error')
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
      const formattedStartDate = startDate.toISOString().split('T')[0]
      const formattedPaymentDate = paymentDate.toISOString().split('T')[0]

      // Create lease - include both property_id and room_id for room leases
      const response = await fetch('/api/leases/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          property_id: roomConfig.propertyId,
          room_id: roomId, // This makes it a room lease
          tenant_id: selectedTenantId,
          start_date: formattedStartDate,
          number_of_months: leaseDuration,
          payment_day: paymentDay,
          monthly_rent: parseFloat(monthlyRent) || 0,
          // Reminders
          is_expiry_reminder: leaseExpiryReminder.enabled,
          expiry_days_before_reminder: leaseExpiryReminder.enabled
            ? parseInt(leaseExpiryReminder.days)
            : null,
          is_rent_reminder: rentReminder.enabled,
          rent_reminder_days_before: rentReminder.enabled
            ? parseInt(rentReminder.days)
            : null,
          is_overdue_rent_reminder: overdueReminder.enabled,
          overdue_days_after_reminder: overdueReminder.enabled
            ? parseInt(overdueReminder.days)
            : null,
          // Initial charges payment
          initial_charges: initialCharges,
          is_paid: isPaid,
          payment_method: paymentMethod,
          payment_date: formattedPaymentDate,
          payment_time: paymentTime,
          receipt_image: receiptUrl,
          // Late payment charges
          late_charges: lateCharges
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create lease')
      }

      await response.json()
      FeedbackToasts.created('Lease')
      setTimeout(() => {
        window.location.href = `/rooms/${roomId}/leases`
      }, 1500)
    } catch (error: any) {
      console.error('Error creating lease:', error)
      FeedbackToasts.createFailed('lease', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
      {/* Head section */}
      <AddPageHead
        crumb_items={[
          { label: 'Rooms', href: '/rooms' },
          { label: roomConfig?.roomTitle, href: `/rooms/${roomId}/leases` },
          { label: 'Add Lease' }
        ]}
        isCrumbLoading={isRoomConfigLoading}
        title='Add a lease'
        subtitle={`Create a new lease for ${roomConfig?.roomTitle || 'this room'}`}
        className='mb-7.5'
        isSubmitting={isSubmitting}
      />
      {/* Default config loading feedback - non-blocking */}
      <div className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-300
        ${defaultConfigStatus === 'loading' ? 'bg-blue-50 text-blue-700' : ''}
        ${defaultConfigStatus === 'loaded' ? 'bg-green-50 text-green-700' : ''}
        ${defaultConfigStatus === 'empty' ? 'bg-neutral-100 text-neutral-600' : ''}
        ${defaultConfigStatus === 'error' ? 'bg-red-50 text-red-700' : ''}
      `}>
        {defaultConfigStatus === 'loading' && (
          <>
            <Loader2 className='w-4 h-4 animate-spin' />
            <span>Loading default configurations...</span>
          </>
        )}
        {defaultConfigStatus === 'loaded' && (
          <>
            <CheckCircle2 className='w-4 h-4' />
            <span>Default configurations applied</span>
          </>
        )}
        {defaultConfigStatus === 'empty' && (
          <>
            <Info className='w-4 h-4' />
            <span>No default configurations set for this room</span>
          </>
        )}
        {defaultConfigStatus === 'error' && (
          <>
            <AlertCircle className='w-4 h-4' />
            <span>Could not load default configurations</span>
          </>
        )}
      </div>

      <CollapsibleSection number={1} title={'Lease & Payment Details'}>
        {/* Basic Details */}
        <InnerSection title='Lease Details' subtitle='Enter the lease details'>
          <div>
            <div className='inputs-container'>
              <InputGroup label='Start Date' isRequired>
                <DatePicker
                  value={startDate}
                  onValueChange={setStartDate}
                />
              </InputGroup>
              <InputGroup label='Lease Duration (Months)'>
                <Input
                  type='number'
                  min={1}
                  placeholder='Enter lease duration in months'
                  value={leaseDuration ?? ''}
                  onChange={e => {
                    const value = e.target.value
                    setLeaseDuration(value === '' ? null : Number(value))
                  }}
                />
              </InputGroup>
            </div>
            {/* Lease Duration Info Note */}
            {startDate && (
              <div className='mt-4 p-3 rounded-md bg-blue-50 border border-blue-200'>
                <div className='flex items-start gap-2 text-sm text-blue-800'>
                  <Info strokeWidth={1.5} size={18} className='mt-0.5 shrink-0' />
                  <div className='flex flex-col gap-1'>
                    {leaseHasDuration ? (
                      <>
                        <p>
                          <span className='font-medium'>Lease period:</span>{' '}
                          {formatDate(startDate)} to{' '}
                          {formatDate(calculateEndDate(startDate, leaseDuration!))}
                        </p>
                        <p>
                          <span className='font-medium'>Rental invoices:</span>{' '}
                          First month rental is generated immediately. Next month's invoice is generated once the current rental is paid, due on the payment day set below.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          <span className='font-medium'>Lease period:</span>{' '}
                          Starts {formatDate(startDate)} with no expiry date (ongoing lease).
                        </p>
                        <p>
                          <span className='font-medium'>Rental invoices:</span>{' '}
                          First month rental is generated immediately. Next month's invoice is generated once the current rental is paid, due on the payment day set below.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className='inputs-container'>
            <InputGroup label='Tenant' isRequired>
              <Combobox
                items={tenantItems}
                searchPlaceholder='Search tenants'
                variant='single'
                placeholder={
                  loadingTenants ? 'Loading tenants...' : 'Select tenant'
                }
                showAvatar
                isLoading={loadingTenants}
                loadingMessage='Fetching tenants...'
                onValueChange={value => setSelectedTenantId(value || null)}
                required
              />
            </InputGroup>
          </div>
        </InnerSection>
        {/* Payment details */}
        <PaymentSection
          onInitialChargesChange={setInitialCharges}
          onMonthlyRentChange={setMonthlyRent}
          onPaymentDayChange={setPaymentDay}
          onLateChargesChange={setLateCharges}
          onPaymentStatusChange={setPaymentStatus}
          defaultConfig={defaultPaymentConfig}
        />
      </CollapsibleSection>

      {/* Reminders details */}
      <ReminderSection
        sectionNumber={2}
        title='Lease Reminders (Optional)'
        defaultCollapse
        onLeaseExpiryChange={(enabled, days) =>
          setLeaseExpiryReminder({ enabled, days })
        }
        onRentReminderChange={(enabled, days) =>
          setRentReminder({ enabled, days })
        }
        onOverdueReminderChange={(enabled, days) =>
          setOverdueReminder({ enabled, days })
        }
        defaultReminders={defaultReminderConfig}
      />

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

export default AddRoomLease
