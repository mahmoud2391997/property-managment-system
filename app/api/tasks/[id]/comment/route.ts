'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserAndStaff } from '@/utils/getUserAndStaff'
import { hasPermission } from '@/lib/has-permission'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const body = await request.json()
    const { message, attachment } = body

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment message is required' },
        { status: 400 }
      )
    }

    const { staff: baseStaff, permissions, error } = await getUserAndStaff()
    if (error) return error as NextResponse
    if (!hasPermission(permissions, 'tasks.update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get current staff info
    const currentStaff = await prisma.staff.findUnique({
      where: { id: baseStaff.id },
      select: { id: true, organization_id: true, first_name: true, last_name: true, profile_pic: true }
    })

    if (!currentStaff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Verify task belongs to organization
    const task = await prisma.tasks.findFirst({
      where: {
        id: taskId,
        organization_id: currentStaff.organization_id
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const currentStaffName = `${currentStaff.first_name} ${currentStaff.last_name || ''}`.trim()

    // Create comment
    const comment = await prisma.task_comments.create({
      data: {
        task_id: taskId,
        message: message,
        attachment: attachment || null,
        sender_id: currentStaff.id
      }
    })

    return NextResponse.json({
      success: true,
      comment: {
        id: comment.id,
        message: comment.message,
        attachment: comment.attachment,
        createdAt: comment.created_at.toISOString(),
        senderName: currentStaffName,
        senderAvatar: currentStaff.profile_pic
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    )
  }
}
