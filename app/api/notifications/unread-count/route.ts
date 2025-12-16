import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ count: 0 })
    }

    const count = await prisma.notifications.count({
      where: {
        user_id: user.id,
        is_read: false
      }
    })

    return NextResponse.json({ count })
  } catch (error: any) {
    console.error('Error fetching unread notifications count:', error)
    return NextResponse.json({ count: 0 })
  }
}
