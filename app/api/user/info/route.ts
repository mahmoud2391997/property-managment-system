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
        roles: {
          select: {
            title: true
          }
        }
      }
    })

    if (staff) {
      return NextResponse.json({
        userType: 'staff',
        firstName: staff.first_name,
        lastName: staff.last_name,
        profileThumb: staff.profile_thumb,
        role: staff.roles?.title || 'Staff'
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

      return NextResponse.json({
        userType: 'tenant',
        firstName,
        lastName,
        profileThumb: tenant.profile_thumb,
        role: 'Tenant'
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
