import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { redirect } from 'next/navigation'
import LeaseDetailsContent from '@/components/lease-details/lease-details-content'
import { getLeaseDetails } from '@/utils/get-lease-details'

type Props = {
  params: Promise<{ id: string; leaseId: string }>
}

export type LeaseDetailsData = {
  lease: {
    id: string
    reference_id: string
    status: string
    db_status: string
    monthly_rent: number
    payment_day: number
    start_date: string
    end_date: string | null
    number_of_months: number | null
    ended_at: string | null
    created_at: string
    is_property_lease: boolean
    tenant: {
      id: string
      type: string
      name: string
      phone: string | null
      profile_thumb: string | null
    }
    property: {
      id: string
      code: string
      address: string | null
    }
    room: {
      id: string
      title: string
    } | null
    transfer: {
      is_transferred_from: boolean
      is_transferred_to: boolean
      transferred_from_lease: {
        id: string
        reference_id: string
        property_id: string
        room_id: string | null
        property_code: string
        room_title: string | null
      } | null
      transferred_to_lease: {
        id: string
        reference_id: string
        property_id: string
        room_id: string | null
        property_code: string
        room_title: string | null
      } | null
    }
    reminders: {
      expiry: { enabled: boolean; days_before?: number | null }
      rent: { enabled: boolean; days_before?: number | null }
      overdue: { enabled: boolean; days_after?: number | null }
    }
    late_charges: Array<{
      id: string
      days_after_due: number
      amount: number
    }>
    scheduled_changes: Array<{
      id: string
      old_rent: number
      new_rent: number
      effective_from: string
      status: string
      applied_at: string | null
      cancelled_at: string | null
      created_at: string
    }>
    upcoming_change: {
      id: string
      old_rent: number
      new_rent: number
      effective_from: string
    } | null
    created_by: {
      id: string
      name: string
    } | null
  }
  pending_rental: {
    id: string
    reference_id: string
    type: string
    status: string
    due_date: string | null
    total_amount: number
    paid_amount: number
    is_fully_paid: boolean
  } | null
  recent_payments: Array<{
    id: string
    reference_id: string
    type: string
    status: string
    due_date: string | null
    total_amount: number
    paid_amount: number
    is_fully_paid: boolean
  }>
  recurring_payments: Array<{
    id: string
    title: string
    schedule: string
    is_fixed: boolean
    latest_payment: {
      reference_id: string
      status: string
      due_date: string | null
      amount: number
    } | null
  }>
}

export default async function LeaseDetailsPage({ params }: Props) {
  const { staff, error } = await getUserAndStaff()

  if (error) {
    redirect('/login')
  }

  const { id: propertyId, leaseId } = await params

  const data = await getLeaseDetails(leaseId, staff.organization_id)

  if (!data) {
    redirect(`/properties/${propertyId}/leases`)
  }

  return (
    <LeaseDetailsContent
      data={data}
      sourceType="property"
      sourceId={propertyId}
    />
  )
}
