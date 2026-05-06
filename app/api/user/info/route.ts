import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is staff
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        profile_thumb: true,
        role_id: true,
        organization_id: true,
        roles: {
          select: {
            title: true
          }
        }
      }
    })

    if (staff) {
      // Get user permissions
      const permissions = await prisma.$queryRaw`
        SELECT p.title
        FROM roles_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ${staff.role_id}::uuid
      ` as { title: string }[]

      // Fetch organization name
      let orgName = 'N/A'
      if (staff.organization_id) {
        const org = await prisma.organizations.findUnique({
          where: { id: staff.organization_id },
          select: { title: true }
        })
        orgName = org?.title || 'N/A'
      }

      return NextResponse.json({
        userType: 'staff',
        firstName: staff.first_name,
        lastName: staff.last_name,
        profileThumb: staff.profile_thumb,
        role: staff.roles?.title || 'Staff',
        user: { id: user.id, email: user.email, lastSignIn: user.last_sign_in_at },
        staff: { id: staff.id, organization_id: staff.organization_id || '', organization_name: orgName },
        permissions: permissions.map(p => p.title)
      })
    }

    // Check if user is tenant
    const tenant = await prisma.tenants.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        type: true,
        profile_thumb: true,
        individual_tenants: {
          select: {
            first_name: true,
            last_name: true
          }
        },
        company_tenants: {
          select: {
            contact_person_first_name: true,
            contact_person_last_name: true
          }
        }
      }
    })

    if (tenant) {
      let firstName = ''
      let lastName = ''

      if (tenant.type === 'Individual' && tenant.individual_tenants) {
        firstName = tenant.individual_tenants.first_name
        lastName = tenant.individual_tenants.last_name || ''
      } else if (tenant.type === 'Company' && tenant.company_tenants) {
        firstName = tenant.company_tenants.contact_person_first_name
        lastName = tenant.company_tenants.contact_person_last_name || ''
      }

      const activeLeasesCount = await prisma.leases.count({
        where: {
          tenant_id: tenant.id,
          status: 'Current'
        }
      })

      return NextResponse.json({
        userType: 'tenant',
        firstName,
        lastName,
        profileThumb: tenant.profile_thumb,
        role: 'Tenant',
        user: { id: user.id, email: user.email, lastSignIn: user.last_sign_in_at },
        tenant: { id: tenant.id, active_leases_count: activeLeasesCount }
      })
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  } catch (error: any) {
    console.error('Error fetching user info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user info' },
      { status: 500 }
    )
  }
}
