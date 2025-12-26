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
    const { report, attachment } = body

    if (!report || report.trim().length === 0) {
      return NextResponse.json(
        { error: 'Resolution report is required' },
        { status: 400 }
      )
    }

    // Validate minimum length (database constraint)
    if (report.trim().length < 10) {
      return NextResponse.json(
        { error: 'Resolution report must be at least 10 characters' },
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
      },
      include: {
        task_statuses: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const currentStatus = task.task_statuses[0]?.state || 'Open'
    if (currentStatus === 'Resolved') {
      return NextResponse.json(
        { error: 'Task is already resolved' },
        { status: 400 }
      )
    }

    const now = new Date()
    const currentStaffName = `${currentStaff.first_name} ${currentStaff.last_name || ''}`.trim()

    // Create status first, then report (to avoid trigger blocking status creation after report exists)
    const [statusEntry, reportEntry] = await prisma.$transaction([
      prisma.task_statuses.create({
        data: {
          task_id: taskId,
          state: 'Resolved'
        }
      }),
      prisma.task_reports.create({
        data: {
          task_id: taskId,
          content: report,
          attachment: attachment?.url || null,
          submitted_by: currentStaff.id
        }
      })
    ])

    const statusMap: Record<string, string> = {
      Open: 'Open',
      In_Progress: 'In Progress',
      Resolved: 'Resolved'
    }

    return NextResponse.json({
      success: true,
      report: {
        content: report,
        attachment: attachment ? { name: attachment.name, url: attachment.url } : undefined,
        submittedAt: now.toISOString(),
        submittedById: currentStaff.id,
        submittedByName: currentStaffName
      },
      events: [
        {
          id: `evt-report-${reportEntry.id}`,
          type: 'report_submitted',
          performerId: currentStaff.id,
          performerName: currentStaffName,
          performerAvatar: currentStaff.profile_pic,
          message: report,
          attachment: attachment ? { name: attachment.name, url: attachment.url } : undefined,
          timestamp: now.toISOString()
        },
        {
          id: `evt-status-${statusEntry.id}`,
          type: 'status_changed',
          performerId: currentStaff.id,
          performerName: currentStaffName,
          performerAvatar: currentStaff.profile_pic,
          timestamp: now.toISOString(),
          oldValue: statusMap[currentStatus] || currentStatus,
          newValue: 'Resolved'
        }
      ],
      newStatus: 'Resolved'
    })
  } catch (error: any) {
    console.error('Error resolving task:', error)
    return NextResponse.json(
      { error: 'Failed to resolve task' },
      { status: 500 }
    )
  }
}
