'use server'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { staff, error } = await getUserAndStaff()

    if (error) return error

    const { id: bookingId } = await params

    // Verify booking exists and belongs to the organization
    const booking = await prisma.bookings.findFirst({
      where: {
        id: bookingId,
        status: 'Current',
        properties: {
          organization_id: staff.organization_id
        }
      },
      select: { id: true, reference_id: true }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or already cancelled' },
        { status: 404 }
      )
    }

    await prisma.bookings.update({
      where: { id: bookingId },
      data: { status: 'Cancelled' }
    })

    return NextResponse.json({
      success: true,
      referenceId: booking.reference_id
    })
  } catch (error: any) {
    console.error('Error cancelling booking:', error)
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    )
  }
}
