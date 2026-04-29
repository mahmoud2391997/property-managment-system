import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import { isLeaseActive } from '@/utils/lease-status'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'properties.access'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id: propertyId } = await params

    // Fetch property with active lease (property-level only, room_id = null)
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        code: true,
        leases: {
          where: {
            room_id: null, // Property-level lease only
            status: 'Current'
          },
          select: {
            id: true,
            reference_id: true,
            start_date: true,
            number_of_months: true,
            tenants: {
              select: {
                id: true,
                individual_tenants: {
                  select: { first_name: true, last_name: true }
                },
                company_tenants: {
                  select: { company_name: true }
                }
              }
            }
          },
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const lease = property.leases[0]

    // Check if lease exists and is truly active
    if (
      !lease ||
      !isLeaseActive({
        status: 'Current',
        start_date: lease.start_date,
        number_of_months: lease.number_of_months
      })
    ) {
      return NextResponse.json({ hasActiveLease: false })
    }

    // Build tenant name
    const tenantName = lease.tenants.individual_tenants
      ? `${lease.tenants.individual_tenants.first_name} ${lease.tenants.individual_tenants.last_name || ''}`.trim()
      : lease.tenants.company_tenants?.company_name || 'Unknown'

    return NextResponse.json({
      hasActiveLease: true,
      leaseReferenceId: lease.reference_id,
      tenantId: lease.tenants.id,
      tenantName,
      propertyCode: property.code
    })
  } catch (error: any) {
    console.error('Error fetching active lease:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active lease' },
      { status: 500 }
    )
  }
}
