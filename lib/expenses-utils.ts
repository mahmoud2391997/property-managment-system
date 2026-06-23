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
    leases: {
      id: string
      reference_id: string
      property_id: string
      room_id: string | null
      properties: { id: string; code: string } | null
      rooms: { id: string; title: string } | null
    } | null
  } | null
  contract_expenses: {
    type: string
    contracts: {
      reference_id: string
      owners: { first_name: string; last_name: string | null }
    }
  } | null
  company_expenses: { type: string; is_asset: boolean } | null
  purchase_expenses: {
    type: string
    is_asset: boolean
    properties: {
      id: string
      code: string
      projects: { title: string } | null
    } | null
  } | null
  staff_expenses: {
    type: string
    staff_id: string | null
    month: Date
    gross_salary: Decimal
    epf_employer: Decimal
    socso_employer: Decimal
    epf_employee: Decimal
    socso_employee: Decimal
    tax: Decimal | null
    staff: {
      first_name: string
      last_name: string | null
    } | null
  } | null
}

export type ExpenseWithDetails = {
  id: string
  category: string
  type: string
  description: string | null
  context_label: string
  context_label_href: string | null
  context_id: string | null
  context_subtitle: string
  context_subtitle_href: string | null
  due_date: Date | null
  recurring_pattern: 'Recurring' | 'One-time'
  recurring_pattern_description: string
  amount: number
  status: 'Paid' | 'Paid Late' | 'Pending' | 'Partially Paid' | 'Overdue' | 'Cancelled'
  payment_percentage: number
  has_pending_payments: boolean
  latest_payment_timestamp: string
  is_asset: boolean
}

// Extract type and context info from the appropriate subtype
function extractSubtypeInfo(expense: RawExpense, hasLeaseAccess: boolean = true): {
  type: string
  context_label: string
  context_label_href: string | null
  context_id: string | null
  context_subtitle: string
  context_subtitle_href: string | null
  is_asset: boolean
} {
  const defaults = { context_label_href: null, context_subtitle_href: null }

  switch (expense.category) {
    case 'Property_Related': {
      const sub = expense.property_expenses
      if (!sub) return { type: 'Unknown', context_label: 'N/A', context_id: null, context_subtitle: '', is_asset: false, ...defaults }

      // For Refund and Agent Commission types, show lease reference_id instead of property
      const isLeaseBased = sub.type === 'Refund' || sub.type === 'Agent_Commission'
      if (isLeaseBased && sub.leases && hasLeaseAccess) {
        const lease = sub.leases
        const hasRoom = lease.rooms && lease.room_id
        const hasProperty = lease.properties && lease.property_id
        const hasValidLeaseId = lease.id && lease.id !== '00000000-0000-0000-0000-000000000000'
        
        // Generate lease details URL for lease navigation
        const leaseHref = hasValidLeaseId && hasProperty && lease.property_id
          ? `/properties/${lease.property_id}/leases/${lease.id}/details`
          : null
        const subtitleLabel = hasValidLeaseId && hasRoom && lease.room_id
          ? `${lease.properties?.code || ''} (${lease.rooms!.title})`
          : hasValidLeaseId && hasProperty
          ? lease.properties?.code || ''
          : 'Unknown Property'
        // Generate property overview URL for property navigation
        const subtitleHref = hasValidLeaseId && hasProperty && lease.property_id
          ? `/properties/${lease.property_id}/overview`
          : null

        return {
          type: sub.type,
          context_label: lease.reference_id || 'Unknown Lease',
          context_label_href: leaseHref,
          context_id: null,
          context_subtitle: subtitleLabel,
          context_subtitle_href: subtitleHref,
          is_asset: false
        }
      } else if (isLeaseBased && sub.leases && !hasLeaseAccess) {
        // Show lease ID but make it non-clickable when user doesn't have lease access
        const lease = sub.leases
        const hasProperty = lease.properties && lease.property_id
        
        return {
          type: sub.type,
          context_label: lease.reference_id || 'Unknown Lease',
          context_label_href: null, // Make lease ID non-clickable
          context_id: null,
          context_subtitle: hasProperty && lease.rooms && lease.room_id 
            ? `${lease.properties?.code || ''} (${lease.rooms!.title})`
            : hasProperty 
            ? lease.properties?.code || 'Unknown Property'
            : 'No Property',
          context_subtitle_href: hasProperty && lease.property_id ? `/properties/${lease.property_id}/overview` : null,
          is_asset: false
        }
      }

      return {
        type: sub.type,
        context_label: sub.properties?.code || 'N/A',
        context_label_href: null,
        context_id: sub.properties?.id || null,
        context_subtitle: (sub.properties as any)?.projects?.title || 'No project',
        context_subtitle_href: null,
        is_asset: false
      }
    }

    case 'Contract_Related': {
      const sub = expense.contract_expenses
      if (!sub) return { type: 'Unknown', context_label: 'N/A', context_id: null, context_subtitle: '', is_asset: false, ...defaults }

      const ownerName = [sub.contracts.owners.first_name, sub.contracts.owners.last_name].filter(Boolean).join(' ')
      return {
        type: sub.type,
        context_label: sub.contracts.reference_id,
        context_id: null,
        context_subtitle: ownerName,
        is_asset: false,
        ...defaults
      }
    }

    case 'Company_Related': {
      const sub = expense.company_expenses
      return {
        type: sub?.type || 'Unknown',
        context_label: '-',
        context_id: null,
        context_subtitle: '',
        is_asset: sub?.is_asset || false,
        ...defaults
      }
    }

    case 'Purchase_Related': {
      const sub = expense.purchase_expenses
      return {
        type: sub?.type || 'Unknown',
        context_label: sub?.properties?.code || (sub?.is_asset ? 'Asset' : '-'),
        context_id: sub?.properties?.id || null,
        context_subtitle: sub?.properties?.projects?.title || '',
        is_asset: sub?.is_asset || false,
        ...defaults
      }
    }

    case 'Staff_Related': {
      const sub = expense.staff_expenses
      if (!sub) return { type: 'Unknown', context_label: 'N/A', context_id: null, context_subtitle: '', is_asset: false, ...defaults }

      const staffName = sub.staff
        ? [sub.staff.first_name, sub.staff.last_name].filter(Boolean).join(' ')
        : 'N/A'
      const monthLabel = new Date(sub.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

      return {
        type: sub.type,
        context_label: staffName,
        context_id: sub.staff_id,
        context_subtitle: monthLabel,
        is_asset: false,
        ...defaults
      }
    }

    default:
      return { type: 'Unknown', context_label: '-', context_id: null, context_subtitle: '', is_asset: false, ...defaults }
  }
}

// Transform raw expense from database to display format
export function transformExpense(expense: RawExpense, hasLeaseAccess: boolean = true): ExpenseWithDetails {
  // Calculate total amount
  let totalAmount: number

  if (expense.category === 'Staff_Related' && expense.staff_expenses?.type === 'Salary') {
    // Cost to Company = Gross + Employer EPF + Employer SOCSO + Allowances
    const gross = expense.staff_expenses.gross_salary.toNumber()
    const epfEr = expense.staff_expenses.epf_employer.toNumber()
    const socsoEr = expense.staff_expenses.socso_employer.toNumber()
    const allowancesTotal = expense.charges.reduce((sum, charge) => sum + charge.amount.toNumber(), 0)
    totalAmount = gross + epfEr + socsoEr + allowancesTotal
  } else {
    totalAmount = expense.charges.reduce((sum, charge) => {
      const amount = charge.amount.toNumber()
      const tax = charge.is_taxed ? amount * 0.08 : 0
      return sum + amount + tax
    }, 0)
  }

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
  let status: 'Paid' | 'Paid Late' | 'Pending' | 'Partially Paid' | 'Overdue' | 'Cancelled'
  if (expense.status === 'Cancelled') {
    status = 'Cancelled'
  } else {
    const now = new Date()
    const dueDate = expense.due_payment_date
    const isFullyPaid = paymentPercentage >= 100
    const isPartiallyPaid = paymentPercentage > 0 && paymentPercentage < 100
    const isOverdue = dueDate && (paymentPercentage < 100) && now > new Date(new Date(dueDate).setHours(23, 59, 59, 999))
    const latestPaymentDate = successfulPayments[0]?.paid_at
    if (isFullyPaid) {
      let isPaidLate = false;
      if (dueDate && latestPaymentDate) {
        const d1 = new Date(dueDate);
        d1.setUTCHours(23, 59, 59, 999);
        isPaidLate = latestPaymentDate.getTime() > d1.getTime();
      }
      status = isPaidLate ? 'Paid Late' : 'Paid'
    } else if (isOverdue) {
      status = 'Overdue'
    } else if (isPartiallyPaid) {
      status = 'Partially Paid'
    } else {
      status = 'Pending'
    }
  }

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
  console.log('Transforming expense with lease access:', hasLeaseAccess, 'expense category:', expense.category)
  const subtypeInfo = extractSubtypeInfo(expense, hasLeaseAccess)
  console.log('Transformed subtype info:', subtypeInfo)

  return {
    id: expense.reference_id,
    category: expense.category,
    type: formatPaymentTypeLabel(subtypeInfo.type),
    description: expense.description,
    context_label: subtypeInfo.context_label,
    context_label_href: subtypeInfo.context_label_href,
    context_id: subtypeInfo.context_id,
    context_subtitle: subtypeInfo.context_subtitle,
    context_subtitle_href: subtypeInfo.context_subtitle_href,
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
