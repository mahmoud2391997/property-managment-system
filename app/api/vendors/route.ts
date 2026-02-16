import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { NextResponse } from 'next/server'

export async function GET () {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const vendors = await prisma.vendors.findMany({
      where: {
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        name: true,
        phone_number: true,
        email: true
      }
    })

    return NextResponse.json(
      {
        success: true,
        vendors
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    )
  }
}

export async function POST (request: Request) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const body = await request.json()
    const { name, phoneNo, email } = body

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!phoneNo || !phoneNo.trim()) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const vendor = await prisma.vendors.create({
      data: {
        name: name.trim(),
        phone_number: phoneNo.trim(),
        email: email?.trim() || null,
        organization_id: staff.organization_id
      }
    })

    return NextResponse.json(
      {
        success: true,
        vendor: {
          id: vendor.id,
          name: vendor.name,
          phoneNo: vendor.phone_number,
          email: vendor.email
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating vendor:', error)
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    )
  }
}
