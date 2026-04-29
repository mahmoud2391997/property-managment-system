'use server'

import { cache } from 'react'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { getCached, setCached } from '@/lib/permissions-cache'

type StaffInfo = { id: string; organization_id: string }

type Success = {
  user: NonNullable<
    Awaited<ReturnType<typeof createClient>>['auth']['getUser']
  > extends any
    ? any
    : never
  staff: StaffInfo
  permissions: Set<string>
  role: string | null
  error: null
}

type Failure = {
  user: null
  staff: null
  permissions: Set<string>
  role: null
  error: NextResponse
}

async function getUserAndStaffInternal(): Promise<Success | Failure> {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      user: null,
      staff: null,
      permissions: new Set(),
      role: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Fast path — cache hit
  const cached = getCached(user.id)
  if (cached) {
    const staff = await prisma.staff.findUnique({
      where: { id: user.id },
      select: { id: true, organization_id: true }
    })
    if (!staff) {
      return {
        user: null,
        staff: null,
        permissions: new Set(),
        role: null,
        error: NextResponse.json({ error: 'Staff record not found' }, { status: 404 })
      }
    }
    return { user, staff, permissions: cached, role: null, error: null }
  }

  // Cold path — Prisma join to build the permission set
  const row = await prisma.staff.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      organization_id: true,
      role_id: true,
      roles: {
        select: {
          title: true
        }
      }
    }
  })

  if (!row) {
    return {
      user: null,
      staff: null,
      permissions: new Set(),
      role: null,
      error: NextResponse.json({ error: 'Staff record not found' }, { status: 404 })
    }
  }

  const permissionRows = row.role_id
    ? await prisma.$queryRaw<Array<{ module: string; action: string }>>`
        SELECT p.module, p.action
        FROM public.roles_permissions rp
        JOIN public.permissions p ON p.id = rp.permission_id
        WHERE rp.role_id = ${row.role_id}::uuid
      `
    : []

  const permissions = new Set<string>(
    permissionRows.map((perm) => `${perm.module}.${perm.action}`.trim().toLowerCase())
  )

  setCached(user.id, row.role_id, permissions)

  return {
    user,
    staff: { id: row.id, organization_id: row.organization_id },
    permissions,
    role: row.roles?.title ?? null,
    error: null
  }
}

// React cache() wrapper for deduplication within a single request
export const getUserAndStaff = cache(getUserAndStaffInternal)
