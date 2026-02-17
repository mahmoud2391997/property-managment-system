import { prisma } from '@/lib/prisma'
import { computeLeaseStatus } from '@/utils/lease-status'
import type { LeaseDetailsData } from '@/app/(protected)/properties/[id]/(without-head-section)/leases/[leaseId]/details/page'

export async function getLeaseDetails(
  leaseId: string,
  organizationId: string | null,
  tenantId?: string | null
): Promise<LeaseDetailsData | null> {
  try {
    // Build where clause based on user type
    const whereClause = organizationId
      ? { id: leaseId, organization_id: organizationId }
      : { id: leaseId, tenant_id: tenantId! }

    // Fetch lease with all related data
    const lease = await prisma.leases.findFirst({
      where: whereClause,
      select: {
        id: true,
        reference_id: true,
        start_date: true,
        number_of_months: true,
        monthly_rent: true,
        payment_day: true,
        status: true,
        property_id: true,
        room_id: true,
        created_at: true,
        ended_at: true,
        // Transfer tracking
        transferred_from: true,
        is_transferred_from: true,
        transferred_to: true,
        is_transferred_to: true,
        // Reminder settings
        is_expiry_reminder: true,
        expiry_days_before_reminder: true,
        is_rent_reminder: true,
        rent_reminder_days_before: true,
        is_overdue_rent_reminder: true,
        overdue_days_after_reminder: true,
        // Tenant
        tenants: {
          select: {
            id: true,
            type: true,
            profile_thumb: true,
            individual_tenants: {
              select: {
                first_name: true,
                last_name: true,
                phone_number: true
              }
            },
            company_tenants: {
              select: {
                company_name: true,
                contact_person_first_name: true,
                contact_person_last_name: true,
                phone_number: true
              }
            },
            users: {
              select: {
                email: true
              }
            }
          }
        },
        // Property
        properties: {
          select: {
            id: true,
            code: true,
            street_address: true
          }
        },
        // Room (if room lease)
        rooms: {
          select: {
            id: true,
            title: true
          }
        },
        // Transferred from lease
        leases_leases_transferred_fromToleases: {
          select: {
            id: true,
            reference_id: true,
            property_id: true,
            room_id: true,
            properties: {
              select: {
                code: true
              }
            },
            rooms: {
              select: {
                title: true
              }
            }
          }
        },
        // Transferred to lease
        leases_leases_transferred_toToleases: {
          select: {
            id: true,
            reference_id: true,
            property_id: true,
            room_id: true,
            properties: {
              select: {
                code: true
              }
            },
            rooms: {
              select: {
                title: true
              }
            }
          }
        },
        // Late payment charges
        late_payment_charges: {
          select: {
            id: true,
            days_after_due: true,
            amount: true
          },
          orderBy: {
            days_after_due: 'asc'
          }
        },
        // Scheduled rental changes
        scheduled_rental_changes: {
          select: {
            id: true,
            old_monthly_rent: true,
            new_monthly_rent: true,
            effective_from: true,
            status: true,
            applied_at: true,
            cancelled_at: true,
            created_at: true
          },
          orderBy: {
            effective_from: 'desc'
          }
        },
        // Lease end schedules
        lease_end_schedule: {
          select: {
            id: true,
            scheduled_date: true,
            status: true,
            created_at: true,
            cancelled_at: true
          },
          orderBy: {
            created_at: 'desc'
          }
        },
        // Recurring configs
        recurring_configs: {
          select: {
            id: true,
            title: true,
            every: true,
            time_unit: true,
            event_on: true,
            is_payment_fixed: true,
            payments: {
              select: {
                id: true,
                reference_id: true,
                type: true,
                status: true,
                due_payment_timestamp: true,
                charges: {
                  select: {
                    amount: true
                  }
                }
              },
              orderBy: {
                due_payment_timestamp: 'desc'
              },
              take: 1
            }
          }
        },
        // Created by staff
        staff: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    })

    if (!lease) {
      return null
    }

    // Fetch payments for this lease
    const payments = await prisma.payments.findMany({
      where: {
        lease_id: leaseId
      },
      select: {
        id: true,
        reference_id: true,
        type: true,
        status: true,
        due_payment_timestamp: true,
        charges: {
          select: {
            id: true,
            amount: true,
            is_taxed: true
          }
        },
        payment_history: {
          select: {
            amount: true
          }
        }
      },
      orderBy: {
        due_payment_timestamp: 'desc'
      }
    })

    // Compute display status
    const displayStatus = computeLeaseStatus({
      status: lease.status,
      start_date: lease.start_date,
      number_of_months: lease.number_of_months
    })

    // Format tenant name and contact
    const tenant = lease.tenants
    let tenantName: string
    let tenantPhone: string | null = null

    if (tenant.type === 'Company') {
      tenantName = tenant.company_tenants?.company_name || 'Unknown Company'
      tenantPhone = tenant.company_tenants?.phone_number || null
    } else {
      const individual = tenant.individual_tenants
      tenantName = individual?.last_name
        ? `${individual.first_name} ${individual.last_name}`
        : individual?.first_name || 'Unknown'
      tenantPhone = individual?.phone_number || null
    }
    // Email comes from the auth users table
    const tenantEmail = tenant.users?.email || null

    // Calculate end date
    const endDate = lease.number_of_months
      ? new Date(
          new Date(lease.start_date).setMonth(
            new Date(lease.start_date).getMonth() + lease.number_of_months
          )
        )
      : null

    // Get upcoming scheduled change (if any)
    const upcomingChange = lease.scheduled_rental_changes.find(
      sc => sc.status === 'Scheduled'
    )

    // Get upcoming lease end schedule (if any) and compute lapsed status
    const upcomingLeaseEnd = lease.lease_end_schedule.find(
      les => les.status === 'Current'
    )

    // Compute lapsed info for the upcoming lease end
    let upcomingLeaseEndData: {
      id: string
      scheduled_date: string
      is_lapsed: boolean
      days_until_dismissed: number | null
    } | null = null

    if (upcomingLeaseEnd) {
      const now = new Date()
      const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
      const scheduledStr = upcomingLeaseEnd.scheduled_date.toISOString().slice(0, 10)
      const isLapsed = scheduledStr < todayStr

      if (isLapsed) {
        const scheduledTime = new Date(scheduledStr + 'T12:00:00Z').getTime()
        const todayTime = new Date(todayStr + 'T12:00:00Z').getTime()
        const daysSinceLapsed = Math.floor((todayTime - scheduledTime) / (1000 * 60 * 60 * 24))

        if (daysSinceLapsed <= 3) {
          upcomingLeaseEndData = {
            id: upcomingLeaseEnd.id,
            scheduled_date: upcomingLeaseEnd.scheduled_date.toISOString(),
            is_lapsed: true,
            days_until_dismissed: 3 - daysSinceLapsed
          }
        }
        // If > 3 days, stays null (banner hidden)
      } else {
        upcomingLeaseEndData = {
          id: upcomingLeaseEnd.id,
          scheduled_date: upcomingLeaseEnd.scheduled_date.toISOString(),
          is_lapsed: false,
          days_until_dismissed: null
        }
      }
    }

    // Format payments with calculated amounts
    const formattedPayments = payments.map(p => {
      const totalAmount = p.charges.reduce((sum, c) => {
        const chargeAmount = Number(c.amount)
        const tax = c.is_taxed ? chargeAmount * 0.08 : 0
        return sum + chargeAmount + tax
      }, 0)
      const paidAmount = p.payment_history.reduce(
        (sum, h) => sum + Number(h.amount),
        0
      )

      return {
        id: p.id,
        reference_id: p.reference_id,
        type: p.type,
        status: p.status,
        due_date: p.due_payment_timestamp?.toISOString() || null,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        is_fully_paid: paidAmount >= totalAmount
      }
    })

    // Separate payments by type and status
    const pendingRental = formattedPayments.find(
      p => p.type === 'Rental' && p.status === 'Pending'
    )
    const recentPayments = formattedPayments.slice(0, 10)

    // Format recurring configs
    const recurringPayments = lease.recurring_configs.map(rc => {
      const latestPayment = rc.payments[0]
      let scheduleDescription = 'Monthly with rental payment'

      if (rc.every !== null && rc.time_unit !== null) {
        if (rc.time_unit === 'Week' && rc.event_on) {
          scheduleDescription = `Every ${rc.every} week${rc.every > 1 ? 's' : ''} on ${rc.event_on}`
        } else if (rc.time_unit === 'Month' && rc.event_on) {
          scheduleDescription = `Every ${rc.every} month${rc.every > 1 ? 's' : ''} on day ${rc.event_on}`
        }
      }

      return {
        id: rc.id,
        title: rc.title || 'Recurring Payment',
        schedule: scheduleDescription,
        is_fixed: rc.is_payment_fixed,
        latest_payment: latestPayment
          ? {
              reference_id: latestPayment.reference_id,
              status: latestPayment.status,
              due_date: latestPayment.due_payment_timestamp?.toISOString() || null,
              amount: latestPayment.charges.reduce(
                (sum, c) => sum + Number(c.amount),
                0
              )
            }
          : null
      }
    })

    return {
      lease: {
        id: lease.id,
        reference_id: lease.reference_id,
        status: displayStatus,
        db_status: lease.status,
        monthly_rent: Number(lease.monthly_rent),
        payment_day: lease.payment_day,
        start_date: lease.start_date.toISOString(),
        end_date: endDate?.toISOString() || null,
        number_of_months: lease.number_of_months,
        ended_at: lease.ended_at?.toISOString() || null,
        created_at: lease.created_at.toISOString(),
        is_property_lease: lease.room_id === null,
        tenant: {
          id: tenant.id,
          type: tenant.type,
          name: tenantName,
          phone: tenantPhone,
          email: tenantEmail,
          profile_thumb: tenant.profile_thumb
        },
        property: {
          id: lease.properties.id,
          code: lease.properties.code,
          address: lease.properties.street_address
        },
        room: lease.rooms
          ? {
              id: lease.rooms.id,
              title: lease.rooms.title
            }
          : null,
        transfer: {
          is_transferred_from: lease.is_transferred_from,
          is_transferred_to: lease.is_transferred_to,
          transferred_from_lease: lease.leases_leases_transferred_fromToleases
            ? {
                id: lease.leases_leases_transferred_fromToleases.id,
                reference_id:
                  lease.leases_leases_transferred_fromToleases.reference_id,
                property_id:
                  lease.leases_leases_transferred_fromToleases.property_id,
                room_id: lease.leases_leases_transferred_fromToleases.room_id,
                property_code:
                  lease.leases_leases_transferred_fromToleases.properties?.code || '',
                room_title:
                  lease.leases_leases_transferred_fromToleases.rooms?.title || null
              }
            : null,
          transferred_to_lease: lease.leases_leases_transferred_toToleases
            ? {
                id: lease.leases_leases_transferred_toToleases.id,
                reference_id:
                  lease.leases_leases_transferred_toToleases.reference_id,
                property_id:
                  lease.leases_leases_transferred_toToleases.property_id,
                room_id: lease.leases_leases_transferred_toToleases.room_id,
                property_code:
                  lease.leases_leases_transferred_toToleases.properties?.code || '',
                room_title:
                  lease.leases_leases_transferred_toToleases.rooms?.title || null
              }
            : null
        },
        reminders: {
          expiry: lease.is_expiry_reminder
            ? {
                enabled: true,
                days_before: lease.expiry_days_before_reminder
              }
            : { enabled: false },
          rent: lease.is_rent_reminder
            ? {
                enabled: true,
                days_before: lease.rent_reminder_days_before
              }
            : { enabled: false },
          overdue: lease.is_overdue_rent_reminder
            ? {
                enabled: true,
                days_after: lease.overdue_days_after_reminder
              }
            : { enabled: false }
        },
        late_charges: lease.late_payment_charges.map(lc => ({
          id: lc.id,
          days_after_due: lc.days_after_due,
          amount: Number(lc.amount)
        })),
        scheduled_changes: lease.scheduled_rental_changes.map(sc => ({
          id: sc.id,
          old_rent: Number(sc.old_monthly_rent),
          new_rent: Number(sc.new_monthly_rent),
          effective_from: sc.effective_from.toISOString(),
          status: sc.status,
          applied_at: sc.applied_at?.toISOString() || null,
          cancelled_at: sc.cancelled_at?.toISOString() || null,
          created_at: sc.created_at.toISOString()
        })),
        upcoming_change: upcomingChange
          ? {
              id: upcomingChange.id,
              old_rent: Number(upcomingChange.old_monthly_rent),
              new_rent: Number(upcomingChange.new_monthly_rent),
              effective_from: upcomingChange.effective_from.toISOString()
            }
          : null,
        scheduled_lease_ends: lease.lease_end_schedule.map(les => {
          // Compute display status: Current entries with past dates show as "Lapsed"
          let displayStatus = les.status as string
          if (les.status === 'Current') {
            const now = new Date()
            const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
            const scheduledStr = les.scheduled_date.toISOString().slice(0, 10)
            if (scheduledStr < todayStr) {
              displayStatus = 'Lapsed'
            }
          }
          return {
            id: les.id,
            scheduled_date: les.scheduled_date.toISOString(),
            status: displayStatus,
            created_at: les.created_at.toISOString(),
            cancelled_at: les.cancelled_at?.toISOString() || null
          }
        }),
        upcoming_lease_end: upcomingLeaseEndData,
        created_by: lease.staff
          ? {
              id: lease.staff.id,
              name: lease.staff.last_name
                ? `${lease.staff.first_name} ${lease.staff.last_name}`
                : lease.staff.first_name
            }
          : null
      },
      pending_rental: pendingRental || null,
      recent_payments: recentPayments,
      recurring_payments: recurringPayments
    }
  } catch (error) {
    console.error('Error fetching lease details:', error)
    return null
  }
}
