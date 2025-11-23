'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function getUserAndStaff() {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const staff = await prisma.staff.findUnique({
    where: { id: user.id },
    select: { organization_id: true }
  })

  if (!staff) {
    return {
      error: NextResponse.json(
        { error: 'Staff record not found' },
        { status: 404 }
      )
    }
  }

  return { user, staff }
}
