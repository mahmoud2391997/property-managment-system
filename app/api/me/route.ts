import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    user: {
      id: 'demo-user-id',
      email: 'demo@tenancypilot.com'
    },
    staff: {
      id: 'demo-staff-id',
      organization_id: 'demo-org-id'
    },
    role: 'Owner',
    permissions: [
      'dashboard.access',
      'projects.access',
      'properties.access',
      'rooms.access',
      'payments.access',
      'expenses.access',
      'tenants.access',
      'owners.access',
      'agents.access',
      'vendors.access',
      'staff.access',
      'tenant_screening.access',
      'tickets.access',
      'tasks.access',
      'notices.access',
      'notifications.access',
      'reports.access'
    ]
  })
}
