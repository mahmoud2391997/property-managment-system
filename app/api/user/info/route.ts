import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    userType: 'staff',
    firstName: 'Demo',
    lastName: 'User',
    profileThumb: null,
    role: 'Owner',
    user: { id: 'demo-user-id', email: 'demo@tenancypilot.com', lastSignIn: new Date().toISOString() },
    staff: { id: 'demo-staff-id', organization_id: 'demo-org-id', organization_name: 'Demo Org' },
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

