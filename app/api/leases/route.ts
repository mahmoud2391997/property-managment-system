import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET(request: Request) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

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

    // Fetch leases for this property with tenant details
    const leases = await prisma.leases.findMany({
      where: {
        property_id: propertyId
      },
      select: {
        id: true,
        reference_id: true,
        start_date: true,
        number_of_months: true,
        leave_day: true,
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

        return {
          id: lease.id,
          reference_id: lease.reference_id,
          start_date: lease.start_date.toISOString(),
          number_of_months: lease.number_of_months,
          leave_day: lease.leave_day,
          monthly_rent: lease.monthly_rent,
          status: lease.status,
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
