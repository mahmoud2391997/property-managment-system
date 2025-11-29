import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ leaseId: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { leaseId } = await params

    // Verify lease exists and belongs to the organization
    const lease = await prisma.leases.findFirst({
      where: {
        id: leaseId,
        organization_id: staff.organization_id
      },
      select: {
        id: true,
        status: true
      }
    })

    if (!lease) {
      return NextResponse.json(
        { error: 'Lease not found' },
        { status: 404 }
      )
    }

    // Check if lease is already ended
    if (lease.status === 'Ended') {
      return NextResponse.json(
        { error: 'Lease is already ended' },
        { status: 400 }
      )
    }

    // Update lease status to Ended and cancel all pending payments
    await prisma.$transaction(async (tx) => {
      // Update lease status
      await tx.leases.update({
        where: { id: leaseId },
        data: { status: 'Ended' }
      })

      // Cancel all pending payments for this lease
      await tx.payments.updateMany({
        where: {
          lease_id: leaseId,
          status: 'Pending'
        },
        data: {
          status: 'Cancelled'
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Lease ended successfully'
    })
  } catch (error: any) {
    console.error('Error ending lease:', error)
    return NextResponse.json(
      { error: 'Failed to end lease' },
      { status: 500 }
    )
  }
}
