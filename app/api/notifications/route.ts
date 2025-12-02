'use server'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function GET () {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch notifications for this user
    const notifications = await prisma.notifications.findMany({
      where: {
        user_id: user.id
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 50
    })

    // Get performer details for notifications that have a performer
    const performerIds = notifications
      .filter(n => n.performer_id && n.performer_type)
      .map(n => ({ id: n.performer_id!, type: n.performer_type! }))

    // Fetch staff performers
    const staffIds = performerIds
      .filter(p => p.type === 'staff')
      .map(p => p.id)

    const staffPerformers = staffIds.length > 0
      ? await prisma.staff.findMany({
          where: { id: { in: staffIds } },
          select: { id: true, first_name: true, last_name: true, profile_thumb: true }
        })
      : []

    // Fetch tenant performers
    const tenantIds = performerIds
      .filter(p => p.type === 'tenant')
      .map(p => p.id)

    const tenantPerformers = tenantIds.length > 0
      ? await prisma.tenants.findMany({
          where: { id: { in: tenantIds } },
          select: {
            id: true,
            profile_thumb: true,
            type: true,
            individual_tenants: {
              select: { first_name: true, last_name: true }
            },
            company_tenants: {
              select: { company_name: true }
            }
          }
        })
      : []

    // Create lookup maps
    const staffMap = new Map(staffPerformers.map(s => [s.id, s]))
    const tenantMap = new Map(tenantPerformers.map(t => [t.id, t]))

    // Transform notifications
    const transformedNotifications = notifications.map(n => {
      let performerName: string | null = null
      let performerPicture: string | null = null

      if (n.performer_id && n.performer_type) {
        if (n.performer_type === 'staff') {
          const staff = staffMap.get(n.performer_id)
          if (staff) {
            performerName = `${staff.first_name} ${staff.last_name || ''}`.trim()
            performerPicture = staff.profile_thumb
          }
        } else if (n.performer_type === 'tenant') {
          const tenant = tenantMap.get(n.performer_id)
          if (tenant) {
            if (tenant.type === 'Individual' && tenant.individual_tenants) {
              performerName = `${tenant.individual_tenants.first_name} ${tenant.individual_tenants.last_name || ''}`.trim()
            } else if (tenant.type === 'Company' && tenant.company_tenants) {
              performerName = tenant.company_tenants.company_name
            }
            performerPicture = tenant.profile_thumb
          }
        } else if (n.performer_type === 'system') {
          performerName = 'System'
        }
      }

      return {
        id: n.id,
        title: n.title,
        message: n.message,
        reference_id: n.reference_id,
        reference_type: n.reference_type,
        is_read: n.read ?? false,
        created_at: n.created_at?.toISOString() ?? new Date().toISOString(),
        page: n.page,
        performer_name: performerName,
        performer_picture: performerPicture
      }
    })

    return NextResponse.json(transformedNotifications)
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// Mark all notifications as read
export async function PATCH () {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mark all unread notifications as read
    await prisma.notifications.updateMany({
      where: {
        user_id: user.id,
        read: false
      },
      data: {
        read: true
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error marking notifications as read:', error)
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
  }
}
