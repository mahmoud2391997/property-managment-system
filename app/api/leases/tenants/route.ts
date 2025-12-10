import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET() {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    // Fetch tenants that belong to this organization via organizations_tenants
    const organizationTenants = await prisma.organizations_tenants.findMany({
      where: {
        organization_id: staff.organization_id
      },
      select: {
        tenant_id: true,
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
      }
    })

    // Transform to ComboBoxitemsType format
    const tenants = organizationTenants.map(ot => {
      const tenant = ot.tenants
      let label = ''
      let subtitle = ''

      if (tenant.individual_tenants) {
        label = tenant.individual_tenants.last_name
          ? `${tenant.individual_tenants.first_name} ${tenant.individual_tenants.last_name}`
          : tenant.individual_tenants.first_name
        subtitle = 'Individual'
      } else if (tenant.company_tenants) {
        label = tenant.company_tenants.company_name
        const contactName = tenant.company_tenants.contact_person_last_name
          ? `${tenant.company_tenants.contact_person_first_name} ${tenant.company_tenants.contact_person_last_name}`
          : tenant.company_tenants.contact_person_first_name
        subtitle = `Company • ${contactName}`
      }

      return {
        id: tenant.id,
        label,
        subtitle,
        avatar: tenant.profile_thumb || undefined
      }
    })

    return NextResponse.json({ tenants })
  } catch (error: any) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}
