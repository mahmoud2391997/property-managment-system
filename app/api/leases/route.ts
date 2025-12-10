import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { computeLeaseStatus } from '@/utils/lease-status'

export async function GET(request: Request) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const roomId = searchParams.get('roomId')

    if (!propertyId && !roomId) {
      return NextResponse.json(
        { error: 'Property ID or Room ID is required' },
        { status: 400 }
      )
    }

    // Build where clause based on propertyId or roomId
    let whereClause: any = {}

    if (propertyId) {
      // Verify property belongs to the organization
      const property = await prisma.properties.findFirst({
        where: {
          id: propertyId,
          organization_id: staff.organization_id
        },
        select: { id: true }
      })

      if (!property) {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        )
      }
      // For property leases, get leases where property_id matches AND room_id is null
      whereClause.property_id = propertyId
      whereClause.room_id = null
    }

    if (roomId) {
      // Verify room belongs to the organization through its property
      const room = await prisma.rooms.findFirst({
        where: {
          id: roomId,
          properties: {
            organization_id: staff.organization_id
          }
        },
        select: { id: true }
      })

      if (!room) {
        return NextResponse.json(
          { error: 'Room not found' },
          { status: 404 }
        )
      }
      // For room leases, get leases where room_id matches
      whereClause.room_id = roomId
    }

    // Fetch leases with tenant details
    const leases = await prisma.leases.findMany({
      where: whereClause,
      select: {
        id: true,
        reference_id: true,
        start_date: true,
        number_of_months: true,
        monthly_rent: true,
        status: true,
        tenants: {
          select: {
            id: true,
            profile_thumb: true,
            individual_tenants: {
              select: {
                first_name: true,
                last_name: true
              }
            },
            company_tenants: {
              select: {
                company_name: true,
                contact_person_first_name: true,
                contact_person_last_name: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json({
      leases: leases.map(lease => {
        // Get tenant name - either from individual or company tenant
        const tenant = lease.tenants
        let firstName = ''
        let lastName: string | null = null

        if (tenant.individual_tenants) {
          firstName = tenant.individual_tenants.first_name
          lastName = tenant.individual_tenants.last_name
        } else if (tenant.company_tenants) {
          firstName = tenant.company_tenants.contact_person_first_name
          lastName = tenant.company_tenants.contact_person_last_name
        }

        // Compute display status based on dates
        const displayStatus = computeLeaseStatus({
          status: lease.status,
          start_date: lease.start_date,
          number_of_months: lease.number_of_months
        })

        return {
          id: lease.id,
          reference_id: lease.reference_id,
          start_date: lease.start_date.toISOString(),
          number_of_months: lease.number_of_months,
          monthly_rent: lease.monthly_rent,
          status: displayStatus,
          tenant: {
            id: tenant.id,
            first_name: firstName,
            last_name: lastName,
            profile_thumb: tenant.profile_thumb
          }
        }
      })
    })
  } catch (error: any) {
    console.error('Error fetching leases:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leases' },
      { status: 500 }
    )
  }
}
