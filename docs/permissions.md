# Permissions System Implementation

## Overview

This document provides a reference for the role-based permission system implemented in TenancyPilot. The system enforces 103 permissions across 18 modules.

## Architecture

### Three Enforcement Layers

1. **Proxy Layer** (`utils/supabase/proxy.ts`) - Authentication only
2. **Server Components** - Page-level protection using `requirePermission()`
3. **API Routes** - Action-level protection using `hasPermission()`

### Core Files

- `lib/permissions-catalog.ts` - Static list of all 103 permissions
- `lib/permissions-cache.ts` - 30-second TTL cache with invalidation
- `lib/has-permission.ts` - Pure helper functions for API routes
- `lib/server-permissions.ts` - Server-side `requirePermission()` wrapper
- `hooks/use-permissions.ts` - Client-side permission hook
- `contexts/user-context.tsx` - React context for permissions

## Permission Format

Permissions follow the format: `module.action`

### Access Permissions
- `module.access` - Base access to view module pages
- Required for all other actions in the module

### Action Permissions
- `module.create` - Create new records
- `module.update` - Edit existing records  
- `module.delete` - Delete records
- `module.*` - Module-specific actions (end, transfer, approve, etc.)

## Modules & Permissions

| Module | Access | Create | Update | Delete | Other Actions |
|--------|--------|--------|--------|--------|---------------|
| dashboard | dashboard.access | - | - | - | - |
| projects | projects.access | projects.create | projects.update | projects.delete | - |
| properties | properties.access | properties.create | properties.update | properties.delete | - |
| rooms | rooms.access | rooms.create | rooms.update | rooms.delete | - |
| leases | leases.access | leases.create | leases.update | leases.delete | leases.end, leases.transfer |
| bookings | bookings.access | bookings.create | bookings.update | bookings.delete | bookings.cancel |
| contracts | contracts.access | contracts.create | contracts.update | contracts.delete | - |
| payments | payments.access | payments.create | payments.update | payments.delete | payments.refund |
| expenses | expenses.access | expenses.create | expenses.update | expenses.delete | expenses.approve |
| tenants | tenants.access | tenants.create | tenants.update | tenants.delete | - |
| owners | owners.access | owners.create | owners.update | owners.delete | - |
| agents | agents.access | agents.create | agents.update | agents.delete | - |
| vendors | vendors.access | vendors.create | vendors.update | vendors.delete | - |
| staff | staff.access | staff.create | staff.update | staff.delete | - |
| roles | roles.access | roles.create | roles.update | roles.delete | - |
| tasks | tasks.access | tasks.create | tasks.update | tasks.delete | tasks.assign, tasks.complete |
| tickets | tickets.access | tickets.create | tickets.update | tickets.delete | tickets.assign, tickets.resolve |
| notices | notices.access | notices.create | notices.update | notices.delete | notices.publish |
| notifications | notifications.access | notifications.create | notifications.update | notifications.delete | notifications.send |
| reports | reports.access | reports.create | reports.update | reports.delete | reports.export |
| views | views.access | views.create | views.update | views.delete | - |
| tenant_screening | tenant_screening.access | tenant_screening.create | tenant_screening.update | tenant_screening.delete | tenant_screening.approve |
| recurring | recurring.access | recurring.create | recurring.update | recurring.delete | - |
| financial | financial.access | - | - | - | financial.overview, financial.reports |

## Usage Examples

### Server Components
```tsx
import { requirePermission } from '@/lib/server-permissions'

export default async function DashboardPage() {
  await requirePermission('dashboard.access')
  // ... rest of component
}
```

### API Routes
```tsx
import { hasPermission } from '@/lib/has-permission'
import { getUserAndStaff } from '@/utils/getUserAndStaff'

export async function GET() {
  const { user, staff, permissions, error } = await getUserAndStaff()
  if (error) return error
  
  if (!hasPermission(permissions, 'properties.access'))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  
  // ... rest of handler
}
```

### Client Components
```tsx
import { usePermissions } from '@/hooks/use-permissions'

export default function SomeComponent() {
  const { can } = usePermissions()
  
  return (
    <>
      {can('properties.create') && (
        <Button>Create Property</Button>
      )}
    </>
  )
}
```

## UI Patterns

### Pattern A - Page Protection
Server components use `requirePermission()` at the top

### Pattern B - API Protection  
API routes use `hasPermission()` after `getUserAndStaff()`

### Pattern C - Button/Action Gating
Client components wrap actions with `can()` checks

### Pattern D - Tab Filtering
Tab bars filter tabs by `can(sub_module_permission)`

### Pattern E - Card Gating
Embedded cards wrapped in `<PermissionGate>` with fallback

### Pattern F - Cache Invalidation
Role/staff changes invalidate permission cache immediately

### Pattern G - Sidebar Filtering
Menu items filtered by `can()` with parent hiding logic

## Cache Management

### TTL Cache
- 30-second TTL for permission lookups
- Automatic refresh on expiration
- Improves performance by avoiding DB hits

### Invalidation
- `invalidate(staffId)` - Single staff member role change
- `invalidateByRole(roleId)` - Role permissions change
- Called after successful DB writes in role/staff PATCH handlers

## Admin UI

### Role Management
- `/staff/roles` - Create, edit, delete roles
- Module-grouped permission checkboxes
- Owner role is read-only and cannot be deleted
- Bulk permission selection by module

### Permission Assignment
- Each role can have any combination of permissions
- Owner role automatically gets all permissions
- Staff can be assigned to any role

## Migration Notes

### Seed Scripts
- `bun run seed:permissions` - Populate permissions table
- `bun run seed:owner-role` - Create Owner role with all permissions

### Proxy Cleanup
- Removed `RESTRICTED_STAFF_EMAILS` restrictions
- Two previously restricted users now use real roles
- Proxy now handles authentication only

## Testing

### Verification Steps
1. Log in as Owner - should see everything
2. Create test role with limited permissions
3. Assign test role to staff member
4. Verify restricted access to pages/APIs
5. Test role changes and cache invalidation

### Expected Behavior
- Unauthorized pages redirect to `/unauthorized`
- Unauthorized API calls return 403
- Sidebar hides items without access
- Tabs hide without module access
- Cards show fallback UI without access
