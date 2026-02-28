import { Decimal } from '@prisma/client/runtime/library'

type RawCharge = {
  amount: Decimal
  is_taxed: boolean
}

type RawPaymentHistory = {
  amount: Decimal
  paid_at: Date
  status: string
}

type RawRecurringConfig = {
  every: number | null
  time_unit: string | null
  event_on: string | null
}

type RawLatePaymentCharge = {
  days_after_due: number
  amount: Decimal
}

type RawPayment = {
  reference_id: string
  type: string
  status: string
  due_payment_timestamp: Date | null
  created_at: Date
  payment_evidence: string | null
  leases: {
    id: string
    reference_id: string
    property_id: string
    room_id: string | null
    properties: {
      code: string
      projects: {
        title: string
      } | null
    } | null
    rooms: {
      title: string
    } | null
    tenants: {
      id: string
      type: string
      profile_pic: string | null
      individual_tenants: {
        first_name: string
        last_name: string | null
      } | null
      company_tenants: {
        company_name: string
      } | null
    } | null
    late_payment_charges: RawLatePaymentCharge[]
  } | null
  charges: RawCharge[]
  payment_history: RawPaymentHistory[]
  recurring_configs: RawRecurringConfig | null
  bookings: {
    property_id: string
    room_id: string | null
    properties: {
      code: string
      projects: {
        title: string
      } | null
    } | null
    rooms: {
      title: string
    } | null
    tenants: {
      id: string
      type: string
      profile_pic: string | null
      individual_tenants: {
        first_name: string
        last_name: string | null
      } | null
      company_tenants: {
        company_name: string
      } | null
    } | null
  } | null
}

export type LatePaymentChargeInfo = {
  days_after_due: number
  amount: number
}

export type PaymentWithDetails = {
  id: string
  type: string
  property: string
  property_id: string | null
  room: string
  room_id: string | null
  lease_id: string | null
  lease_reference_id: string | null
  due_date: Date | null
  issued_at: string
  recurring_pattern: 'Recurring' | 'One-time'
  recurring_pattern_description: string
  amount: number
  status: 'Paid' | 'Paid Late' | 'Pending' | 'Partially Paid' | 'Overdue' | 'Cancelled'
  payment_percentage: number
  remaining_amount: number
  has_pending_payments: boolean
  tenant_name: string
  tenant_picture: string
  tenant_color: string
  latest_payment_timestamp: string
  payment_evidence: string | null
  late_payment_charges: LatePaymentChargeInfo[]
}

// Transform raw payment from database to display format
export function transformPayment(payment: RawPayment): PaymentWithDetails {
  // Calculate total amount from charges
  const totalAmount = payment.charges.reduce((sum, charge) => {
    const amount = charge.amount.toNumber()
    const tax = charge.is_taxed ? amount * 0.08 : 0
    return sum + amount + tax
  }, 0)

  // Only count SUCCESS payments in total paid
  const successfulPayments = payment.payment_history.filter(
    h => h.status === 'Success'
  )
  const totalPaid = successfulPayments.reduce(
    (sum, history) => sum + history.amount.toNumber(),
    0
  )
  const paymentPercentage = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0

  // Check if there are any Pending payment_history records
  const hasPendingPayments = payment.payment_history.some(h => h.status === 'Pending')

  // Calculate display status (same logic as frontend)
  let status: 'Paid' | 'Paid Late' | 'Pending' | 'Partially Paid' | 'Overdue' | 'Cancelled'

  // Check if cancelled first
  if (payment.status === 'Cancelled') {
    status = 'Cancelled'
  } else {
    const now = new Date()
    const dueDate = payment.due_payment_timestamp
    const isFullyPaid = paymentPercentage >= 100
    const isPartiallyPaid = paymentPercentage > 0 && paymentPercentage < 100
    const isOverdue = dueDate ? now > dueDate : false
    const latestPaymentDate = successfulPayments[0]?.paid_at

    if (isFullyPaid) {
      // Check if last payment was after due date
      status = (dueDate && latestPaymentDate && latestPaymentDate > dueDate) ? 'Paid Late' : 'Paid'
    } else {
      // Not fully paid - check priority: Overdue > Partially Paid > Pending
      if (isOverdue) {
        status = 'Overdue'
      } else if (isPartiallyPaid) {
        status = 'Partially Paid'
      } else {
        status = 'Pending'
      }
    }
  }

  // Get recurring pattern info
  const recurringConfig = payment.recurring_configs
  const isRecurring = !!recurringConfig
  let recurringDescription = ''

  if (recurringConfig) {
    const { every, time_unit, event_on } = recurringConfig

    // New recurring model: monthly with rental payment (every and time_unit are null)
    if (every === null || time_unit === null) {
      recurringDescription = 'Monthly with rental payment'
    } else if (time_unit === 'Week' && event_on) {
      const days = event_on.split(',').join(', ')
      recurringDescription = `Every ${every} ${time_unit.toLowerCase()}${every > 1 ? 's' : ''} on ${days}`
    } else if (time_unit === 'Month' && event_on) {
      const days = event_on.split(',').join(', ')
      recurringDescription = `Every ${every} ${time_unit.toLowerCase()}${every > 1 ? 's' : ''} on day ${days}`
    } else {
      recurringDescription = `Every ${every} ${time_unit.toLowerCase()}${every > 1 ? 's' : ''}`
    }
  }

  // Get tenant name based on type (check leases first, then bookings)
  const tenant = payment.leases?.tenants || payment.bookings?.tenants
  let tenantName = 'N/A'
  if (tenant) {
    if (tenant.type === 'Individual' && tenant.individual_tenants) {
      tenantName = `${tenant.individual_tenants.first_name} ${tenant.individual_tenants.last_name || ''}`.trim()
    } else if (tenant.type === 'Company' && tenant.company_tenants) {
      tenantName = tenant.company_tenants.company_name
    }
  }

  // Get latest payment timestamp
  const latestPaymentTimestamp = successfulPayments[0]?.paid_at?.toISOString() || payment.created_at.toISOString()

  // Calculate remaining amount accurately
  const remainingAmount = totalAmount - totalPaid

  // Transform late payment charges from lease
  const latePaymentCharges: LatePaymentChargeInfo[] = payment.leases?.late_payment_charges?.map(lpc => ({
    days_after_due: lpc.days_after_due,
    amount: lpc.amount.toNumber()
  })) || []

  return {
    id: payment.reference_id,
    type: payment.type,
    property: payment.leases?.properties?.code || payment.bookings?.properties?.code || 'N/A',
    property_id: payment.leases?.property_id || payment.bookings?.property_id || null,
    room: payment.leases?.rooms?.title || payment.bookings?.rooms?.title || 'Whole unit',
    room_id: payment.leases?.room_id || payment.bookings?.room_id || null,
    lease_id: payment.leases?.id || null,
    lease_reference_id: payment.leases?.reference_id || null,
    due_date: payment.due_payment_timestamp,
    issued_at: payment.created_at.toISOString(),
    recurring_pattern: isRecurring ? 'Recurring' : 'One-time',
    recurring_pattern_description: recurringDescription,
    amount: totalAmount,
    status,
    payment_percentage: paymentPercentage,
    remaining_amount: remainingAmount,
    has_pending_payments: hasPendingPayments,
    tenant_name: tenantName,
    tenant_picture: tenant?.profile_pic || '',
    tenant_color: '',
    latest_payment_timestamp: latestPaymentTimestamp,
    payment_evidence: payment.payment_evidence,
    late_payment_charges: latePaymentCharges
  }
}
