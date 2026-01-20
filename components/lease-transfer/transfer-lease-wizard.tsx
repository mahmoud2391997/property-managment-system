'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  AlertTriangle,
  Info,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { FeedbackToasts } from '@/components/costume-ui/feedback-toast'
import { formatDateForAPI } from '@/utils/formatTime'

// UI Components
import StepIndicator from './step-indicator'
import TransferSummary from './transfer-summary'
import AddPageHead from '@/components/costume-ui/add-page-head'
import CollapsibleSection from '@/components/costume-ui/collapsible-section'
import InnerSection from '@/components/costume-ui/collapsible-inner-section'
import InputGroup from '@/components/costume-ui/input-group'
import Input from '@/components/costume-ui/input'
import DatePicker from '@/components/costume-ui/date-picker'
import Select from '@/components/costume-ui/select'
import Combobox from '@/components/costume-ui/combobox'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import UploadFile from '@/components/costume-ui/upload-file'
import {
  LateCharge,
  PaymentStatusData
} from '@/components/costume-ui/payment-section'
import ReminderSection from '@/components/costume-ui/reminder-section'
import ChargesSection, {
  ChargeData
} from '@/components/costume-ui/charges-section'
import LateChargesSection from '@/components/costume-ui/late-charges-section'
import TimePicker from '@/components/costume-ui/time-picker'
import RadioGroup from '@/components/costume-ui/radio-group'
import Alert from '@/components/costume-ui/alert'
import { PRIORITY_LEVELS } from '@/components/task-ui/types'
import Button from '../costume-ui/button'
import { Button as ShadcnButton } from '../ui/button'

type TransferInfoResponse = {
  lease: {
    id: string
    reference_id: string
    monthly_rent: number
    payment_day: number
    number_of_months: number | null
    start_date: string
    is_property_lease: boolean
    is_expiry_reminder: boolean
    expiry_days_before_reminder: number | null
    is_rent_reminder: boolean
    rent_reminder_days_before: number | null
    is_overdue_rent_reminder: boolean
    overdue_days_after_reminder: number | null
    tenant: {
      id: string
      name: string
      profile_thumb: string | null
    }
    property: {
      id: string
      code: string
    }
    room?: {
      id: string
      title: string
    } | null
    late_charges: Array<{ days_after_due: number; amount: number }>
    initial_charges: Array<{
      type: string
      amount: number
      is_taxed: boolean
      is_refundable: boolean
    }>
    next_pending_rental: {
      id: string
      reference_id: string
      due_date: string | null
      amount: number
    } | null
    pending_rentals: Array<{
      id: string
      reference_id: string
      due_date: string | null
      amount: number
    }>
  }
  can_transfer: boolean
  blocked_reason?: string
}

type Destination = {
  id: string
  label: string
  subtitle?: string
  property_id?: string
  default_rent?: number | null
}

type DestinationsResponse = {
  lease_type: 'property' | 'room'
  destinations: Destination[]
}

type Props = {
  leaseId: string
  sourceType: 'property' | 'room'
  sourceId: string
}

const STEPS = [
  { number: 1, title: 'End Current Lease' },
  { number: 2, title: 'Create New Lease' }
]

export default function TransferLeaseWizard ({
  leaseId,
  sourceType,
  sourceId
}: Props) {
  const router = useRouter()

  // Loading states
  const [isLoadingInfo, setIsLoadingInfo] = useState(true)
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingStaff, setLoadingStaff] = useState(false)

  // Data states
  const [transferInfo, setTransferInfo] = useState<TransferInfoResponse | null>(
    null
  )
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [staffList, setStaffList] = useState<
    Array<{ id: string; name: string; role?: string }>
  >([])

  // Step state
  const [currentStep, setCurrentStep] = useState(1)

  // Alert state
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertType, setAlertType] = useState<
    'info' | 'error' | 'success' | 'warning'
  >('info')

  // Step 1 form state (Ending flow)
  const [endingTitle, setEndingTitle] = useState('')
  const [endingDescription, setEndingDescription] = useState('')
  const [endingPriority, setEndingPriority] = useState('')
  const [endingAttachmentFile, setEndingAttachmentFile] = useState<File | null>(
    null
  )
  const [endingAssignedStaffId, setEndingAssignedStaffId] = useState<
    string | null
  >(null)

  // Step 2 form state (New lease)
  const [selectedDestinationId, setSelectedDestinationId] = useState<
    string | null
  >(null)
  const [leaseDuration, setLeaseDuration] = useState<number | null>(null)
  const [monthlyRent, setMonthlyRent] = useState<string>('')
  const [paymentDay, setPaymentDay] = useState<number>(1)
  const [initialCharges, setInitialCharges] = useState<ChargeData[]>([])
  const [lateCharges, setLateCharges] = useState<LateCharge[]>([])
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusData>({
    isPaid: false,
    paymentMethod: 'Bank Transfer', // Always Bank Transfer for transfer lease
    paymentDate: undefined,
    paymentTime: '10:30:00',
    receiptFile: null
  })

  // Rental schedule state (cycle-based like schedule rent modal)
  const [selectedCycle, setSelectedCycle] = useState<string>('')

  // Rental adjustment state (for when new rent > old rent with advance payments)
  const [enableRentalAdjustment, setEnableRentalAdjustment] = useState(false)
  const [rentalAdjustmentAmount, setRentalAdjustmentAmount] =
    useState<string>('')
  const [rentalAdjustmentDueDate, setRentalAdjustmentDueDate] = useState<
    Date | undefined
  >(undefined)

  // Reminder state
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

  // Generate cycle options for rental schedule (like schedule rent modal)
  const cycleOptions = useMemo(() => {
    if (!transferInfo) return []

    const cycles: { value: string; label: string }[] = []
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ]

    // Determine starting cycle based on current pending rental or today's date
    let startDate: Date
    if (transferInfo.lease.next_pending_rental?.due_date) {
      // Start from the current pending rental's month
      const pendingDue = new Date(
        transferInfo.lease.next_pending_rental.due_date
      )
      startDate = new Date(pendingDue.getFullYear(), pendingDue.getMonth(), 1)
    } else {
      // No pending payment - start from current month
      const today = new Date()
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    }

    // Generate cycles for next 24 months
    for (let i = 0; i < 24; i++) {
      const cycleDate = new Date(startDate)
      cycleDate.setMonth(cycleDate.getMonth() + i)

      const isCurrentCycle =
        i === 0 && transferInfo.lease.next_pending_rental?.due_date !== null

      cycles.push({
        value: `${cycleDate.getFullYear()}-${cycleDate.getMonth()}`,
        label: isCurrentCycle
          ? `${
              monthNames[cycleDate.getMonth()]
            } ${cycleDate.getFullYear()} (Current Cycle)`
          : `${monthNames[cycleDate.getMonth()]} ${cycleDate.getFullYear()}`
      })
    }

    return cycles
  }, [transferInfo])

  const selectedCycleValue = useMemo(() => {
      if (!selectedCycle) return undefined
      if (cycleOptions.length === 0) return undefined
      return cycleOptions.some(opt => opt.value === selectedCycle)
        ? selectedCycle
        : undefined
    }, [selectedCycle, cycleOptions])

  // Get selected cycle info
  const selectedCycleInfo = useMemo(() => {
    if (!selectedCycle || !transferInfo) return null
    const [year, month] = selectedCycle.split('-').map(Number)
    const cycleDate = new Date(year, month, paymentDay)

    // Check if this is the current cycle (same as pending rental)
    let isCurrentCycle = false
    if (transferInfo.lease.next_pending_rental?.due_date) {
      const pendingDate = new Date(
        transferInfo.lease.next_pending_rental.due_date
      )
      isCurrentCycle =
        pendingDate.getFullYear() === year && pendingDate.getMonth() === month
    }

    return { year, month, date: cycleDate, isCurrentCycle }
  }, [selectedCycle, paymentDay, transferInfo])

  // Memoize default late charges from transferInfo to prevent infinite re-renders
  const defaultLateChargesForSection = useMemo(() => {
    if (!transferInfo) return []
    return transferInfo.lease.late_charges.map(lc => ({
      days_after_due: lc.days_after_due,
      amount: lc.amount
    }))
  }, [transferInfo])

  // Memoize advance payments calculation to prevent infinite re-renders
  const advancePaymentsInfo = useMemo(() => {
    if (!transferInfo) return null

    const newRent = parseFloat(monthlyRent) || 0
    const oldRent = transferInfo.lease.monthly_rent || 0
    const pendingRentals = transferInfo.lease.pending_rentals || []

    // Filter to only future pending rentals (advance payments)
    const now = new Date()
    const advancePayments = pendingRentals.filter(
      p => p.due_date && new Date(p.due_date) > now
    )

    if (newRent <= oldRent || advancePayments.length === 0) {
      return null
    }

    const rentDifference = newRent - oldRent
    const totalAdjustment = rentDifference * advancePayments.length

    // Format month names for display
    const advanceMonths = advancePayments.map(p => {
      const date = new Date(p.due_date!)
      return date.toLocaleDateString('en-GB', {
        month: 'long',
        year: 'numeric'
      })
    })

    return {
      newRent,
      oldRent,
      rentDifference,
      totalAdjustment,
      advancePayments,
      advanceMonths
    }
  }, [transferInfo, monthlyRent])

  // Memoize payment day options to prevent creating new arrays on each render
  const paymentDayOptions = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => ({
      value: String(i + 1),
      label: `Day ${i + 1}`
    }))
  }, [])

  // Memoize initial charges to prevent creating new arrays on each render
  const preparedInitialCharges = useMemo(() => {
    const oldLeaseCharges = transferInfo?.lease.initial_charges || []
    return oldLeaseCharges.filter(c => c.type !== 'First Month Rental')
  }, [transferInfo])

  // Memoize callback for late charges to prevent recreating on each render
  const handleLateChargesChange = useCallback((charges: LateCharge[]) => {
    setLateCharges(
      charges.map(lc => ({
        days_after_due: lc.days_after_due,
        amount: lc.amount.toString()
      }))
    )
  }, [])

  const showAlert = (
    message: string,
    type: 'info' | 'error' | 'success' | 'warning' = 'info'
  ) => {
    setAlertMessage(message)
    setAlertType(type)
    setAlertOpen(true)
  }

  // Fetch transfer info on mount
  useEffect(() => {
    const fetchTransferInfo = async () => {
      try {
        const response = await fetch(`/api/leases/${leaseId}/transfer-info`)
        if (!response.ok) {
          throw new Error('Failed to fetch transfer info')
        }
        const data: TransferInfoResponse = await response.json()
        setTransferInfo(data)

        // Pre-fill Step 2 form from source lease
        setMonthlyRent(data.lease.monthly_rent.toString())
        setPaymentDay(data.lease.payment_day)
        setLeaseDuration(data.lease.number_of_months)

        // Pre-fill late charges
        if (data.lease.late_charges.length > 0) {
          setLateCharges(
            data.lease.late_charges.map(lc => ({
              days_after_due: lc.days_after_due,
              amount: lc.amount.toString()
            }))
          )
        }

        // Pre-fill reminders
        if (data.lease.is_expiry_reminder) {
          setLeaseExpiryReminder({
            enabled: true,
            days: data.lease.expiry_days_before_reminder?.toString() || ''
          })
        }
        if (data.lease.is_rent_reminder) {
          setRentReminder({
            enabled: true,
            days: data.lease.rent_reminder_days_before?.toString() || ''
          })
        }
        if (data.lease.is_overdue_rent_reminder) {
          setOverdueReminder({
            enabled: true,
            days: data.lease.overdue_days_after_reminder?.toString() || ''
          })
        }

        // Pre-fill selected cycle from next pending rental (if exists)
        // The cycle value format is "YYYY-M" (e.g., "2026-0" for January 2026)
        if (data.lease.next_pending_rental?.due_date) {
          const pendingDate = new Date(data.lease.next_pending_rental.due_date)
          setSelectedCycle(
            `${pendingDate.getFullYear()}-${pendingDate.getMonth()}`
          )
        }
      } catch (error) {
        console.error('Error fetching transfer info:', error)
        FeedbackToasts.createFailed(
          'transfer info',
          'Failed to load transfer info'
        )
      } finally {
        setIsLoadingInfo(false)
      }
    }

    fetchTransferInfo()
  }, [leaseId])

  // Fetch destinations when step 2 is reached
  useEffect(() => {
    if (currentStep === 2 && destinations.length === 0) {
      fetchDestinations()
    }
  }, [currentStep])

  // Fetch staff when step 1 is reached
  useEffect(() => {
    if (currentStep === 1 && staffList.length === 0) {
      fetchStaffList()
    }
  }, [currentStep])

  const fetchDestinations = async () => {
    setIsLoadingDestinations(true)
    try {
      const response = await fetch(
        `/api/leases/${leaseId}/transfer-destinations`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch destinations')
      }
      const data: DestinationsResponse = await response.json()
      setDestinations(data.destinations)
    } catch (error) {
      console.error('Error fetching destinations:', error)
      FeedbackToasts.createFailed('destinations', 'Failed to load destinations')
    } finally {
      setIsLoadingDestinations(false)
    }
  }

  const fetchStaffList = async () => {
    setLoadingStaff(true)
    try {
      const response = await fetch('/api/tasks/staff')
      if (response.ok) {
        const data = await response.json()
        setStaffList(data)
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
    } finally {
      setLoadingStaff(false)
    }
  }

  // Get selected destination
  const selectedDestination = destinations.find(
    d => d.id === selectedDestinationId
  )

  // Validate Step 1
  const validateStep1 = (): boolean => {
    if (!endingTitle.trim()) {
      showAlert('Please enter a title for the inspection task', 'warning')
      return false
    }
    if (!endingDescription.trim()) {
      showAlert('Please enter a description for the inspection task', 'warning')
      return false
    }
    if (!endingPriority) {
      showAlert('Please select a priority', 'warning')
      return false
    }
    if (!endingAssignedStaffId) {
      showAlert('Please assign a staff member', 'warning')
      return false
    }
    return true
  }

  // Validate Step 2
  const validateStep2 = (): boolean => {
    if (!selectedDestinationId) {
      showAlert('Please select a destination', 'warning')
      return false
    }
    if (!monthlyRent || parseFloat(monthlyRent) <= 0) {
      showAlert('Please enter a valid monthly rent', 'warning')
      return false
    }
    // First rental cycle is required
    if (!selectedCycle) {
      showAlert('Please select a first rental cycle', 'warning')
      return false
    }
    // If there are initial charges, validate payment status
    if (initialCharges.length > 0) {
      if (!paymentStatus.paymentDate) {
        showAlert('Please select a payment date for initial charges', 'warning')
        return false
      }
      if (!paymentStatus.paymentTime) {
        showAlert('Please select a payment time for initial charges', 'warning')
        return false
      }
      // Receipt is required when paid (always Bank Transfer)
      if (paymentStatus.isPaid && !paymentStatus.receiptFile) {
        showAlert('Please upload a receipt for the bank transfer', 'warning')
        return false
      }
    }
    // If rental adjustment is enabled, validate amount and due date
    if (enableRentalAdjustment) {
      if (!rentalAdjustmentAmount || parseFloat(rentalAdjustmentAmount) <= 0) {
        showAlert('Please enter a valid rental adjustment amount', 'warning')
        return false
      }
      if (!rentalAdjustmentDueDate) {
        showAlert('Please select a rental adjustment due date', 'warning')
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2)
    }
  }

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep1() || !validateStep2()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Upload attachment if present
      let attachmentUrl: string | null = null
      if (endingAttachmentFile) {
        const formData = new FormData()
        formData.append('file', endingAttachmentFile)
        formData.append('bucket', 'tasks')

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload attachment')
        }

        const uploadData = await uploadResponse.json()
        attachmentUrl = uploadData.url
      }

      // Upload receipt if present
      let receiptUrl: string | null = null
      if (
        paymentStatus.receiptFile &&
        paymentStatus.isPaid &&
        paymentStatus.paymentMethod === 'Bank Transfer'
      ) {
        const formData = new FormData()
        formData.append('file', paymentStatus.receiptFile)
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

      // Determine destination
      const isPropertyLease = transferInfo?.lease.is_property_lease
      const destinationPropertyId = isPropertyLease
        ? selectedDestinationId
        : null
      const destinationRoomId = !isPropertyLease ? selectedDestinationId : null

      // Build request body
      const hasCharges = initialCharges.length > 0
      const requestBody = {
        source_lease_id: leaseId,
        ending_task: {
          title: endingTitle.trim(),
          description: endingDescription.trim(),
          priority: endingPriority,
          attachment: attachmentUrl,
          assigned_staff_id: endingAssignedStaffId
        },
        new_lease: {
          destination_property_id: destinationPropertyId,
          destination_room_id: destinationRoomId,
          transfer_date: formatDateForAPI(new Date()), // Transfer is immediate
          monthly_rent: parseFloat(monthlyRent) || 0,
          payment_day: paymentDay,
          number_of_months: leaseDuration,
          initial_charges: initialCharges,
          late_charges: lateCharges,
          // Payment status only relevant when there are initial charges
          is_paid: hasCharges ? paymentStatus.isPaid : false,
          payment_method: hasCharges ? paymentStatus.paymentMethod : null,
          payment_date:
            hasCharges && paymentStatus.paymentDate
              ? formatDateForAPI(paymentStatus.paymentDate)
              : null,
          payment_time: hasCharges ? paymentStatus.paymentTime : null,
          receipt_image: hasCharges ? receiptUrl : null,
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
          // First rental payment schedule (from cycle selection)
          first_rental_due_date: selectedCycleInfo
            ? formatDateForAPI(selectedCycleInfo.date)
            : null,
          // Rental adjustment (for rent increase with advance payments)
          rental_adjustment: enableRentalAdjustment
            ? {
                amount: parseFloat(rentalAdjustmentAmount) || 0,
                due_date: rentalAdjustmentDueDate
                  ? formatDateForAPI(rentalAdjustmentDueDate)
                  : null
              }
            : null
        }
      }

      const response = await fetch('/api/leases/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to transfer lease')
      }

      FeedbackToasts.created(
        'Lease Transfer',
        'Lease transferred successfully. Inspection task created.'
      )

      // Navigate to the inspection task
      router.push(`/tasks/${data.inspection_task_id}`)
    } catch (error: any) {
      console.error('Error transferring lease:', error)
      FeedbackToasts.createFailed('lease transfer', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isLoadingInfo) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <Loader2 className='w-8 h-8 animate-spin text-neutral-400' />
      </div>
    )
  }

  // Blocked state
  if (transferInfo && !transferInfo.can_transfer) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[400px] gap-4'>
        <AlertTriangle className='w-12 h-12 text-amber-500' />
        <p className='texts-body-medium text-center text-(--text-secondary)'>
          {transferInfo.blocked_reason || 'This lease cannot be transferred'}
        </p>
        <button
          onClick={() => router.back()}
          className='flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800'
        >
          <ArrowLeft className='w-4 h-4' />
          Go Back
        </button>
      </div>
    )
  }

  // Convert data for UI
  const staffItems = staffList.map(s => ({
    id: s.id,
    label: s.name,
    subtitle: s.role
  }))

  const priorityItems = PRIORITY_LEVELS.map(p => ({
    value: p,
    label: p
  }))

  const destinationItems = destinations.map(d => ({
    id: d.id,
    label: d.subtitle ? `${d.subtitle} - ${d.label}` : d.label,
    subtitle: d.default_rent
      ? `RM ${d.default_rent.toLocaleString('en-MY', {
          minimumFractionDigits: 2
        })}/month`
      : undefined
  }))

  // Build breadcrumb dynamically using property/room name from transferInfo
  // Goes back to leases section (like add-lease page does)
  const dynamicBreadcrumbs = (() => {
    if (sourceType === 'property') {
      return [
        { label: 'Properties', href: '/properties' },
        {
          label: transferInfo?.lease.property.code || null,
          href: `/properties/${sourceId}/leases`
        },
        { label: 'Transfer Lease' }
      ]
    } else {
      // Room lease
      const roomTitle = transferInfo?.lease.room?.title
      const propertyCode = transferInfo?.lease.property.code
      return [
        { label: 'Rooms', href: '/rooms' },
        {
          label: roomTitle ? `${propertyCode}(${roomTitle})` : null,
          href: `/rooms/${sourceId}/leases`
        },
        { label: 'Transfer Lease' }
      ]
    }
  })()

  return (
    <div className='flex flex-col gap-5'>
      {/* Head section */}
      <AddPageHead
        crumb_items={dynamicBreadcrumbs}
        isCrumbLoading={isLoadingInfo}
        title='Transfer Lease'
        subtitle='Move tenant to a new location'
        className='mb-2'
        isSubmitting={isSubmitting}
      />

      {/* Transfer Summary - at the top */}
      {transferInfo && (
        <TransferSummary
          transferInfo={{
            tenant: transferInfo.lease.tenant,
            source: {
              propertyCode: transferInfo.lease.property.code,
              roomTitle: transferInfo.lease.room?.title,
              monthlyRent: transferInfo.lease.monthly_rent
            },
            destination: selectedDestination
              ? {
                  label: selectedDestination.label,
                  subtitle: selectedDestination.subtitle,
                  monthlyRent: parseFloat(monthlyRent) || undefined
                }
              : null
          }}
          currentStep={currentStep}
        />
      )}

      {/* Step Indicator */}
      <StepIndicator steps={STEPS} currentStep={currentStep} />

      {/* Main Content */}
      <div>
        {/* Step 1: End Current Lease */}
        {currentStep === 1 && (
          <div className='space-y-6'>
            {/* Warning Banner */}
            <div className='p-4 bg-amber-50 border border-amber-200 rounded-lg'>
              <div className='flex gap-3'>
                <AlertTriangle className='w-5 h-5 text-amber-600 shrink-0 mt-0.5' />
                <div>
                  <p className='texts-body-small-medium text-amber-800'>
                    Step 1: End the current lease and create an inspection task.
                  </p>
                  <p className='texts-body-small text-amber-700 mt-1'>
                    This will:
                  </p>
                  <ul className='texts-body-small text-amber-700 mt-1 list-disc list-inside space-y-0.5'>
                    <li>Change current lease status to "Ended"</li>
                    <li>Cancel all pending payments</li>
                    <li>Close all open tickets</li>
                    <li>Create an inspection task for the vacated unit</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Inspection Task Form - no collapsible wrapper */}
            <div className='bg-white border border-(--border-default) rounded-lg p-6 space-y-5'>
              <div>
                <h3 className='texts-body-large-medium text-(--text-primary)'>
                  Inspection Task Details
                </h3>
                <p className='texts-body-small text-(--text-secondary) mt-1'>
                  Details for the inspection task
                </p>
              </div>

              <div className='space-y-4'>
                <InputGroup label='Title' isRequired>
                  <Input
                    placeholder='E.g. End of Lease Inspection - Transfer'
                    value={endingTitle}
                    onChange={e => setEndingTitle(e.target.value)}
                    minLength={5}
                    maxLength={200}
                    required
                  />
                </InputGroup>

                <InputGroup label='Description' isRequired>
                  <Textarea
                    className={cn(
                      'flex items-center',
                      'bg-(--background-secondary) border border-(--border-strong)',
                      'placeholder:text-(--text-placeholder)',
                      'focus:placeholder:text-(--text-secondary) hover:bg-neutral-100 focus:hover:bg-neutral-50',
                      'transition-colors duration-200',
                      'texts-body-small shadows-xs',
                      'w-full p-2.5',
                      'rounded-[5]',
                      'min-h-[120px] resize-none'
                    )}
                    placeholder='Describe what needs to be inspected before transfer...'
                    value={endingDescription}
                    onChange={e => setEndingDescription(e.target.value)}
                    minLength={10}
                    maxLength={2000}
                    required
                  />
                </InputGroup>

                <div className='inputs-container'>
                  <InputGroup label='Priority' isRequired>
                    <Select
                      label='Priority'
                      items={priorityItems}
                      placeholder='Select priority'
                      value={endingPriority}
                      onChange={setEndingPriority}
                      required
                    />
                  </InputGroup>

                  <InputGroup label='Assign To' isRequired>
                    <Combobox
                      items={staffItems}
                      variant='single'
                      searchPlaceholder='Search staff'
                      placeholder={
                        loadingStaff
                          ? 'Loading staff...'
                          : 'Select staff member'
                      }
                      onValueChange={value =>
                        setEndingAssignedStaffId(value || null)
                      }
                      isLoading={loadingStaff}
                      loadingMessage='Fetching staff...'
                      required
                    />
                  </InputGroup>
                </div>

                <InputGroup label='Attachment'>
                  <UploadFile
                    onFileChange={setEndingAttachmentFile}
                    maxSizeMB={2}
                  />
                </InputGroup>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Create New Lease */}
        {currentStep === 2 && (
          <div className='space-y-6'>
            {/* Info Banner */}
            <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='flex gap-3'>
                <Info className='w-5 h-5 text-blue-600 shrink-0 mt-0.5' />
                <div>
                  <p className='texts-body-small-medium text-blue-800'>
                    Step 2: Create a new lease at the destination.
                  </p>
                  <p className='texts-body-small text-blue-700 mt-1'>
                    The form is pre-filled with values from the current lease.
                    Adjust as needed for the new location.
                  </p>
                </div>
              </div>
            </div>

            <CollapsibleSection number={1} title='New Lease Details'>
              <InnerSection
                title='Destination & Transfer Date'
                subtitle='Select where to transfer the lease'
              >
                <div className='inputs-container'>
                  <InputGroup label='Destination' isRequired>
                    <Combobox
                      items={destinationItems}
                      variant='single'
                      searchPlaceholder={`Search ${
                        transferInfo?.lease.is_property_lease
                          ? 'properties'
                          : 'rooms'
                      }...`}
                      placeholder={
                        isLoadingDestinations
                          ? 'Loading destinations...'
                          : destinations.length === 0
                          ? 'No available destinations'
                          : `Select ${
                              transferInfo?.lease.is_property_lease
                                ? 'property'
                                : 'room'
                            }`
                      }
                      onValueChange={value => {
                        setSelectedDestinationId(value || null)
                        // Keep old lease rent - don't update from destination
                      }}
                      isLoading={isLoadingDestinations}
                      loadingMessage='Fetching destinations...'
                      required
                      disabled={destinations.length === 0}
                    />
                  </InputGroup>
                </div>
              </InnerSection>
            </CollapsibleSection>

            {/* Section 2: Rental Details - All rental-related fields together */}
            <CollapsibleSection title='Rental Details' number={2}>
              <InnerSection
                title='Monthly Rent'
                subtitle='Set the monthly rent for the new lease'
              >
                <div className='inputs-container'>
                  <InputGroup label='Monthly Rent' isRequired>
                    <Input
                      currency
                      value={monthlyRent}
                      onValueChange={value => setMonthlyRent(value || '')}
                      placeholder='Enter monthly rent'
                    />
                  </InputGroup>
                  <InputGroup label='Payment Day' isRequired>
                    <Select
                      label='Payment Day'
                      placeholder='Select payment day'
                      items={paymentDayOptions}
                      value={String(paymentDay)}
                      onChange={value => setPaymentDay(parseInt(value))}
                    />
                  </InputGroup>
                </div>
              </InnerSection>

              <InnerSection
                title='First Rental Cycle'
                subtitle='Select when to start issuing rental payments for the new lease'
              >
                {/* Info about current pending rental */}
                {transferInfo?.lease.next_pending_rental ? (
                  <div className='-mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4'>
                    <div className='flex gap-2'>
                      <Info className='w-4 h-4 text-blue-600 shrink-0 mt-0.5' />
                      <div className='texts-body-small text-blue-800'>
                        <p>
                          Current lease has a pending rental (
                          {transferInfo.lease.next_pending_rental.reference_id})
                          due on{' '}
                          <span className='font-medium'>
                            {new Date(
                              transferInfo.lease.next_pending_rental.due_date!
                            ).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>{' '}
                          for RM{' '}
                          {transferInfo.lease.next_pending_rental.amount.toFixed(
                            2
                          )}
                          . This payment will be cancelled upon transfer.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='p-3 -mt-2 bg-neutral-50 border border-neutral-200 rounded-lg mb-4'>
                    <div className='flex gap-2'>
                      <Info className='w-4 h-4 text-neutral-500 shrink-0 mt-0.5' />
                      <p className='texts-body-small text-neutral-600'>
                        No pending rental payment found for the current lease.
                      </p>
                    </div>
                  </div>
                )}

                <div className='flex flex-col gap-5 -mt-6'>
                  <InputGroup label='First Rental Cycle' isRequired>
                    <Select
                      label='Select Cycle'
                      items={cycleOptions}
                      placeholder='Select cycle'
                      value={selectedCycleValue} // Changed from the inline expression
                      onChange={setSelectedCycle}
                    />
                  </InputGroup>

                  {/* Warning if cycle changed from original */}
                  {selectedCycleInfo &&
                    !selectedCycleInfo.isCurrentCycle &&
                    transferInfo?.lease.next_pending_rental && (
                      <div className=' p-3 bg-amber-50 border border-amber-200 rounded-lg'>
                        <div className='flex gap-2'>
                          <AlertTriangle className='w-4 h-4 text-amber-600 shrink-0 mt-0.5' />
                          <p className='texts-body-small text-amber-800'>
                            The selected cycle differs from the current rental
                            payment schedule. The current pending payment is for{' '}
                            <span className='font-medium'>
                              {new Date(
                                transferInfo.lease.next_pending_rental.due_date!
                              ).toLocaleDateString('en-GB', {
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                            .
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Display calculated due date */}
                  {selectedCycleInfo && (
                    <div className='p-3 bg-neutral-50 border border-neutral-200 rounded-lg'>
                      <p className='texts-body-small text-neutral-700'>
                        First rental payment will be due on{' '}
                        <span className='font-medium'>
                          {selectedCycleInfo.date.toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>{' '}
                        (Day {paymentDay})
                      </p>
                    </div>
                  )}
                </div>
              </InnerSection>

              {/* Rental Adjustment Section - Only show if new rent > old rent AND has advance payments */}
              {advancePaymentsInfo && (
                <InnerSection
                  title='Rental Adjustment'
                  subtitle='Create an adjustment payment for the rent increase'
                >
                  <div className='p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4'>
                    <div className='flex gap-2'>
                      <Info className='w-4 h-4 text-amber-600 shrink-0 mt-0.5' />
                      <div className='texts-body-small text-amber-800 space-y-2'>
                        <p>
                          The new monthly rent (
                          <span className='font-medium'>
                            RM {advancePaymentsInfo.newRent.toFixed(2)}
                          </span>
                          ) is higher than the old rent (
                          <span className='font-medium'>
                            RM {advancePaymentsInfo.oldRent.toFixed(2)}
                          </span>
                          ).
                        </p>
                        <p>
                          The tenant has{' '}
                          <span className='font-medium'>
                            {advancePaymentsInfo.advancePayments.length} advance
                            rental payment
                            {advancePaymentsInfo.advancePayments.length > 1
                              ? 's'
                              : ''}
                          </span>{' '}
                          pending for:
                        </p>
                        <ul className='list-disc list-inside ml-2'>
                          {advancePaymentsInfo.advanceMonths.map((month, i) => (
                            <li key={i}>
                              {month} - RM{' '}
                              {advancePaymentsInfo.oldRent.toFixed(2)}
                            </li>
                          ))}
                        </ul>
                        <p>
                          To cover the rent increase of{' '}
                          <span className='font-medium'>
                            RM {advancePaymentsInfo.rentDifference.toFixed(2)}
                            /month
                          </span>
                          , you may create a rental adjustment payment of{' '}
                          <span className='font-medium'>
                            RM {advancePaymentsInfo.totalAdjustment.toFixed(2)}
                          </span>{' '}
                          (RM {advancePaymentsInfo.rentDifference.toFixed(2)} ×{' '}
                          {advancePaymentsInfo.advancePayments.length} month
                          {advancePaymentsInfo.advancePayments.length > 1
                            ? 's'
                            : ''}
                          ).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='flex items-center gap-3 mb-4'>
                    <Checkbox
                      id='enable-rental-adjustment'
                      checked={enableRentalAdjustment}
                      onCheckedChange={checked =>
                        setEnableRentalAdjustment(checked === true)
                      }
                    />
                    <label
                      htmlFor='enable-rental-adjustment'
                      className='texts-body-medium cursor-pointer'
                    >
                      Create Rental Adjustment payment
                    </label>
                  </div>

                  {enableRentalAdjustment && (
                    <div className='flex flex-wrap gap-5'>
                      <InputGroup label='Adjustment Amount' isRequired>
                        <Input
                          currency
                          value={rentalAdjustmentAmount}
                          onValueChange={value =>
                            setRentalAdjustmentAmount(value || '')
                          }
                          placeholder={advancePaymentsInfo.totalAdjustment.toFixed(
                            2
                          )}
                        />
                      </InputGroup>
                      <InputGroup label='Due Date' isRequired>
                        <DatePicker
                          value={rentalAdjustmentDueDate}
                          onValueChange={setRentalAdjustmentDueDate}
                        />
                      </InputGroup>
                    </div>
                  )}
                </InnerSection>
              )}

              {/* Late Payment Charges */}
              <LateChargesSection
                onLateChargesChange={handleLateChargesChange}
                defaultLateCharges={defaultLateChargesForSection}
              />
            </CollapsibleSection>

            {/* Section 3: Initial Charges (Optional) */}
            <CollapsibleSection title='Initial Charges' number={3}>
              <InnerSection
                title='Lease Initial Charges'
                subtitle='Optional charges for the new lease (e.g., Security Deposit)'
              >
                <ChargesSection
                  title='Initial Charges'
                  subtitle='Add any initial charges for the new lease'
                  flowType='income'
                  selectable={true}
                  onChargesChange={setInitialCharges}
                  defaultCharges={preparedInitialCharges}
                  allowAllRemovable={true}
                  allChargesSelectable={true}
                  excludedChargeTypes={['First Month Rental']}
                />
              </InnerSection>

              {/* Payment Status for Initial Charges - only show if there are charges */}
              {initialCharges.length > 0 && (
                <InnerSection
                  title='Payment Status'
                  subtitle='Set the payment status for initial charges'
                >
                  <div className='flex flex-col gap-5'>
                    <InputGroup label='Initial Charges Payment Status'>
                      <RadioGroup
                        defaultOption={1}
                        options={['Paid', 'Not Paid']}
                        value={paymentStatus.isPaid ? 0 : 1}
                        onChange={index =>
                          setPaymentStatus(prev => ({
                            ...prev,
                            isPaid: index === 0,
                            paymentMethod: 'Bank Transfer' // Always Bank Transfer if paid
                          }))
                        }
                      />
                    </InputGroup>

                    <div className='inputs-container'>
                      <InputGroup
                        label={`${
                          paymentStatus.isPaid ? '' : 'Due '
                        }Payment Date`}
                        isRequired
                      >
                        <DatePicker
                          value={paymentStatus.paymentDate}
                          onValueChange={date =>
                            setPaymentStatus(prev => ({
                              ...prev,
                              paymentDate: date
                            }))
                          }
                        />
                      </InputGroup>
                      <InputGroup
                        label={`${
                          paymentStatus.isPaid ? '' : 'Due '
                        }Payment Time`}
                        isRequired
                      >
                        <TimePicker
                          value={paymentStatus.paymentTime}
                          onValueChange={(time: string) =>
                            setPaymentStatus(prev => ({
                              ...prev,
                              paymentTime: time
                            }))
                          }
                        />
                      </InputGroup>
                    </div>

                    {paymentStatus.isPaid && (
                      <InputGroup label='Receipt Image' isRequired>
                        <UploadFile
                          onFileChange={file =>
                            setPaymentStatus(prev => ({
                              ...prev,
                              receiptFile: file
                            }))
                          }
                          maxSizeMB={2}
                        />
                      </InputGroup>
                    )}
                  </div>
                </InnerSection>
              )}
            </CollapsibleSection>

            {/* Reminders Section */}
            <ReminderSection
              title='Reminders'
              sectionNumber={4}
              onLeaseExpiryChange={(enabled, days) =>
                setLeaseExpiryReminder({ enabled, days })
              }
              onRentReminderChange={(enabled, days) =>
                setRentReminder({ enabled, days })
              }
              onOverdueReminderChange={(enabled, days) =>
                setOverdueReminder({ enabled, days })
              }
              defaultReminders={{
                is_expiry_reminder: leaseExpiryReminder.enabled,
                expiry_days_before_reminder: leaseExpiryReminder.days
                  ? parseInt(leaseExpiryReminder.days)
                  : null,
                is_rent_reminder: rentReminder.enabled,
                rent_reminder_days_before: rentReminder.days
                  ? parseInt(rentReminder.days)
                  : null,
                is_overdue_rent_reminder: overdueReminder.enabled,
                overdue_days_after_reminder: overdueReminder.days
                  ? parseInt(overdueReminder.days)
                  : null
              }}
            />

            {/* Transfer Summary Note */}
            <div className='p-4 bg-neutral-50 border border-neutral-200 rounded-lg'>
              <div className='flex gap-3'>
                <Info className='w-5 h-5 text-neutral-600 shrink-0 mt-0.5' />
                <div className='space-y-3'>
                  <p className='texts-body-small-medium text-neutral-800'>
                    Summary: What will happen when you transfer
                  </p>
                  <ul className='texts-body-small text-neutral-700 space-y-2'>
                    <li className='flex items-start gap-2'>
                      <span className='text-neutral-400 mt-0.5'>•</span>
                      <span>
                        <strong>Current lease</strong> will be ended and marked
                        as "Transferred"
                      </span>
                    </li>
                    <li className='flex items-start gap-2'>
                      <span className='text-neutral-400 mt-0.5'>•</span>
                      <span>
                        <strong>Pending payments</strong> on the current lease
                        will be cancelled
                      </span>
                    </li>
                    <li className='flex items-start gap-2'>
                      <span className='text-neutral-400 mt-0.5'>•</span>
                      <span>
                        <strong>Open tickets</strong> linked to the current
                        lease will be closed
                      </span>
                    </li>
                    <li className='flex items-start gap-2'>
                      <span className='text-neutral-400 mt-0.5'>•</span>
                      <span>
                        <strong>Inspection task</strong> will be created for the
                        vacated unit
                      </span>
                    </li>
                    <li className='flex items-start gap-2'>
                      <span className='text-neutral-400 mt-0.5'>•</span>
                      <span>
                        <strong>New lease</strong> will be created at{' '}
                        {selectedDestination ? (
                          <span className='font-medium'>
                            {selectedDestination.subtitle
                              ? `${selectedDestination.subtitle} - ${selectedDestination.label}`
                              : selectedDestination.label}
                          </span>
                        ) : (
                          'the selected destination'
                        )}{' '}
                        starting <span className='font-medium'>today</span>
                      </span>
                    </li>
                    {initialCharges.length > 0 && paymentStatus.isPaid && (
                      <li className='flex items-start gap-2'>
                        <span className='text-green-500 mt-0.5'>✓</span>
                        <span>
                          <strong>Initial charges</strong> will be marked as
                          paid via{' '}
                          <span className='font-medium'>Bank Transfer</span>
                        </span>
                      </li>
                    )}
                    {initialCharges.length > 0 && !paymentStatus.isPaid && (
                      <li className='flex items-start gap-2'>
                        <span className='text-amber-500 mt-0.5'>○</span>
                        <span>
                          <strong>Initial charges</strong> will be pending
                          payment
                        </span>
                      </li>
                    )}
                    {initialCharges.length === 0 && (
                      <li className='flex items-start gap-2'>
                        <span className='text-neutral-400 mt-0.5'>•</span>
                        <span>
                          <strong>No initial charges</strong> will be created
                        </span>
                      </li>
                    )}
                    {selectedCycleInfo && (
                      <li className='flex items-start gap-2'>
                        <span className='text-neutral-400 mt-0.5'>•</span>
                        <span>
                          <strong>First rental payment</strong> (RM{' '}
                          {parseFloat(monthlyRent).toFixed(2)}) will be due on{' '}
                          <span className='font-medium'>
                            {selectedCycleInfo.date.toLocaleDateString(
                              'en-GB',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }
                            )}
                          </span>
                        </span>
                      </li>
                    )}
                    {enableRentalAdjustment && rentalAdjustmentAmount && (
                      <li className='flex items-start gap-2'>
                        <span className='text-amber-500 mt-0.5'>○</span>
                        <span>
                          <strong>Rental adjustment</strong> of RM{' '}
                          {parseFloat(rentalAdjustmentAmount).toFixed(2)} will
                          be due
                          {rentalAdjustmentDueDate && (
                            <>
                              {' '}
                              on{' '}
                              <span className='font-medium'>
                                {rentalAdjustmentDueDate.toLocaleDateString(
                                  'en-GB',
                                  {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  }
                                )}
                              </span>
                            </>
                          )}
                        </span>
                      </li>
                    )}
                    {lateCharges.length > 0 && (
                      <li className='flex items-start gap-2'>
                        <span className='text-neutral-400 mt-0.5'>•</span>
                        <span>
                          <strong>Late charges</strong>:{' '}
                          {lateCharges.map((lc, i) => (
                            <span key={i}>
                              RM {parseFloat(lc.amount).toFixed(2)} after{' '}
                              {lc.days_after_due} day
                              {lc.days_after_due > 1 ? 's' : ''}
                              {i < lateCharges.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </span>
                      </li>
                    )}
                    {(leaseExpiryReminder.enabled ||
                      rentReminder.enabled ||
                      overdueReminder.enabled) && (
                      <li className='flex items-start gap-2'>
                        <span className='text-neutral-400 mt-0.5'>•</span>
                        <span>
                          <strong>Reminders enabled</strong>:{' '}
                          {[
                            leaseExpiryReminder.enabled &&
                              `Lease expiry (${leaseExpiryReminder.days} days before)`,
                            rentReminder.enabled &&
                              `Rent due (${rentReminder.days} days before)`,
                            overdueReminder.enabled &&
                              `Overdue (${overdueReminder.days} days after)`
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className='flex items-center justify-between pt-4 border-t border-neutral-200'>
        <ShadcnButton
          type='button'
          className='cursor-pointer'
          onClick={() => router.back()}
          variant='ghost'
        >
          Cancel
        </ShadcnButton>

        <div className='flex items-center gap-3'>
          {currentStep === 2 && (
            <Button
              type='button'
              onClick={handleBack}
              disabled={isSubmitting}
              variant='secondary'
            >
              <ArrowLeft className='w-3.5 h-3.5' />
              Back
            </Button>
          )}

          {currentStep === 1 && (
            <Button type='button' variant='secondary' onClick={handleNext}>
              Next
              <ArrowRight className='w-3.5 h-3.5' />
            </Button>
          )}

          {currentStep === 2 && (
            <Button
              type='button'
              onClick={handleSubmit}
              disabled={isSubmitting || destinations.length === 0}
            >
              {isSubmitting ? 'Transferring...' : 'Transfer Lease'}
            </Button>
          )}
        </div>
      </div>

      {/* Alert */}
      <Alert
        open={alertOpen}
        onClose={() => setAlertOpen(false)}
        title={
          alertType === 'error'
            ? 'Error'
            : alertType === 'warning'
            ? 'Warning'
            : 'Info'
        }
        message={alertMessage}
        type={alertType}
      />
    </div>
  )
}
