import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  try {
    const { staff, permissions, error } = await getUserAndStaff()

    if (error) return error


    if (!hasPermission(permissions, 'leases.update_agent'))

      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const body = await request.json()
    const { lease_id, agent_id } = body

    if (!lease_id || !agent_id) {
      return NextResponse.json(
        { error: 'Lease ID and Agent ID are required' },
        { status: 400 }
      )
    }

    // Verify lease belongs to the organization
    const lease = await prisma.leases.findFirst({
      where: {
        id: lease_id,
        organization_id: staff.organization_id
      },
      select: { id: true }
    })

    if (!lease) {
      return NextResponse.json(
        { error: 'Lease not found' },
        { status: 404 }
      )
    }

    // Verify agent belongs to the organization
    const agent = await prisma.agents.findFirst({
      where: {
        id: agent_id,
        organization_id: staff.organization_id
      },
      select: { id: true, first_name: true, last_name: true }
    })

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      )
    }

    // Update the lease's agent
    await prisma.leases.update({
      where: { id: lease_id },
      data: { agent_id }
    })

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: `${agent.first_name} ${agent.last_name || ''}`.trim()
      }
    })
  } catch (error: any) {
    console.error('Error updating lease agent:', error)
    return NextResponse.json(
      { error: 'Failed to update lease agent' },
      { status: 500 }
    )
  }
}
