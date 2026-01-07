import { prisma } from '@/lib/prisma'

/**
 * Handle recurring payment generation when a payment is fully paid
 */
export async function handleRecurringPaymentGeneration(paymentId: string, organizationId: string) {
  // Get the payment with its recurring config and lease details
  const payment = await prisma.payments.findUnique({
    where: { id: paymentId },
    include: {
      recurring_configs: true,
      charges: true,
      leases: {
        include: {
          properties: true,
          rooms: true
        }
      }
    }
  })

  if (!payment || !payment.recurring_configs || !payment.leases) {
    return // No recurring config or lease, nothing to do
  }

  const recurringConfig = payment.recurring_configs
  const lease = payment.leases

  // Only generate if recurring is active
  if (!recurringConfig.is_active) {
    return
  }

  // Calculate next payment date based on lease's payment_day
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  const paymentDay = lease.payment_day

  // Determine next payment date
  let nextPaymentDate: Date

  // If payment_day hasn't passed this month, next payment is this month
  // Otherwise, next payment is next month
  if (today.getDate() < paymentDay) {
    nextPaymentDate = new Date(currentYear, currentMonth, paymentDay)
  } else {
    // Next month
    nextPaymentDate = new Date(currentYear, currentMonth + 1, paymentDay)
  }

  // Set time to start of day
  nextPaymentDate.setHours(0, 0, 0, 0)

  // Generate new payment reference ID
  const lastPayment = await prisma.payments.findFirst({
    where: { organization_id: organizationId },
    orderBy: { created_at: 'desc' },
    select: { reference_id: true }
  })

  const lastNumber = lastPayment?.reference_id
    ? parseInt(lastPayment.reference_id.replace('P', ''))
    : 0
  const newReferenceId = `P${String(lastNumber + 1).padStart(3, '0')}`

  // Determine payment status based on is_payment_fixed
  const paymentStatus = recurringConfig.is_payment_fixed ? 'Pending' : 'Unset'

  // Create new payment in a transaction
  const newPayment = await prisma.$transaction(async (tx) => {
    // Create new payment
    const createdPayment = await tx.payments.create({
      data: {
        reference_id: newReferenceId,
        type: payment.type,
        status: paymentStatus,
        due_payment_timestamp: nextPaymentDate,
        lease_id: lease.id,
        organization_id: organizationId,
        recurring_config_id: recurringConfig.id
      }
    })

    // If fixed payment, copy charges from previous payment
    if (recurringConfig.is_payment_fixed) {
      const chargeData = payment.charges.map(charge => ({
        payment_id: createdPayment.id,
        amount: charge.amount,
        title: charge.title,
        is_taxed: charge.is_taxed
      }))

      await tx.charges.createMany({
        data: chargeData
      })
    }

    return createdPayment
  })

  // After transaction, send notifications to staff (outside transaction)
  try {
    await sendRecurringPaymentNotifications(
      newPayment.id,
      organizationId,
      recurringConfig.title,
      lease
    )
  } catch (notificationError) {
    console.error('Error sending recurring payment notifications:', notificationError)
    // Don't throw - payment was already created successfully
  }

  console.log(`Recurring payment generated: ${newReferenceId} for ${recurringConfig.title}`)
}

/**
 * Send notifications to staff about new recurring payment
 */
async function sendRecurringPaymentNotifications(
  paymentId: string,
  organizationId: string,
  paymentTitle: string,
  lease: any
) {
  // Get tenant name for notification message
  const tenant = await prisma.tenants.findUnique({
    where: { id: lease.tenant_id },
    include: {
      individual_tenants: true,
      company_tenants: true
    }
  })

  const tenantName = tenant?.type === 'Individual'
    ? `${tenant.individual_tenants?.first_name} ${tenant.individual_tenants?.last_name || ''}`.trim()
    : tenant?.company_tenants?.company_name || 'Unknown Tenant'

  // Get all staff in organization (excluding specific emails)
  const excludedEmails = ['majidrafique777@gmail.com', 'mickyiyke745@gmail.com']

  const staffList = await prisma.staff.findMany({
    where: {
      organization_id: organizationId,
      users: {
        email: {
          notIn: excludedEmails
        }
      }
    },
    include: {
      users: {
        select: { id: true }
      }
    }
  })

  // Determine page URL based on lease type
  const pageUrl = lease.room_id
    ? `/rooms/${lease.room_id}/overview?section=recurring`
    : `/properties/${lease.property_id}/overview?section=recurring`

  // Create notification for each staff member
  const notificationData = staffList.map(staff => ({
    organization_id: organizationId,
    user_id: staff.users.id,
    title: 'New Recurring Payment Generated',
    message: `A new ${paymentTitle} payment has been created for ${tenantName} and requires your attention.`,
    reference_id: paymentId,
    reference_type: 'payment',
    performer_id: null,
    performer_type: 'system' as const,
    is_read: false,
    page: pageUrl,
    affected_type: 'staff' as const,
    affected_id: staff.id
  }))

  if (notificationData.length > 0) {
    await prisma.notifications.createMany({
      data: notificationData
    })
  }
}
