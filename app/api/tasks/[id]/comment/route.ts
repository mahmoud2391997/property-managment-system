'use server'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

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

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current staff info
    const currentStaff = await prisma.staff.findUnique({
      where: { id: user.id },
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
        attachment: attachment?.url || null,
        sender_id: currentStaff.id
      }
    })

    return NextResponse.json({
      success: true,
      event: {
        id: `evt-comment-${comment.id}`,
        type: 'comment',
        performerId: currentStaff.id,
        performerName: currentStaffName,
        performerAvatar: currentStaff.profile_pic,
        message: message,
        attachment: attachment ? { name: attachment.name, url: attachment.url } : undefined,
        timestamp: comment.created_at.toISOString()
      }
    })
  } catch (error: any) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    )
  }
}
