import { prisma } from '@/lib/prisma'

/**
 * Handle recurring payment generation when a payment is fully paid
 */
export async function handleRecurringPaymentGeneration (
  paymentId: string,
  organizationId: string
) {
  console.log(`[Recurring] Checking payment ${paymentId}...`)

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

  if (!payment) {
    console.log(`[Recurring] Payment ${paymentId} not found`)
    return
  }

  console.log(
    `[Recurring] Payment ${payment.reference_id} found, recurring_config_id: ${payment.recurring_config_id}`
  )

  if (!payment.recurring_configs) {
    console.log(
      `[Recurring] No recurring config attached to payment ${payment.reference_id}`
    )
    return
  }

  if (!payment.leases) {
    console.log(
      `[Recurring] No lease attached to payment ${payment.reference_id}`
    )
    return
  }

  const recurringConfig = payment.recurring_configs
  const lease = payment.leases

  console.log(
    `[Recurring] Found recurring config: "${recurringConfig.title}", active: ${recurringConfig.is_active}`
  )

  // Only generate if recurring is active
  if (!recurringConfig.is_active) {
    console.log(
      `[Recurring] Recurring config is inactive, skipping generation`
    )
    return
  }

  // Validate that payment has a due date before calculating next payment
  if (!payment.due_payment_timestamp) {
    console.log(
      `[Recurring] Payment ${payment.reference_id} has no due date, cannot generate next payment`
    )
    return
  }

  // Calculate next payment date based on the CURRENT payment's due date
  const currentPaymentDate = new Date(payment.due_payment_timestamp)
  const paymentDay = lease.payment_day

  console.log(
    `📅 [Recurring] Current payment due date: ${currentPaymentDate.toISOString()}, payment_day: ${paymentDay}`
  )

  // Add one month to the current payment's due date
  const nextMonth = currentPaymentDate.getMonth() + 1
  const nextYear =
    nextMonth > 11
      ? currentPaymentDate.getFullYear() + 1
      : currentPaymentDate.getFullYear()
  const adjustedMonth = nextMonth % 12

  const nextPaymentDate = new Date(nextYear, adjustedMonth, paymentDay)

  // Set time to start of day
  nextPaymentDate.setHours(0, 0, 0, 0)

  console.log(
    `📅 [Recurring] Next payment will be: ${nextPaymentDate.toISOString()}`
  )

  // Generate new payment reference ID
  const yearPrefix = `PY-${nextPaymentDate.getFullYear()}`

  const lastPayment = await prisma.payments.findFirst({
    where: {
      organization_id: organizationId,
      reference_id: {
        startsWith: yearPrefix
      }
    },
    orderBy: {
      reference_id: 'desc'
    },
    select: {
      reference_id: true
    }
  })

  let nextSequence = 1
  if (lastPayment) {
    // Extract the last 8 digits and increment
    const lastSequence = parseInt(lastPayment.reference_id.slice(-8))
    nextSequence = lastSequence + 1
  }

  // Format: PY-YYYY00000001
  const newReferenceId = `${yearPrefix}${nextSequence
    .toString()
    .padStart(8, '0')}`

  // Determine payment status based on is_payment_fixed
  const paymentStatus = recurringConfig.is_payment_fixed ? 'Pending' : 'Unset'

  // Create new payment in a transaction
  const newPayment = await prisma.$transaction(async tx => {
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

  console.log(
    `[Recurring] Payment created: ${newReferenceId}, Status: ${paymentStatus}`
  )

  // After transaction, if recurring payment not fixed, send notifications to staff (outside transaction)

  if (!recurringConfig.is_payment_fixed) {
    try {
      console.log(`[Recurring] Sending notifications...`)
      await sendRecurringPaymentNotifications(
        newPayment.id,
        organizationId,
        recurringConfig.title,
        lease
      )
      console.log(`[Recurring] Notifications sent successfully`)
    } catch (notificationError) {
      console.error(
        '[Recurring] Error sending notifications:',
        notificationError
      )
      // Don't throw - payment was already created successfully
    }
  }

  console.log(
    `[Recurring] Complete! Generated ${newReferenceId} for "${recurringConfig.title}"`
  )
}

/**
 * Send notifications to staff about new recurring payment
 */
async function sendRecurringPaymentNotifications (
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

  const tenantName =
    tenant?.type === 'Individual'
      ? `${tenant.individual_tenants?.first_name} ${
          tenant.individual_tenants?.last_name || ''
        }`.trim()
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
    ? `rooms/${lease.room_id}/overview?section=recurring`
    : `properties/${lease.property_id}/overview?section=recurring`

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
