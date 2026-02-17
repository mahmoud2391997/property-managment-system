import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { NextResponse } from 'next/server'

export async function GET () {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const agents = await prisma.agents.findMany({
      where: {
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        email: true,
        _count: {
          select: {
            leases: true
          }
        }
      }
    })

    return NextResponse.json(
      {
        success: true,
        agents
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error fetching agents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    )
  }
}

export async function POST (request: Request) {
  try {
    const { staff, error } = await getUserAndStaff()

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

    const agent = await prisma.agents.create({
      data: {
        first_name: firstName.trim(),
        last_name: lastName?.trim() || null,
        phone_number: phoneNo.trim(),
        email: email?.trim() || null,
        organization_id: staff.organization_id
      }
    })

    return NextResponse.json(
      {
        success: true,
        agent: {
          id: agent.id,
          firstName: agent.first_name,
          lastName: agent.last_name,
          phoneNo: agent.phone_number,
          email: agent.email
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating agent:', error)
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    )
  }
}
