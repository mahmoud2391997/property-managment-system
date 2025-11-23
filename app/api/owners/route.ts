import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST (request: Request) {
  try {
    const { user, staff, error } = await getUserAndStaff()

    if (error) return error

    const body = await request.json()
    const { firstName, lastName, phoneNo, email } = body

    // Validation
    if (!firstName || !firstName.trim()) {
      return NextResponse.json(
        { error: 'First name is required' },
        { status: 400 }
      )
    }

    if (!phoneNo || !phoneNo.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Create owner
    const owner = await prisma.owners.create({
      data: {
        first_name: firstName.trim(),
        last_name: lastName?.trim() || null,
        phone_number: phoneNo.trim(),
        email: email?.trim() || null,
        organization_id: staff.organization_id,
        created_by: user.id
      }
    })

    return NextResponse.json(
      {
        success: true,
        owner: {
          id: owner.id,
          firstName: owner.first_name,
          lastName: owner.last_name,
          phoneNo: owner.phone_number,
          email: owner.email
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating owner:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create owner' },
      { status: 500 }
    )
  }
}
