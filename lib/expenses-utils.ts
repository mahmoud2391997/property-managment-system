type RawCharge = {
  amount: number
  is_taxed: boolean
}

type RawPaymentHistory = {
  amount: number
  paid_at: Date
  status: string
}

type RawRecurringConfig = {
  every: number
  time_unit: string
  event_on: string | null
}

type RawExpense = {
  reference_id: string
  type: string
  status: string
  due_payment_date: Date | null
  created_at: Date
  properties: {
    id: string
    code: string
    projects: {
      title: string
    } | null
  } | null
  charges: RawCharge[]
  payment_history: RawPaymentHistory[]
  recurring_configs: RawRecurringConfig | null
}

export type ExpenseWithDetails = {
  id: string
  type: string
  property: string
  property_id: string | null
  project: string
  due_date: Date | null
  recurring_pattern: 'Recurring' | 'One-time'
  recurring_pattern_description: string
  amount: number
  status: 'Paid' | 'Paid Late' | 'Pending' | 'Overdue' | 'Cancelled'
  payment_percentage: number
  has_pending_payments: boolean
  latest_payment_timestamp: string
}

// Transform raw expense from database to display format
export function transformExpense(expense: RawExpense): ExpenseWithDetails {
  // Calculate total amount from charges
  const totalAmount = expense.charges.reduce((sum, charge) => {
    const amount = charge.amount
    const tax = charge.is_taxed ? amount * 0.08 : 0
    return sum + amount + tax
  }, 0)

  // Only count SUCCESS payments in total paid
  const successfulPayments = expense.payment_history.filter(
    h => h.status === 'Success'
  )
  const totalPaid = successfulPayments.reduce(
    (sum, history) => sum + history.amount,
    0
  )
  const paymentPercentage = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0

  // Check if there are any Pending payment_history records
  const hasPendingPayments = expense.payment_history.some(h => h.status === 'Pending')

  // Get status
  const status = expense.status as 'Paid' | 'Paid Late' | 'Pending' | 'Overdue' | 'Cancelled'

  // Get recurring pattern info
  const recurringConfig = expense.recurring_configs
  const isRecurring = !!recurringConfig
  let recurringDescription = ''

  if (recurringConfig) {
    const { every, time_unit, event_on } = recurringConfig
    if (time_unit === 'Week' && event_on) {
      const days = event_on.split(',').join(', ')
      recurringDescription = `Every ${every} ${time_unit.toLowerCase()}${every > 1 ? 's' : ''} on ${days}`
    } else if (time_unit === 'Month' && event_on) {
      const days = event_on.split(',').join(', ')
      recurringDescription = `Every ${every} ${time_unit.toLowerCase()}${every > 1 ? 's' : ''} on day ${days}`
    } else {
      recurringDescription = `Every ${every} ${time_unit.toLowerCase()}${every > 1 ? 's' : ''}`
    }
  }

  // Get latest payment timestamp
  const latestPaymentTimestamp = successfulPayments[0]?.paid_at?.toISOString() || expense.created_at.toISOString()

  return {
    id: expense.reference_id,
    type: expense.type,
    property: expense.properties?.code || 'N/A',
    property_id: expense.properties?.id || null,
    project: expense.properties?.projects?.title || 'No project',
    due_date: expense.due_payment_date,
    recurring_pattern: isRecurring ? 'Recurring' : 'One-time',
    recurring_pattern_description: recurringDescription,
    amount: totalAmount,
    status,
    payment_percentage: paymentPercentage,
    has_pending_payments: hasPendingPayments,
    latest_payment_timestamp: latestPaymentTimestamp
  }
}
