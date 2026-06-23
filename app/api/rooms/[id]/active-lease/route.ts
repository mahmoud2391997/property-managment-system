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


    if (!hasPermission(permissions, 'rooms.access'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { id: roomId } = await params

    // Fetch room with active lease
    const room = await prisma.rooms.findFirst({
      where: {
        id: roomId,
        properties: {
          organization_id: staff.organization_id
        }
      },
      select: {
        id: true,
        title: true,
        properties: {
          select: {
            id: true,
            code: true
          }
        },
        leases: {
          where: {
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

    if (!room || !room.properties) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const lease = room.leases[0]

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
      roomTitle: room.title,
      propertyCode: room.properties.code,
      propertyId: room.properties.id
    })
  } catch (error: any) {
    console.error('Error fetching active lease:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active lease' },
      { status: 500 }
    )
  }
}
