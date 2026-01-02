'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()
    if (error) return error

    const { id: propertyId } = await params

    // First verify the property belongs to the organization
    const property = await prisma.properties.findFirst({
      where: {
        id: propertyId,
        organization_id: staff.organization_id
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Find the active flow instance for this property
    const flowInstance = await prisma.task_flow_instances.findFirst({
      where: {
        property_id: propertyId,
        status: 'In Progress'
      },
      select: {
        inspection_task_id: true
      }
    })

    if (!flowInstance || !flowInstance.inspection_task_id) {
      return NextResponse.json({ inspectionTaskId: null })
    }

    return NextResponse.json({
      inspectionTaskId: flowInstance.inspection_task_id
    })
  } catch (error: any) {
    console.error('Error fetching inspection task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inspection task' },
      { status: 500 }
    )
  }
}
