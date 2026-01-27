import { Decimal } from '@prisma/client/runtime/library'
import { formatPaymentTypeLabel } from '@/utils/functions'

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

type RawExpense = {
  reference_id: string
  category: string
  description: string | null
  status: string
  due_payment_date: Date | null
  created_at: Date
  charges: RawCharge[]
  payment_history: RawPaymentHistory[]
  recurring_configs: RawRecurringConfig | null
  property_expenses: {
    type: string
    properties: {
      id: string
      code: string
      projects: { title: string } | null
    } | null
    leases: { reference_id: string } | null
  } | null
  contract_expenses: {
    type: string
    contracts: {
      contract_id: string
      owners: { first_name: string; last_name: string | null }
    }
  } | null
  company_expenses: { type: string } | null
  purchase_expenses: { type: string; is_asset: boolean } | null
}

export type ExpenseWithDetails = {
  id: string
  category: string
  type: string
  description: string | null
  context_label: string
  context_id: string | null
  context_subtitle: string
  due_date: Date | null
  recurring_pattern: 'Recurring' | 'One-time'
  recurring_pattern_description: string
  amount: number
  status: 'Paid' | 'Paid Late' | 'Pending' | 'Overdue' | 'Cancelled'
  payment_percentage: number
  has_pending_payments: boolean
  latest_payment_timestamp: string
  is_asset: boolean
}

// Extract type and context info from the appropriate subtype
function extractSubtypeInfo(expense: RawExpense): {
  type: string
  context_label: string
  context_id: string | null
  context_subtitle: string
  is_asset: boolean
} {
  switch (expense.category) {
    case 'Property_Related': {
      const sub = expense.property_expenses
      if (!sub) return { type: 'Unknown', context_label: 'N/A', context_id: null, context_subtitle: '', is_asset: false }

      // For Refund type, show lease reference_id instead of property
      const isRefund = sub.type === 'Refund'
      return {
        type: sub.type,
        context_label: isRefund
          ? sub.leases?.reference_id || 'N/A'
          : sub.properties?.code || 'N/A',
        context_id: isRefund ? null : sub.properties?.id || null,
        context_subtitle: sub.properties?.projects?.title || 'No project',
        is_asset: false
      }
    }

    case 'Contract_Related': {
      const sub = expense.contract_expenses
      if (!sub) return { type: 'Unknown', context_label: 'N/A', context_id: null, context_subtitle: '', is_asset: false }

      const ownerName = [sub.contracts.owners.first_name, sub.contracts.owners.last_name].filter(Boolean).join(' ')
      return {
        type: sub.type,
        context_label: sub.contracts.contract_id,
        context_id: null,
        context_subtitle: ownerName,
        is_asset: false
      }
    }

    case 'Company_Related': {
      const sub = expense.company_expenses
      return {
        type: sub?.type || 'Unknown',
        context_label: '-',
        context_id: null,
        context_subtitle: '',
        is_asset: false
      }
    }

    case 'Purchase_Related': {
      const sub = expense.purchase_expenses
      return {
        type: sub?.type || 'Unknown',
        context_label: sub?.is_asset ? 'Asset' : '-',
        context_id: null,
        context_subtitle: '',
        is_asset: sub?.is_asset || false
      }
    }

    default:
      return { type: 'Unknown', context_label: '-', context_id: null, context_subtitle: '', is_asset: false }
  }
}

// Transform raw expense from database to display format
export function transformExpense(expense: RawExpense): ExpenseWithDetails {
  // Calculate total amount from charges
  const totalAmount = expense.charges.reduce((sum, charge) => {
    const amount = charge.amount.toNumber()
    const tax = charge.is_taxed ? amount * 0.08 : 0
    return sum + amount + tax
  }, 0)

  // Only count SUCCESS payments in total paid
  const successfulPayments = expense.payment_history.filter(
    h => h.status === 'Success'
  )
  const totalPaid = successfulPayments.reduce(
    (sum, history) => sum + history.amount.toNumber(),
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

  // Get latest payment timestamp
  const latestPaymentTimestamp = successfulPayments[0]?.paid_at?.toISOString() || expense.created_at.toISOString()

  // Extract subtype info
  const subtypeInfo = extractSubtypeInfo(expense)

  return {
    id: expense.reference_id,
    category: expense.category,
    type: formatPaymentTypeLabel(subtypeInfo.type),
    description: expense.description,
    context_label: subtypeInfo.context_label,
    context_id: subtypeInfo.context_id,
    context_subtitle: subtypeInfo.context_subtitle,
    due_date: expense.due_payment_date,
    recurring_pattern: isRecurring ? 'Recurring' : 'One-time',
    recurring_pattern_description: recurringDescription,
    amount: totalAmount,
    status,
    payment_percentage: paymentPercentage,
    has_pending_payments: hasPendingPayments,
    latest_payment_timestamp: latestPaymentTimestamp,
    is_asset: subtypeInfo.is_asset
  }
}
