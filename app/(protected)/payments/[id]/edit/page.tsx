export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import EditPaymentContent from './edit-payment-content'

type Props = {
  params: Promise<{ id: string }>
}

export type EditPaymentData = {
  id: string
  reference_id: string
  type: string
  status: string
  due_payment_timestamp: string | null
  payment_evidence: string | null
  charges: {
    id: string
    title: string
    amount: number
    is_taxed: boolean
    is_refunded: boolean
  }[]
  lease: {
    reference_id: string
    tenant_name: string
    property_code: string
    room_title: string | null
  } | null
}

async function getPaymentForEdit(referenceId: string): Promise<EditPaymentData | null> {
  try {
    const { data: { user } } = 

    if (!user) return null

    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { organization_id: true }
    })

    if (!staff) return null

    const payment = await prisma.payments.findFirst({
      where: {
        reference_id: referenceId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        reference_id: true,
        type: true,
        status: true,
        due_payment_timestamp: true,
        payment_evidence: true,
        charges: {
          select: {
            id: true,
            title: true,
            amount: true,
            is_taxed: true,
            is_refunded: true
          },
          orderBy: { created_at: 'asc' }
        },
        payment_history: {
          where: { status: 'Success' },
          select: { id: true }
        },
        leases: {
          select: {
            reference_id: true,
            properties: {
              select: { code: true }
            },
            rooms: {
              select: { title: true }
            },
            tenants: {
              select: {
                type: true,
                individual_tenants: {
                  select: { first_name: true, last_name: true }
                },
                company_tenants: {
                  select: { company_name: true }
                }
              }
            }
          }
        }
      }
    })

    if (!payment) return null

    // Cannot edit rental payments
    if (payment.type === 'Rental') return null

    // Cannot edit if there are successful payments
    if (payment.payment_history.length > 0) return null

    // Cannot edit cancelled payments
    if (payment.status === 'Cancelled') return null

    // Cannot edit if there's a pending FPX payment within 20-minute cooling period
    const pendingFpxHistory = await prisma.payment_history.findFirst({
      where: {
        payment_id: payment.id,
        status: 'Pending',
        payment_method: 'FPX',
        created_at: { gte: new Date(Date.now() - 20 * 60 * 1000) }
      },
      select: { id: true }
    })
    if (pendingFpxHistory) return null

    // Get tenant name
    let tenantName = 'N/A'
    const tenantData = payment.leases?.tenants
    if (tenantData) {
      if (tenantData.type === 'Individual' && tenantData.individual_tenants) {
        tenantName = `${tenantData.individual_tenants.first_name} ${tenantData.individual_tenants.last_name || ''}`.trim()
      } else if (tenantData.type === 'Company' && tenantData.company_tenants) {
        tenantName = tenantData.company_tenants.company_name
      }
    }

    return {
      id: payment.id,
      reference_id: payment.reference_id,
      type: payment.type,
      status: payment.status,
      due_payment_timestamp: payment.due_payment_timestamp?.toISOString() || null,
      payment_evidence: payment.payment_evidence,
      charges: payment.charges.map(c => ({
        id: c.id,
        title: c.title,
        amount: c.amount.toNumber(),
        is_taxed: c.is_taxed,
        is_refunded: c.is_refunded
      })),
      lease: payment.leases ? {
        reference_id: payment.leases.reference_id,
        tenant_name: tenantName,
        property_code: payment.leases.properties?.code || 'N/A',
        room_title: payment.leases.rooms?.title || null
      } : null
    }
  } catch (error) {
    console.error('Error fetching payment for edit:', error)
    return null
  }
}

export default async function EditPaymentPage({ params }: Props) {
  await requirePermission('payments.update')
  const { id } = await params
  const payment = await getPaymentForEdit(id)

  if (!payment) {
    notFound()
  }

  return <EditPaymentContent payment={payment} />
}
